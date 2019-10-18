/**
 * @license AngularJS v1.7.8
 * (c) 2010-2018 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

var $resourceMinErr = angular.$$minErr('$resource');

// Helper functions and regex to lookup a dotted path on an object
// stopping at undefined/null.  The path must be composed of ASCII
// identifiers (just like $parse)
var MEMBER_NAME_REGEX = /^(\.[a-zA-Z_$@][0-9a-zA-Z_$@]*)+$/;

function isValidDottedPath(path) {
  return (path != null && path !== '' && path !== 'hasOwnProperty' &&
      MEMBER_NAME_REGEX.test('.' + path));
}

function lookupDottedPath(obj, path) {
  if (!isValidDottedPath(path)) {
    throw $resourceMinErr('badmember', 'Dotted member path "@{0}" is invalid.', path);
  }
  var keys = path.split('.');
  for (var i = 0, ii = keys.length; i < ii && angular.isDefined(obj); i++) {
    var key = keys[i];
    obj = (obj !== null) ? obj[key] : undefined;
  }
  return obj;
}

/**
 * Create a shallow copy of an object and clear other fields from the destination
 */
function shallowClearAndCopy(src, dst) {
  dst = dst || {};

  angular.forEach(dst, function(value, key) {
    delete dst[key];
  });

  for (var key in src) {
    if (src.hasOwnProperty(key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
      dst[key] = src[key];
    }
  }

  return dst;
}

/**
 * @ngdoc module
 * @name ngResource
 * @description
 *
 * The `ngResource` module provides interaction support with RESTful services
 * via the $resource service.
 *
 * See {@link ngResource.$resourceProvider} and {@link ngResource.$resource} for usage.
 */

/**
 * @ngdoc provider
 * @name $resourceProvider
 *
 * @description
 *
 * Use `$resourceProvider` to change the default behavior of the {@link ngResource.$resource}
 * service.
 *
 * ## Dependencies
 * Requires the {@link ngResource } module to be installed.
 *
 */

/**
 * @ngdoc service
 * @name $resource
 * @requires $http
 * @requires ng.$log
 * @requires $q
 * @requires ng.$timeout
 *
 * @description
 * A factory which creates a resource object that lets you interact with
 * [RESTful](http://en.wikipedia.org/wiki/Representational_State_Transfer) server-side data sources.
 *
 * The returned resource object has action methods which provide high-level behaviors without
 * the need to interact with the low level {@link ng.$http $http} service.
 *
 * Requires the {@link ngResource `ngResource`} module to be installed.
 *
 * By default, trailing slashes will be stripped from the calculated URLs,
 * which can pose problems with server backends that do not expect that
 * behavior.  This can be disabled by configuring the `$resourceProvider` like
 * this:
 *
 * ```js
     app.config(['$resourceProvider', function($resourceProvider) {
       // Don't strip trailing slashes from calculated URLs
       $resourceProvider.defaults.stripTrailingSlashes = false;
     }]);
 * ```
 *
 * @param {string} url A parameterized URL template with parameters prefixed by `:` as in
 *   `/user/:username`. If you are using a URL with a port number (e.g.
 *   `http://example.com:8080/api`), it will be respected.
 *
 *   If you are using a url with a suffix, just add the suffix, like this:
 *   `$resource('http://example.com/resource.json')` or `$resource('http://example.com/:id.json')`
 *   or even `$resource('http://example.com/resource/:resource_id.:format')`
 *   If the parameter before the suffix is empty, :resource_id in this case, then the `/.` will be
 *   collapsed down to a single `.`.  If you need this sequence to appear and not collapse then you
 *   can escape it with `/\.`.
 *
 * @param {Object=} paramDefaults Default values for `url` parameters. These can be overridden in
 *   `actions` methods. If a parameter value is a function, it will be called every time
 *   a param value needs to be obtained for a request (unless the param was overridden). The
 *   function will be passed the current data value as an argument.
 *
 *   Each key value in the parameter object is first bound to url template if present and then any
 *   excess keys are appended to the url search query after the `?`.
 *
 *   Given a template `/path/:verb` and parameter `{verb: 'greet', salutation: 'Hello'}` results in
 *   URL `/path/greet?salutation=Hello`.
 *
 *   If the parameter value is prefixed with `@`, then the value for that parameter will be
 *   extracted from the corresponding property on the `data` object (provided when calling actions
 *   with a request body).
 *   For example, if the `defaultParam` object is `{someParam: '@someProp'}` then the value of
 *   `someParam` will be `data.someProp`.
 *   Note that the parameter will be ignored, when calling a "GET" action method (i.e. an action
 *   method that does not accept a request body).
 *
 * @param {Object.<Object>=} actions Hash with declaration of custom actions that will be available
 *   in addition to the default set of resource actions (see below). If a custom action has the same
 *   key as a default action (e.g. `save`), then the default action will be *overwritten*, and not
 *   extended.
 *
 *   The declaration should be created in the format of {@link ng.$http#usage $http.config}:
 *
 *       {
 *         action1: {method:?, params:?, isArray:?, headers:?, ...},
 *         action2: {method:?, params:?, isArray:?, headers:?, ...},
 *         ...
 *       }
 *
 *   Where:
 *
 *   - **`action`** – {string} – The name of action. This name becomes the name of the method on
 *     your resource object.
 *   - **`method`** – {string} – Case insensitive HTTP method (e.g. `GET`, `POST`, `PUT`,
 *     `DELETE`, `JSONP`, etc).
 *   - **`params`** – {Object=} – Optional set of pre-bound parameters for this action. If any of
 *     the parameter value is a function, it will be called every time when a param value needs to
 *     be obtained for a request (unless the param was overridden). The function will be passed the
 *     current data value as an argument.
 *   - **`url`** – {string} – Action specific `url` override. The url templating is supported just
 *     like for the resource-level urls.
 *   - **`isArray`** – {boolean=} – If true then the returned object for this action is an array,
 *     see `returns` section.
 *   - **`transformRequest`** –
 *     `{function(data, headersGetter)|Array.<function(data, headersGetter)>}` –
 *     Transform function or an array of such functions. The transform function takes the http
 *     request body and headers and returns its transformed (typically serialized) version.
 *     By default, transformRequest will contain one function that checks if the request data is
 *     an object and serializes it using `angular.toJson`. To prevent this behavior, set
 *     `transformRequest` to an empty array: `transformRequest: []`
 *   - **`transformResponse`** –
 *     `{function(data, headersGetter, status)|Array.<function(data, headersGetter, status)>}` –
 *     Transform function or an array of such functions. The transform function takes the HTTP
 *     response body, headers and status and returns its transformed (typically deserialized)
 *     version.
 *     By default, transformResponse will contain one function that checks if the response looks
 *     like a JSON string and deserializes it using `angular.fromJson`. To prevent this behavior,
 *     set `transformResponse` to an empty array: `transformResponse: []`
 *   - **`cache`** – `{boolean|Cache}` – A boolean value or object created with
 *     {@link ng.$cacheFactory `$cacheFactory`} to enable or disable caching of the HTTP response.
 *     See {@link $http#caching $http Caching} for more information.
 *   - **`timeout`** – `{number}` – Timeout in milliseconds.<br />
 *     **Note:** In contrast to {@link ng.$http#usage $http.config}, {@link ng.$q promises} are
 *     **not** supported in `$resource`, because the same value would be used for multiple requests.
 *     If you are looking for a way to cancel requests, you should use the `cancellable` option.
 *   - **`cancellable`** – `{boolean}` – If true, the request made by a "non-instance" call will be
 *     cancelled (if not already completed) by calling `$cancelRequest()` on the call's return
 *     value. Calling `$cancelRequest()` for a non-cancellable or an already completed/cancelled
 *     request will have no effect.
 *   - **`withCredentials`** – `{boolean}` – Whether to set the `withCredentials` flag on the
 *     XHR object. See
 *     [XMLHttpRequest.withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials)
 *     for more information.
 *   - **`responseType`** – `{string}` – See
 *     [XMLHttpRequest.responseType](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType).
 *   - **`interceptor`** – `{Object=}` – The interceptor object has four optional methods -
 *     `request`, `requestError`, `response`, and `responseError`. See
 *     {@link ng.$http#interceptors $http interceptors} for details. Note that
 *     `request`/`requestError` interceptors are applied before calling `$http`, thus before any
 *     global `$http` interceptors. Also, rejecting or throwing an error inside the `request`
 *     interceptor will result in calling the `responseError` interceptor.
 *     The resource instance or collection is available on the `resource` property of the
 *     `http response` object passed to `response`/`responseError` interceptors.
 *     Keep in mind that the associated promise will be resolved with the value returned by the
 *     response interceptors. Make sure you return an appropriate value and not the `response`
 *     object passed as input. For reference, the default `response` interceptor (which gets applied
 *     if you don't specify a custom one) returns `response.resource`.<br />
 *     See {@link ngResource.$resource#using-interceptors below} for an example of using
 *     interceptors in `$resource`.
 *   - **`hasBody`** – `{boolean}` – If true, then the request will have a body.
 *     If not specified, then only POST, PUT and PATCH requests will have a body. *
 * @param {Object} options Hash with custom settings that should extend the
 *   default `$resourceProvider` behavior.  The supported options are:
 *
 *   - **`stripTrailingSlashes`** – {boolean} – If true then the trailing
 *   slashes from any calculated URL will be stripped. (Defaults to true.)
 *   - **`cancellable`** – {boolean} – If true, the request made by a "non-instance" call will be
 *   cancelled (if not already completed) by calling `$cancelRequest()` on the call's return value.
 *   This can be overwritten per action. (Defaults to false.)
 *
 * @returns {Object} A resource "class" object with methods for the default set of resource actions
 *   optionally extended with custom `actions`. The default set contains these actions:
 *   ```js
 *   {
 *     'get':    {method: 'GET'},
 *     'save':   {method: 'POST'},
 *     'query':  {method: 'GET', isArray: true},
 *     'remove': {method: 'DELETE'},
 *     'delete': {method: 'DELETE'}
 *   }
 *   ```
 *
 *   Calling these methods invoke {@link ng.$http} with the specified http method, destination and
 *   parameters. When the data is returned from the server then the object is an instance of the
 *   resource class. The actions `save`, `remove` and `delete` are available on it as methods with
 *   the `$` prefix. This allows you to easily perform CRUD operations (create, read, update,
 *   delete) on server-side data like this:
 *   ```js
 *   var User = $resource('/user/:userId', {userId: '@id'});
 *   User.get({userId: 123}).$promise.then(function(user) {
 *     user.abc = true;
 *     user.$save();
 *   });
 *   ```
 *
 *   It is important to realize that invoking a `$resource` object method immediately returns an
 *   empty reference (object or array depending on `isArray`). Once the data is returned from the
 *   server the existing reference is populated with the actual data. This is a useful trick since
 *   usually the resource is assigned to a model which is then rendered by the view. Having an empty
 *   object results in no rendering, once the data arrives from the server then the object is
 *   populated with the data and the view automatically re-renders itself showing the new data. This
 *   means that in most cases one never has to write a callback function for the action methods.
 *
 *   The action methods on the class object or instance object can be invoked with the following
 *   parameters:
 *
 *   - "class" actions without a body: `Resource.action([parameters], [success], [error])`
 *   - "class" actions with a body: `Resource.action([parameters], postData, [success], [error])`
 *   - instance actions: `instance.$action([parameters], [success], [error])`
 *
 *
 *   When calling instance methods, the instance itself is used as the request body (if the action
 *   should have a body). By default, only actions using `POST`, `PUT` or `PATCH` have request
 *   bodies, but you can use the `hasBody` configuration option to specify whether an action
 *   should have a body or not (regardless of its HTTP method).
 *
 *
 *   Success callback is called with (value (Object|Array), responseHeaders (Function),
 *   status (number), statusText (string)) arguments, where `value` is the populated resource
 *   instance or collection object. The error callback is called with (httpResponse) argument.
 *
 *   Class actions return an empty instance (with the additional properties listed below).
 *   Instance actions return a promise for the operation.
 *
 *   The Resource instances and collections have these additional properties:
 *
 *   - `$promise`: The {@link ng.$q promise} of the original server interaction that created this
 *     instance or collection.
 *
 *     On success, the promise is resolved with the same resource instance or collection object,
 *     updated with data from server. This makes it easy to use in the
 *     {@link ngRoute.$routeProvider `resolve` section of `$routeProvider.when()`} to defer view
 *     rendering until the resource(s) are loaded.
 *
 *     On failure, the promise is rejected with the {@link ng.$http http response} object.
 *
 *     If an interceptor object was provided, the promise will instead be resolved with the value
 *     returned by the response interceptor (on success) or responceError interceptor (on failure).
 *
 *   - `$resolved`: `true` after first server interaction is completed (either with success or
 *      rejection), `false` before that. Knowing if the Resource has been resolved is useful in
 *      data-binding. If there is a response/responseError interceptor and it returns a promise,
 *      `$resolved` will wait for that too.
 *
 *   The Resource instances and collections have these additional methods:
 *
 *   - `$cancelRequest`: If there is a cancellable, pending request related to the instance or
 *      collection, calling this method will abort the request.
 *
 *   The Resource instances have these additional methods:
 *
 *   - `toJSON`: It returns a simple object without any of the extra properties added as part of
 *     the Resource API. This object can be serialized through {@link angular.toJson} safely
 *     without attaching AngularJS-specific fields. Notice that `JSON.stringify` (and
 *     `angular.toJson`) automatically use this method when serializing a Resource instance
 *     (see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON%28%29_behavior)).
 *
 * @example
 *
 * ### Basic usage
 *
   ```js
     // Define a CreditCard class
     var CreditCard = $resource('/users/:userId/cards/:cardId',
       {userId: 123, cardId: '@id'}, {
         charge: {method: 'POST', params: {charge: true}}
       });

     // We can retrieve a collection from the server
     var cards = CreditCard.query();
         // GET: /users/123/cards
         // server returns: [{id: 456, number: '1234', name: 'Smith'}]

     // Wait for the request to complete
     cards.$promise.then(function() {
       var card = cards[0];

       // Each item is an instance of CreditCard
       expect(card instanceof CreditCard).toEqual(true);

       // Non-GET methods are mapped onto the instances
       card.name = 'J. Smith';
       card.$save();
           // POST: /users/123/cards/456 {id: 456, number: '1234', name: 'J. Smith'}
           // server returns: {id: 456, number: '1234', name: 'J. Smith'}

       // Our custom method is mapped as well (since it uses POST)
       card.$charge({amount: 9.99});
           // POST: /users/123/cards/456?amount=9.99&charge=true {id: 456, number: '1234', name: 'J. Smith'}
     });

     // We can create an instance as well
     var newCard = new CreditCard({number: '0123'});
     newCard.name = 'Mike Smith';

     var savePromise = newCard.$save();
         // POST: /users/123/cards {number: '0123', name: 'Mike Smith'}
         // server returns: {id: 789, number: '0123', name: 'Mike Smith'}

     savePromise.then(function() {
       // Once the promise is resolved, the created instance
       // is populated with the data returned by the server
       expect(newCard.id).toEqual(789);
     });
   ```
 *
 * The object returned from a call to `$resource` is a resource "class" which has one "static"
 * method for each action in the definition.
 *
 * Calling these methods invokes `$http` on the `url` template with the given HTTP `method`,
 * `params` and `headers`.
 *
 * @example
 *
 * ### Accessing the response
 *
 * When the data is returned from the server then the object is an instance of the resource type and
 * all of the non-GET methods are available with `$` prefix. This allows you to easily support CRUD
 * operations (create, read, update, delete) on server-side data.
 *
   ```js
     var User = $resource('/users/:userId', {userId: '@id'});
     User.get({userId: 123}).$promise.then(function(user) {
       user.abc = true;
       user.$save();
     });
   ```
 *
 * It's worth noting that the success callback for `get`, `query` and other methods gets called with
 * the resource instance (populated with the data that came from the server) as well as an `$http`
 * header getter function, the HTTP status code and the response status text. So one could rewrite
 * the above example and get access to HTTP headers as follows:
 *
   ```js
     var User = $resource('/users/:userId', {userId: '@id'});
     User.get({userId: 123}, function(user, getResponseHeaders) {
       user.abc = true;
       user.$save(function(user, putResponseHeaders) {
         // `user` => saved `User` object
         // `putResponseHeaders` => `$http` header getter
       });
     });
   ```
 *
 * @example
 *
 * ### Creating custom actions
 *
 * In this example we create a custom method on our resource to make a PUT request:
 *
   ```js
      var app = angular.module('app', ['ngResource']);

      // Some APIs expect a PUT request in the format URL/object/ID
      // Here we are creating an 'update' method
      app.factory('Notes', ['$resource', function($resource) {
        return $resource('/notes/:id', {id: '@id'}, {
          update: {method: 'PUT'}
        });
      }]);

      // In our controller we get the ID from the URL using `$location`
      app.controller('NotesCtrl', ['$location', 'Notes', function($location, Notes) {
        // First, retrieve the corresponding `Note` object from the server
        // (Assuming a URL of the form `.../notes?id=XYZ`)
        var noteId = $location.search().id;
        var note = Notes.get({id: noteId});

        note.$promise.then(function() {
          note.content = 'Hello, world!';

          // Now call `update` to save the changes on the server
          Notes.update(note);
              // This will PUT /notes/ID with the note object as the request payload

          // Since `update` is a non-GET method, it will also be available on the instance
          // (prefixed with `$`), so we could replace the `Note.update()` call with:
          //note.$update();
        });
      }]);
   ```
 *
 * @example
 *
 * ### Cancelling requests
 *
 * If an action's configuration specifies that it is cancellable, you can cancel the request related
 * to an instance or collection (as long as it is a result of a "non-instance" call):
 *
   ```js
     // ...defining the `Hotel` resource...
     var Hotel = $resource('/api/hotels/:id', {id: '@id'}, {
       // Let's make the `query()` method cancellable
       query: {method: 'get', isArray: true, cancellable: true}
     });

     // ...somewhere in the PlanVacationController...
     ...
     this.onDestinationChanged = function onDestinationChanged(destination) {
       // We don't care about any pending request for hotels
       // in a different destination any more
       if (this.availableHotels) {
         this.availableHotels.$cancelRequest();
       }

       // Let's query for hotels in `destination`
       // (calls: /api/hotels?location=<destination>)
       this.availableHotels = Hotel.query({location: destination});
     };
   ```
 *
 * @example
 *
 * ### Using interceptors
 *
 * You can use interceptors to transform the request or response, perform additional operations, and
 * modify the returned instance/collection. The following example, uses `request` and `response`
 * interceptors to augment the returned instance with additional info:
 *
   ```js
     var Thing = $resource('/api/things/:id', {id: '@id'}, {
       save: {
         method: 'POST',
         interceptor: {
           request: function(config) {
             // Before the request is sent out, store a timestamp on the request config
             config.requestTimestamp = Date.now();
             return config;
           },
           response: function(response) {
             // Get the instance from the response object
             var instance = response.resource;

             // Augment the instance with a custom `saveLatency` property, computed as the time
             // between sending the request and receiving the response.
             instance.saveLatency = Date.now() - response.config.requestTimestamp;

             // Return the instance
             return instance;
           }
         }
       }
     });

     Thing.save({foo: 'bar'}).$promise.then(function(thing) {
       console.log('That thing was saved in ' + thing.saveLatency + 'ms.');
     });
   ```
 *
 */
angular.module('ngResource', ['ng']).
  info({ angularVersion: '1.7.8' }).
  provider('$resource', function ResourceProvider() {
    var PROTOCOL_AND_IPV6_REGEX = /^https?:\/\/\[[^\]]*][^/]*/;

    var provider = this;

    /**
     * @ngdoc property
     * @name $resourceProvider#defaults
     * @description
     * Object containing default options used when creating `$resource` instances.
     *
     * The default values satisfy a wide range of usecases, but you may choose to overwrite any of
     * them to further customize your instances. The available properties are:
     *
     * - **stripTrailingSlashes** – `{boolean}` – If true, then the trailing slashes from any
     *   calculated URL will be stripped.<br />
     *   (Defaults to true.)
     * - **cancellable** – `{boolean}` – If true, the request made by a "non-instance" call will be
     *   cancelled (if not already completed) by calling `$cancelRequest()` on the call's return
     *   value. For more details, see {@link ngResource.$resource}. This can be overwritten per
     *   resource class or action.<br />
     *   (Defaults to false.)
     * - **actions** - `{Object.<Object>}` - A hash with default actions declarations. Actions are
     *   high-level methods corresponding to RESTful actions/methods on resources. An action may
     *   specify what HTTP method to use, what URL to hit, if the return value will be a single
     *   object or a collection (array) of objects etc. For more details, see
     *   {@link ngResource.$resource}. The actions can also be enhanced or overwritten per resource
     *   class.<br />
     *   The default actions are:
     *   ```js
     *   {
     *     get: {method: 'GET'},
     *     save: {method: 'POST'},
     *     query: {method: 'GET', isArray: true},
     *     remove: {method: 'DELETE'},
     *     delete: {method: 'DELETE'}
     *   }
     *   ```
     *
     * #### Example
     *
     * For example, you can specify a new `update` action that uses the `PUT` HTTP verb:
     *
     * ```js
     *   angular.
     *     module('myApp').
     *     config(['$resourceProvider', function ($resourceProvider) {
     *       $resourceProvider.defaults.actions.update = {
     *         method: 'PUT'
     *       };
     *     }]);
     * ```
     *
     * Or you can even overwrite the whole `actions` list and specify your own:
     *
     * ```js
     *   angular.
     *     module('myApp').
     *     config(['$resourceProvider', function ($resourceProvider) {
     *       $resourceProvider.defaults.actions = {
     *         create: {method: 'POST'},
     *         get:    {method: 'GET'},
     *         getAll: {method: 'GET', isArray:true},
     *         update: {method: 'PUT'},
     *         delete: {method: 'DELETE'}
     *       };
     *     });
     * ```
     *
     */
    this.defaults = {
      // Strip slashes by default
      stripTrailingSlashes: true,

      // Make non-instance requests cancellable (via `$cancelRequest()`)
      cancellable: false,

      // Default actions configuration
      actions: {
        'get': {method: 'GET'},
        'save': {method: 'POST'},
        'query': {method: 'GET', isArray: true},
        'remove': {method: 'DELETE'},
        'delete': {method: 'DELETE'}
      }
    };

    this.$get = ['$http', '$log', '$q', '$timeout', function($http, $log, $q, $timeout) {

      var noop = angular.noop,
          forEach = angular.forEach,
          extend = angular.extend,
          copy = angular.copy,
          isArray = angular.isArray,
          isDefined = angular.isDefined,
          isFunction = angular.isFunction,
          isNumber = angular.isNumber,
          encodeUriQuery = angular.$$encodeUriQuery,
          encodeUriSegment = angular.$$encodeUriSegment;

      function Route(template, defaults) {
        this.template = template;
        this.defaults = extend({}, provider.defaults, defaults);
        this.urlParams = {};
      }

      Route.prototype = {
        setUrlParams: function(config, params, actionUrl) {
          var self = this,
            url = actionUrl || self.template,
            val,
            encodedVal,
            protocolAndIpv6 = '';

          var urlParams = self.urlParams = Object.create(null);
          forEach(url.split(/\W/), function(param) {
            if (param === 'hasOwnProperty') {
              throw $resourceMinErr('badname', 'hasOwnProperty is not a valid parameter name.');
            }
            if (!(new RegExp('^\\d+$').test(param)) && param &&
              (new RegExp('(^|[^\\\\]):' + param + '(\\W|$)').test(url))) {
              urlParams[param] = {
                isQueryParamValue: (new RegExp('\\?.*=:' + param + '(?:\\W|$)')).test(url)
              };
            }
          });
          url = url.replace(/\\:/g, ':');
          url = url.replace(PROTOCOL_AND_IPV6_REGEX, function(match) {
            protocolAndIpv6 = match;
            return '';
          });

          params = params || {};
          forEach(self.urlParams, function(paramInfo, urlParam) {
            val = params.hasOwnProperty(urlParam) ? params[urlParam] : self.defaults[urlParam];
            if (isDefined(val) && val !== null) {
              if (paramInfo.isQueryParamValue) {
                encodedVal = encodeUriQuery(val, true);
              } else {
                encodedVal = encodeUriSegment(val);
              }
              url = url.replace(new RegExp(':' + urlParam + '(\\W|$)', 'g'), function(match, p1) {
                return encodedVal + p1;
              });
            } else {
              url = url.replace(new RegExp('(/?):' + urlParam + '(\\W|$)', 'g'), function(match,
                  leadingSlashes, tail) {
                if (tail.charAt(0) === '/') {
                  return tail;
                } else {
                  return leadingSlashes + tail;
                }
              });
            }
          });

          // strip trailing slashes and set the url (unless this behavior is specifically disabled)
          if (self.defaults.stripTrailingSlashes) {
            url = url.replace(/\/+$/, '') || '/';
          }

          // Collapse `/.` if found in the last URL path segment before the query.
          // E.g. `http://url.com/id/.format?q=x` becomes `http://url.com/id.format?q=x`.
          url = url.replace(/\/\.(?=\w+($|\?))/, '.');
          // Replace escaped `/\.` with `/.`.
          // (If `\.` comes from a param value, it will be encoded as `%5C.`.)
          config.url = protocolAndIpv6 + url.replace(/\/(\\|%5C)\./, '/.');


          // set params - delegate param encoding to $http
          forEach(params, function(value, key) {
            if (!self.urlParams[key]) {
              config.params = config.params || {};
              config.params[key] = value;
            }
          });
        }
      };


      function resourceFactory(url, paramDefaults, actions, options) {
        var route = new Route(url, options);

        actions = extend({}, provider.defaults.actions, actions);

        function extractParams(data, actionParams) {
          var ids = {};
          actionParams = extend({}, paramDefaults, actionParams);
          forEach(actionParams, function(value, key) {
            if (isFunction(value)) { value = value(data); }
            ids[key] = value && value.charAt && value.charAt(0) === '@' ?
              lookupDottedPath(data, value.substr(1)) : value;
          });
          return ids;
        }

        function defaultResponseInterceptor(response) {
          return response.resource;
        }

        function Resource(value) {
          shallowClearAndCopy(value || {}, this);
        }

        Resource.prototype.toJSON = function() {
          var data = extend({}, this);
          delete data.$promise;
          delete data.$resolved;
          delete data.$cancelRequest;
          return data;
        };

        forEach(actions, function(action, name) {
          var hasBody = action.hasBody === true || (action.hasBody !== false && /^(POST|PUT|PATCH)$/i.test(action.method));
          var numericTimeout = action.timeout;
          var cancellable = isDefined(action.cancellable) ?
              action.cancellable : route.defaults.cancellable;

          if (numericTimeout && !isNumber(numericTimeout)) {
            $log.debug('ngResource:\n' +
                       '  Only numeric values are allowed as `timeout`.\n' +
                       '  Promises are not supported in $resource, because the same value would ' +
                       'be used for multiple requests. If you are looking for a way to cancel ' +
                       'requests, you should use the `cancellable` option.');
            delete action.timeout;
            numericTimeout = null;
          }

          Resource[name] = function(a1, a2, a3, a4) {
            var params = {}, data, onSuccess, onError;

            switch (arguments.length) {
              case 4:
                onError = a4;
                onSuccess = a3;
                // falls through
              case 3:
              case 2:
                if (isFunction(a2)) {
                  if (isFunction(a1)) {
                    onSuccess = a1;
                    onError = a2;
                    break;
                  }

                  onSuccess = a2;
                  onError = a3;
                  // falls through
                } else {
                  params = a1;
                  data = a2;
                  onSuccess = a3;
                  break;
                }
                // falls through
              case 1:
                if (isFunction(a1)) onSuccess = a1;
                else if (hasBody) data = a1;
                else params = a1;
                break;
              case 0: break;
              default:
                throw $resourceMinErr('badargs',
                  'Expected up to 4 arguments [params, data, success, error], got {0} arguments',
                  arguments.length);
            }

            var isInstanceCall = this instanceof Resource;
            var value = isInstanceCall ? data : (action.isArray ? [] : new Resource(data));
            var httpConfig = {};
            var requestInterceptor = action.interceptor && action.interceptor.request || undefined;
            var requestErrorInterceptor = action.interceptor && action.interceptor.requestError ||
              undefined;
            var responseInterceptor = action.interceptor && action.interceptor.response ||
              defaultResponseInterceptor;
            var responseErrorInterceptor = action.interceptor && action.interceptor.responseError ||
              $q.reject;
            var successCallback = onSuccess ? function(val) {
              onSuccess(val, response.headers, response.status, response.statusText);
            } : undefined;
            var errorCallback = onError || undefined;
            var timeoutDeferred;
            var numericTimeoutPromise;
            var response;

            forEach(action, function(value, key) {
              switch (key) {
                default:
                  httpConfig[key] = copy(value);
                  break;
                case 'params':
                case 'isArray':
                case 'interceptor':
                case 'cancellable':
                  break;
              }
            });

            if (!isInstanceCall && cancellable) {
              timeoutDeferred = $q.defer();
              httpConfig.timeout = timeoutDeferred.promise;

              if (numericTimeout) {
                numericTimeoutPromise = $timeout(timeoutDeferred.resolve, numericTimeout);
              }
            }

            if (hasBody) httpConfig.data = data;
            route.setUrlParams(httpConfig,
              extend({}, extractParams(data, action.params || {}), params),
              action.url);

            // Start the promise chain
            var promise = $q.
              resolve(httpConfig).
              then(requestInterceptor).
              catch(requestErrorInterceptor).
              then($http);

            promise = promise.then(function(resp) {
              var data = resp.data;

              if (data) {
                // Need to convert action.isArray to boolean in case it is undefined
                if (isArray(data) !== (!!action.isArray)) {
                  throw $resourceMinErr('badcfg',
                      'Error in resource configuration for action `{0}`. Expected response to ' +
                      'contain an {1} but got an {2} (Request: {3} {4})', name, action.isArray ? 'array' : 'object',
                    isArray(data) ? 'array' : 'object', httpConfig.method, httpConfig.url);
                }
                if (action.isArray) {
                  value.length = 0;
                  forEach(data, function(item) {
                    if (typeof item === 'object') {
                      value.push(new Resource(item));
                    } else {
                      // Valid JSON values may be string literals, and these should not be converted
                      // into objects. These items will not have access to the Resource prototype
                      // methods, but unfortunately there
                      value.push(item);
                    }
                  });
                } else {
                  var promise = value.$promise;     // Save the promise
                  shallowClearAndCopy(data, value);
                  value.$promise = promise;         // Restore the promise
                }
              }

              resp.resource = value;
              response = resp;
              return responseInterceptor(resp);
            }, function(rejectionOrResponse) {
              rejectionOrResponse.resource = value;
              response = rejectionOrResponse;
              return responseErrorInterceptor(rejectionOrResponse);
            });

            promise = promise['finally'](function() {
              value.$resolved = true;
              if (!isInstanceCall && cancellable) {
                value.$cancelRequest = noop;
                $timeout.cancel(numericTimeoutPromise);
                timeoutDeferred = numericTimeoutPromise = httpConfig.timeout = null;
              }
            });

            // Run the `success`/`error` callbacks, but do not let them affect the returned promise.
            promise.then(successCallback, errorCallback);

            if (!isInstanceCall) {
              // we are creating instance / collection
              // - set the initial promise
              // - return the instance / collection
              value.$promise = promise;
              value.$resolved = false;
              if (cancellable) value.$cancelRequest = cancelRequest;

              return value;
            }

            // instance call
            return promise;

            function cancelRequest(value) {
              promise.catch(noop);
              if (timeoutDeferred !== null) {
                timeoutDeferred.resolve(value);
              }
            }
          };


          Resource.prototype['$' + name] = function(params, success, error) {
            if (isFunction(params)) {
              error = success; success = params; params = {};
            }
            var result = Resource[name].call(this, params, this, success, error);
            return result.$promise || result;
          };
        });

        return Resource;
      }

      return resourceFactory;
    }];
  });

describe('resource', function() {
  var noop = angular.noop;
  var extend = angular.extend;

describe('basic usage', function() {
  var $resource, CreditCard, callback, $httpBackend, resourceProvider, $q;

  beforeEach(module('ngResource'));

  beforeEach(module(function($resourceProvider) {
    resourceProvider = $resourceProvider;
  }));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $resource = $injector.get('$resource');
    $q = $injector.get('$q');
    CreditCard = $resource('/CreditCard/:id:verb', {id:'@id.key'}, {
      charge:{
        method:'post',
        params:{verb:'!charge'}
      },
      patch: {
        method: 'PATCH'
      },
      conditionalPut: {
        method: 'PUT',
        headers: {
          'If-None-Match': '*'
        }
      }

    });
    callback = jasmine.createSpy('callback');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });


  describe('isValidDottedPath', function() {
    /* global isValidDottedPath: false */
    it('should support arbitrary dotted names', function() {
      expect(isValidDottedPath('')).toBe(false);
      expect(isValidDottedPath('1')).toBe(false);
      expect(isValidDottedPath('1abc')).toBe(false);
      expect(isValidDottedPath('.')).toBe(false);
      expect(isValidDottedPath('$')).toBe(true);
      expect(isValidDottedPath('@')).toBe(true);
      expect(isValidDottedPath('a')).toBe(true);
      expect(isValidDottedPath('A')).toBe(true);
      expect(isValidDottedPath('a1')).toBe(true);
      expect(isValidDottedPath('$a')).toBe(true);
      expect(isValidDottedPath('$1')).toBe(true);
      expect(isValidDottedPath('$$')).toBe(true);
      expect(isValidDottedPath('$.$')).toBe(true);
      expect(isValidDottedPath('.$')).toBe(false);
      expect(isValidDottedPath('$.')).toBe(false);
      expect(isValidDottedPath('@.')).toBe(false);
      expect(isValidDottedPath('.@')).toBe(false);
    });
  });

  describe('lookupDottedPath', function() {
    /* global lookupDottedPath: false */
    var data = {a: {b: 'foo', c: null, '@d':'d-foo'},'@b':'b-foo'};

    it('should throw for invalid path', function() {
      expect(function() {
        lookupDottedPath(data, '.ckck');
      }).toThrowMinErr('$resource', 'badmember',
                       'Dotted member path "@.ckck" is invalid.');
    });

    it('should get dotted paths', function() {
      expect(lookupDottedPath(data, 'a')).toEqual({b: 'foo', c: null, '@d':'d-foo'});
      expect(lookupDottedPath(data, 'a.b')).toBe('foo');
      expect(lookupDottedPath(data, 'a.c')).toBeNull();
      expect(lookupDottedPath(data, 'a.@d')).toBe('d-foo');
      expect(lookupDottedPath(data, '@b')).toBe('b-foo');
    });

    it('should skip over null/undefined members', function() {
      expect(lookupDottedPath(data, 'a.b.c')).toBeUndefined();
      expect(lookupDottedPath(data, 'a.c.c')).toBeUndefined();
      expect(lookupDottedPath(data, 'a.b.c.d')).toBeUndefined();
      expect(lookupDottedPath(data, 'NOT_EXIST')).toBeUndefined();
    });
  });

  it('should not include a request body when calling $delete', function() {
    $httpBackend.expect('DELETE', '/fooresource', null).respond({});
    var Resource = $resource('/fooresource');
    var resource = new Resource({ foo: 'bar' });

    resource.$delete();
    $httpBackend.flush();
  });

  it('should include a request body when calling custom method with hasBody is true', function() {
    var instant = {name: 'info.txt'};
    var condition = {at: '2038-01-19 03:14:08'};

    $httpBackend.expect('CREATE', '/fooresource', instant).respond({fid: 42});
    $httpBackend.expect('DELETE', '/fooresource', condition).respond({});

    var r = $resource('/fooresource', {}, {
      create: {method: 'CREATE', hasBody: true},
      delete: {method: 'DELETE', hasBody: true}
    });

    var creationResponse = r.create(instant);
    var deleteResponse = r.delete(condition);

    $httpBackend.flush();

    expect(creationResponse.fid).toBe(42);
    expect(deleteResponse.$resolved).toBe(true);
  });

  it('should not include a request body if hasBody is false on POST, PUT and PATCH', function() {
    function verifyRequest(method, url, data) {
      expect(data).toBeUndefined();
      return [200, {id: 42}];
    }

    $httpBackend.expect('POST', '/foo').respond(verifyRequest);
    $httpBackend.expect('PUT', '/foo').respond(verifyRequest);
    $httpBackend.expect('PATCH', '/foo').respond(verifyRequest);

    var R = $resource('/foo', {}, {
      post: {method: 'POST', hasBody: false},
      put: {method: 'PUT', hasBody: false},
      patch: {method: 'PATCH', hasBody: false}
    });

    var postResponse = R.post();
    var putResponse = R.put();
    var patchResponse = R.patch();

    $httpBackend.flush();

    expect(postResponse.id).toBe(42);
    expect(putResponse.id).toBe(42);
    expect(patchResponse.id).toBe(42);
  });

  it('should expect a body if hasBody is true', function() {
    var username = 'yathos';
    var loginRequest = {name: username, password: 'Smile'};
    var user = {id: 1, name: username};

    $httpBackend.expect('LOGIN', '/user/me', loginRequest).respond(user);

    $httpBackend.expect('LOGOUT', '/user/me', null).respond(null);

    var UserService = $resource('/user/me', {}, {
      login: {method: 'LOGIN', hasBody: true},
      logout: {method: 'LOGOUT', hasBody: false}
    });

    var loginResponse = UserService.login(loginRequest);
    var logoutResponse = UserService.logout();

    $httpBackend.flush();

    expect(loginResponse.id).toBe(user.id);
    expect(logoutResponse.$resolved).toBe(true);
  });

  it('should build resource', function() {
    expect(typeof CreditCard).toBe('function');
    expect(typeof CreditCard.get).toBe('function');
    expect(typeof CreditCard.save).toBe('function');
    expect(typeof CreditCard.remove).toBe('function');
    expect(typeof CreditCard['delete']).toBe('function');
    expect(typeof CreditCard.query).toBe('function');
  });


  describe('shallow copy', function() {
    /* global shallowClearAndCopy */
    it('should make a copy', function() {
      var original = {key:{}};
      var copy = shallowClearAndCopy(original);
      expect(copy).toEqual(original);
      expect(copy.key).toBe(original.key);
    });


    it('should omit "$$"-prefixed properties', function() {
      var original = {$$some: true, $$: true};
      var clone = {};

      expect(shallowClearAndCopy(original, clone)).toBe(clone);
      expect(clone.$$some).toBeUndefined();
      expect(clone.$$).toBeUndefined();
    });


    it('should copy "$"-prefixed properties from copy', function() {
      var original = {$some: true};
      var clone = {};

      expect(shallowClearAndCopy(original, clone)).toBe(clone);
      expect(clone.$some).toBe(original.$some);
    });


    it('should omit properties from prototype chain', function() {
      var original, clone = {};
      function Func() {}
      Func.prototype.hello = 'world';

      original = new Func();
      original.goodbye = 'world';

      expect(shallowClearAndCopy(original, clone)).toBe(clone);
      expect(clone.hello).toBeUndefined();
      expect(clone.goodbye).toBe('world');
    });
  });


  it('should not throw if response.data is the resource object', function() {
    var data = {id:{key:123}, number:'9876'};
    $httpBackend.expect('GET', '/CreditCard/123').respond(data);

    var cc = CreditCard.get({id:123});
    $httpBackend.flush();
    expect(cc instanceof CreditCard).toBe(true);

    $httpBackend.expect('POST', '/CreditCard/123', angular.toJson(data)).respond(cc);

    cc.$save();
    $httpBackend.flush();
    expect(cc.id).toEqual({key:123});
    expect(cc.number).toEqual('9876');
  });


  it('should default to empty parameters', function() {
    $httpBackend.expect('GET', 'URL').respond({});
    $resource('URL').query();
  });


  it('should ignore slashes of undefined parameters', function() {
    var R = $resource('/Path/:a/:b/:c');

    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/0').respond('{}');
    $httpBackend.when('GET', '/Path/false').respond('{}');
    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/').respond('{}');
    $httpBackend.when('GET', '/Path/1').respond('{}');
    $httpBackend.when('GET', '/Path/2/3').respond('{}');
    $httpBackend.when('GET', '/Path/4/5').respond('{}');
    $httpBackend.when('GET', '/Path/6/7/8').respond('{}');

    R.get({});
    R.get({a:0});
    R.get({a:false});
    R.get({a:null});
    R.get({a:undefined});
    R.get({a:''});
    R.get({a:1});
    R.get({a:2, b:3});
    R.get({a:4, c:5});
    R.get({a:6, b:7, c:8});
  });

  it('should not ignore leading slashes of undefined parameters that have non-slash trailing sequence', function() {
    var R = $resource('/Path/:a.foo/:b.bar/:c.baz');

    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/0.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/false.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/1.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/2.foo/3.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/4.foo/.bar/5.baz').respond('{}');
    $httpBackend.when('GET', '/Path/6.foo/7.bar/8.baz').respond('{}');

    R.get({});
    R.get({a:0});
    R.get({a:false});
    R.get({a:null});
    R.get({a:undefined});
    R.get({a:''});
    R.get({a:1});
    R.get({a:2, b:3});
    R.get({a:4, c:5});
    R.get({a:6, b:7, c:8});
  });

  it('should not collapsed the url into an empty string', function() {
    var R = $resource('/:foo/:bar/');

    $httpBackend.when('GET', '/').respond('{}');

    R.get({});
  });

  it('should support escaping colons in url template', function() {
    var R = $resource('http://localhost\\:8080/Path/:a/\\:stillPath/:b');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/:stillPath/bar').respond();
    R.get({a: 'foo', b: 'bar'});
  });

  it('should support an unescaped url', function() {
    var R = $resource('http://localhost:8080/Path/:a');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    R.get({a: 'foo'});
  });


  it('should correctly encode url params', function() {
    var R = $resource('/Path/:a');

    $httpBackend.expect('GET', '/Path/foo%231').respond('{}');
    $httpBackend.expect('GET', '/Path/doh!@foo?bar=baz%231').respond('{}');
    $httpBackend.expect('GET', '/Path/herp$').respond('{}');
    $httpBackend.expect('GET', '/Path/foo;bar').respond('{}');
    $httpBackend.expect('GET', '/Path/foo?bar=baz;qux').respond('{}');

    R.get({a: 'foo#1'});
    R.get({a: 'doh!@foo', bar: 'baz#1'});
    R.get({a: 'herp$'});
    R.get({a: 'foo;bar'});
    R.get({a: 'foo', bar: 'baz;qux'});
  });

  it('should not encode @ in url params', function() {
    //encodeURIComponent is too aggressive and doesn't follow http://www.ietf.org/rfc/rfc3986.txt
    //with regards to the character set (pchar) allowed in path segments
    //so we need this test to make sure that we don't over-encode the params and break stuff like
    //buzz api which uses @self

    var R = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh@fo%20o?!do%26h=g%3Da+h&:bar=$baz@1').respond('{}');
    R.get({a: 'doh@fo o', ':bar': '$baz@1', '!do&h': 'g=a h'});
  });

  it('should encode array params', function() {
    var R = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz1&bar=baz2').respond('{}');
    R.get({a: 'doh&foo', bar: ['baz1', 'baz2']});
  });

  it('should not encode string "null" to "+" in url params', function() {
    var R = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/null').respond('{}');
    R.get({a: 'null'});
  });


  it('should implicitly strip trailing slashes from URLs by default', function() {
    var R = $resource('http://localhost:8080/Path/:a/');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    R.get({a: 'foo'});
  });

  it('should support explicitly stripping trailing slashes from URLs', function() {
    var R = $resource('http://localhost:8080/Path/:a/', {}, {}, {stripTrailingSlashes: true});

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    R.get({a: 'foo'});
  });

  it('should support explicitly keeping trailing slashes in URLs', function() {
    var R = $resource('http://localhost:8080/Path/:a/', {}, {}, {stripTrailingSlashes: false});

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/').respond();
    R.get({a: 'foo'});
  });

  it('should support provider-level configuration to strip trailing slashes in URLs', function() {
    // Set the new behavior for all new resources created by overriding the
    // provider configuration
    resourceProvider.defaults.stripTrailingSlashes = false;

    var R = $resource('http://localhost:8080/Path/:a/');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/').respond();
    R.get({a: 'foo'});
  });

  it('should support IPv6 URLs', function() {
    test('http://[2620:0:861:ed1a::1]',        {ed1a: 'foo'}, 'http://[2620:0:861:ed1a::1]');
    test('http://[2620:0:861:ed1a::1]/',       {ed1a: 'foo'}, 'http://[2620:0:861:ed1a::1]/');
    test('http://[2620:0:861:ed1a::1]/:ed1a',  {ed1a: 'foo'}, 'http://[2620:0:861:ed1a::1]/foo');
    test('http://[2620:0:861:ed1a::1]/:ed1a',  {},            'http://[2620:0:861:ed1a::1]/');
    test('http://[2620:0:861:ed1a::1]/:ed1a/', {ed1a: 'foo'}, 'http://[2620:0:861:ed1a::1]/foo/');
    test('http://[2620:0:861:ed1a::1]/:ed1a/', {},            'http://[2620:0:861:ed1a::1]/');

    // Helpers
    function test(templateUrl, params, actualUrl) {
      var R = $resource(templateUrl, null, null, {stripTrailingSlashes: false});
      $httpBackend.expect('GET', actualUrl).respond(null);
      R.get(params);
    }
  });

  it('should support params in the `hostname` part of the URL', function() {
    test('http://:hostname',            {hostname: 'foo.com'},              'http://foo.com');
    test('http://:hostname/',           {hostname: 'foo.com'},              'http://foo.com/');
    test('http://:l2Domain.:l1Domain',  {l1Domain: 'com', l2Domain: 'bar'}, 'http://bar.com');
    test('http://:l2Domain.:l1Domain/', {l1Domain: 'com', l2Domain: 'bar'}, 'http://bar.com/');
    test('http://127.0.0.:octet',       {octet: 42},                        'http://127.0.0.42');
    test('http://127.0.0.:octet/',      {octet: 42},                        'http://127.0.0.42/');

    // Helpers
    function test(templateUrl, params, actualUrl) {
      var R = $resource(templateUrl, null, null, {stripTrailingSlashes: false});
      $httpBackend.expect('GET', actualUrl).respond(null);
      R.get(params);
    }
  });

  it('should support overriding provider default trailing-slash stripping configuration', function() {
    // Set the new behavior for all new resources created by overriding the
    // provider configuration
    resourceProvider.defaults.stripTrailingSlashes = false;

    // Specific instances of $resource can still override the provider's default
    var R = $resource('http://localhost:8080/Path/:a/', {}, {}, {stripTrailingSlashes: true});

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    R.get({a: 'foo'});
  });


  it('should allow relative paths in resource url', function() {
    var R = $resource(':relativePath');
    $httpBackend.expect('GET', 'data.json').respond('{}');
    R.get({ relativePath: 'data.json' });
  });

  it('should handle + in url params', function() {
    var R = $resource('/api/myapp/:myresource?from=:from&to=:to&histlen=:histlen');
    $httpBackend.expect('GET', '/api/myapp/pear+apple?from=2012-04-01&to=2012-04-29&histlen=3').respond('{}');
    R.get({ myresource: 'pear+apple', from: '2012-04-01', to: '2012-04-29', histlen: 3  });
  });


  it('should encode & in query params unless in query param value', function() {
    var R1 = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz%261').respond('{}');
    R1.get({a: 'doh&foo', bar: 'baz&1'});

    var R2 = $resource('/api/myapp/resource?:query');
    $httpBackend.expect('GET', '/api/myapp/resource?foo&bar').respond('{}');
    R2.get({query: 'foo&bar'});

    var R3 = $resource('/api/myapp/resource?from=:from');
    $httpBackend.expect('GET', '/api/myapp/resource?from=bar%20%26%20blanks').respond('{}');
    R3.get({from: 'bar & blanks'});
  });


  it('should build resource with default param', function() {
    $httpBackend.expect('GET', '/Order/123/Line/456.visa?minimum=0.05').respond({id: 'abc'});
    var LineItem = $resource('/Order/:orderId/Line/:id:verb',
                                  {orderId: '123', id: '@id.key', verb:'.visa', minimum: 0.05});
    var item = LineItem.get({id: 456});
    $httpBackend.flush();
    expect(item).toEqualData({id:'abc'});
  });


  it('should support @_property lookups with underscores', function() {
    $httpBackend.expect('GET', '/Order/123').respond({_id: {_key:'123'}, count: 0});
    var LineItem = $resource('/Order/:_id', {_id: '@_id._key'});
    var item = LineItem.get({_id: 123});
    $httpBackend.flush();
    expect(item).toEqualData({_id: {_key: '123'}, count: 0});
    $httpBackend.expect('POST', '/Order/123').respond({_id: {_key:'123'}, count: 1});
    item.$save();
    $httpBackend.flush();
    expect(item).toEqualData({_id: {_key: '123'}, count: 1});
  });


  it('should not pass default params between actions', function() {
    var R = $resource('/Path', {}, {get: {method: 'GET', params: {objId: '1'}}, perform: {method: 'GET'}});

    $httpBackend.expect('GET', '/Path?objId=1').respond('{}');
    $httpBackend.expect('GET', '/Path').respond('{}');

    R.get({});
    R.perform({});
  });


  it('should build resource with action default param overriding default param', function() {
    $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});
    var TypeItem = $resource('/:type/:typeId', {type: 'Order'},
                                  {get: {method: 'GET', params: {type: 'Customer'}}});
    var item = TypeItem.get({typeId: 123});

    $httpBackend.flush();
    expect(item).toEqualData({id: 'abc'});
  });


  it('should build resource with action default param reading the value from instance', function() {
    $httpBackend.expect('POST', '/Customer/123').respond();
    var R = $resource('/Customer/:id', {}, {post: {method: 'POST', params: {id: '@id'}}});

    var inst = new R({id:123});
    expect(inst.id).toBe(123);

    inst.$post();
  });


  it('should not throw TypeError on null default params', function() {
    $httpBackend.expect('GET', '/Path').respond('{}');
    var R = $resource('/Path', {param: null}, {get: {method: 'GET'}});

    expect(function() {
      R.get({});
    }).not.toThrow();
  });


  it('should handle multiple params with same name', function() {
    var R = $resource('/:id/:id');

    $httpBackend.when('GET').respond('{}');
    $httpBackend.expect('GET', '/1/1');

    R.get({id:1});
  });


  it('should throw an exception if a param is called "hasOwnProperty"', function() {
    expect(function() {
      $resource('/:hasOwnProperty').get();
    }).toThrowMinErr('$resource','badname', 'hasOwnProperty is not a valid parameter name');
  });


  it('should create resource', function() {
    $httpBackend.expect('POST', '/CreditCard', '{"name":"misko"}').respond({id: 123, name: 'misko'});

    var cc = CreditCard.save({name: 'misko'}, callback);
    expect(cc).toEqualData({name: 'misko'});
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(cc).toEqualData({id: 123, name: 'misko'});
    expect(callback).toHaveBeenCalledOnce();
    expect(callback.calls.mostRecent().args[0]).toEqual(cc);
    expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));
  });


  it('should read resource', function() {
    $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
    var cc = CreditCard.get({id: 123}, callback);

    expect(cc instanceof CreditCard).toBeTruthy();
    expect(cc).toEqualData({});
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(cc).toEqualData({id: 123, number: '9876'});
    expect(callback.calls.mostRecent().args[0]).toEqual(cc);
    expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));
  });


  it('should send correct headers', function() {
    $httpBackend.expectPUT('/CreditCard/123', undefined, function(headers) {
      return headers['If-None-Match'] === '*';
    }).respond({id:123});

    CreditCard.conditionalPut({id: {key:123}});
  });


  it('should read partial resource', function() {
    $httpBackend.expect('GET', '/CreditCard').respond([{id:{key:123}}]);
    var ccs = CreditCard.query();

    $httpBackend.flush();
    expect(ccs.length).toEqual(1);

    var cc = ccs[0];
    expect(cc instanceof CreditCard).toBe(true);
    expect(cc.number).toBeUndefined();

    $httpBackend.expect('GET', '/CreditCard/123').respond({id: {key: 123}, number: '9876'});
    cc.$get(callback);
    $httpBackend.flush();
    expect(callback.calls.mostRecent().args[0]).toEqual(cc);
    expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));
    expect(cc.number).toEqual('9876');
  });


  it('should update resource', function() {
    $httpBackend.expect('POST', '/CreditCard/123', '{"id":{"key":123},"name":"misko"}').
                 respond({id: {key: 123}, name: 'rama'});

    var cc = CreditCard.save({id: {key: 123}, name: 'misko'}, callback);
    expect(cc).toEqualData({id:{key:123}, name:'misko'});
    expect(callback).not.toHaveBeenCalled();
    $httpBackend.flush();
  });


  it('should query resource', function() {
    $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);

    var ccs = CreditCard.query({key: 'value'}, callback);
    expect(ccs).toEqualData([]);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(ccs).toEqualData([{id:1}, {id:2}]);
    expect(callback.calls.mostRecent().args[0]).toEqual(ccs);
    expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));
  });


  it('should have all arguments optional', function() {
    $httpBackend.expect('GET', '/CreditCard').respond([{id:1}]);

    var log = '';
    var ccs = CreditCard.query(function() { log += 'cb;'; });

    $httpBackend.flush();
    expect(ccs).toEqualData([{id:1}]);
    expect(log).toEqual('cb;');
  });


  it('should delete resource and call callback', function() {
    $httpBackend.expect('DELETE', '/CreditCard/123').respond({});
    CreditCard.remove({id:123}, callback);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(callback.calls.mostRecent().args[0]).toEqualData({});
    expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));

    callback.calls.reset();
    $httpBackend.expect('DELETE', '/CreditCard/333').respond(204, null);
    CreditCard.remove({id:333}, callback);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(callback.calls.mostRecent().args[0]).toEqualData({});
    expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));
  });


  it('should post charge verb', function() {
    $httpBackend.expect('POST', '/CreditCard/123!charge?amount=10', '{"auth":"abc"}').respond({success: 'ok'});
    CreditCard.charge({id:123, amount:10}, {auth:'abc'}, callback);
  });


  it('should post charge verb on instance', function() {
    $httpBackend.expect('POST', '/CreditCard/123!charge?amount=10',
        '{"id":{"key":123},"name":"misko"}').respond({success: 'ok'});

    var card = new CreditCard({id:{key:123}, name:'misko'});
    card.$charge({amount:10}, callback);
  });


  it('should patch a resource', function() {
    $httpBackend.expectPATCH('/CreditCard/123', '{"name":"igor"}').
                     respond({id: 123, name: 'rama'});

    var card = CreditCard.patch({id: 123}, {name: 'igor'}, callback);

    expect(card).toEqualData({name: 'igor'});
    expect(callback).not.toHaveBeenCalled();
    $httpBackend.flush();
    expect(callback).toHaveBeenCalled();
    expect(card).toEqualData({id: 123, name: 'rama'});
  });


  it('should create on save', function() {
    $httpBackend.expect('POST', '/CreditCard', '{"name":"misko"}').respond({id: 123}, {header1: 'a'});

    var cc = new CreditCard();
    expect(cc.$get).toBeDefined();
    expect(cc.$query).toBeDefined();
    expect(cc.$remove).toBeDefined();
    expect(cc.$save).toBeDefined();

    cc.name = 'misko';
    cc.$save(callback);
    expect(cc).toEqualData({name:'misko'});

    $httpBackend.flush();
    expect(cc).toEqualData({id:123});
    expect(callback.calls.mostRecent().args[0]).toEqual(cc);
    expect(callback.calls.mostRecent().args[1]()).toEqual(extend(Object.create(null), {header1: 'a'}));
  });


  it('should not mutate the resource object if response contains no body', function() {
    var data = {id:{key:123}, number:'9876'};
    $httpBackend.expect('GET', '/CreditCard/123').respond(data);

    var cc = CreditCard.get({id:123});
    $httpBackend.flush();
    expect(cc instanceof CreditCard).toBe(true);

    $httpBackend.expect('POST', '/CreditCard/123', angular.toJson(data)).respond('');
    var idBefore = cc.id;

    cc.$save();
    $httpBackend.flush();
    expect(idBefore).toEqual(cc.id);
  });


  it('should support dynamic default parameters (global)', function() {
    var currentGroup = 'students',
        Person = $resource('/Person/:group/:id', { group: function() { return currentGroup; }});

    $httpBackend.expect('GET', '/Person/students/fedor').respond({id: 'fedor', email: 'f@f.com'});

    var fedor = Person.get({id: 'fedor'});
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor', email: 'f@f.com'});
  });


  it('should pass resource object to dynamic default parameters', function() {
    var Person = $resource('/Person/:id', {
      id: function(data) {
        return data ? data.id : 'fedor';
      }
    });

    $httpBackend.expect('GET', '/Person/fedor').respond(
        {id: 'fedor', email: 'f@f.com', count: 1});

    var fedor = Person.get();
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor', email: 'f@f.com', count: 1});

    $httpBackend.expect('POST', '/Person/fedor2').respond(
        {id: 'fedor2', email: 'f2@f.com', count: 2});

    fedor.id = 'fedor2';
    fedor.$save();
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor2', email: 'f2@f.com', count: 2});
  });


  it('should support dynamic default parameters (action specific)', function() {
    var currentGroup = 'students',
      Person = $resource('/Person/:group/:id', {}, {
        fetch: {
          method: 'GET',
          params: {group: function() { return currentGroup; }}
        }
      });

    $httpBackend.expect('GET', '/Person/students/fedor').respond({id: 'fedor', email: 'f@f.com'});

    var fedor = Person.fetch({id: 'fedor'});
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor', email: 'f@f.com'});
  });


  it('should exercise full stack', function() {
    var Person = $resource('/Person/:id');

    $httpBackend.expect('GET', '/Person/123').respond('\n{\n"name":\n"misko"\n}\n');
    var person = Person.get({id:123});
    $httpBackend.flush();
    expect(person.name).toEqual('misko');
  });

  it('should return a resource instance when calling a class method with a resource instance', function() {
    $httpBackend.expect('GET', '/Person/123').respond('{"name":"misko"}');
    var Person = $resource('/Person/:id');
    var person = Person.get({id:123});
    $httpBackend.flush();
    $httpBackend.expect('POST', '/Person').respond('{"name":"misko2"}');

    var person2 = Person.save(person);
    $httpBackend.flush();

    expect(person2).toEqual(jasmine.any(Person));
  });

  it('should not include $promise and $resolved when resource is toJson\'ed', function() {
    $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
    var cc = CreditCard.get({id: 123});
    $httpBackend.flush();

    cc.$myProp = 'still here';

    expect(cc.$promise).toBeDefined();
    expect(cc.$resolved).toBe(true);

    var json = JSON.parse(angular.toJson(cc));
    expect(json.$promise).not.toBeDefined();
    expect(json.$resolved).not.toBeDefined();
    expect(json).toEqual({id: 123, number: '9876', $myProp: 'still here'});
  });

  it('should not include $cancelRequest when resource is toJson\'ed', function() {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: true
      }
    });

    var card = CreditCard.get();
    var json = card.toJSON();

    expect(card.$cancelRequest).toBeDefined();
    expect(json.$cancelRequest).toBeUndefined();
  });


  describe('promise api', function() {

    var $rootScope;


    beforeEach(inject(function(_$rootScope_) {
      $rootScope = _$rootScope_;
    }));


    describe('single resource', function() {

      it('should add $promise to the result object', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(callback);
        expect(callback).not.toHaveBeenCalled();

        $httpBackend.flush();

        expect(callback).toHaveBeenCalledOnce();
        expect(callback.calls.mostRecent().args[0]).toBe(cc);
      });


      it('should keep $promise around after resolution', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(callback);
        $httpBackend.flush();

        callback.calls.reset();

        cc.$promise.then(callback);
        $rootScope.$apply(); //flush async queue

        expect(callback).toHaveBeenCalledOnce();
      });


      it('should keep the original promise after instance action', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        $httpBackend.expect('POST', '/CreditCard/123').respond({id: 123, number: '9876'});

        var cc = CreditCard.get({id: 123});
        var originalPromise = cc.$promise;

        cc.number = '666';
        cc.$save({id: 123});

        expect(cc.$promise).toBe(originalPromise);
      });


      it('should allow promise chaining', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(function(value) { return 'new value'; }).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledOnceWith('new value');
      });


      it('should allow $promise error callback registration', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond(404, 'resource not found');
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(null, callback);
        $httpBackend.flush();

        var response = callback.calls.mostRecent().args[0];

        expect(response.data).toEqual('resource not found');
        expect(response.status).toEqual(404);
      });


      it('should add $resolved boolean field to the result object', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        expect(cc.$resolved).toBe(false);

        cc.$promise.then(callback);
        expect(cc.$resolved).toBe(false);

        $httpBackend.flush();

        expect(cc.$resolved).toBe(true);
      });


      it('should set $resolved field to true when an error occurs', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond(404, 'resource not found');
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(null, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnce();
        expect(cc.$resolved).toBe(true);
      });


      it('should keep $resolved true in all subsequent interactions', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});
        $httpBackend.flush();
        expect(cc.$resolved).toBe(true);

        $httpBackend.expect('POST', '/CreditCard/123').respond();
        cc.$save({id: 123});
        expect(cc.$resolved).toBe(true);
        $httpBackend.flush();
        expect(cc.$resolved).toBe(true);
      });


      it('should return promise from action method calls', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = new CreditCard({name: 'Mojo'});

        expect(cc).toEqualData({name: 'Mojo'});

        cc.$get({id:123}).then(callback);

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnce();
        expect(cc).toEqualData({id: 123, number: '9876'});
        callback.calls.reset();

        $httpBackend.expect('POST', '/CreditCard').respond({id: 1, number: '9'});

        cc.$save().then(callback);

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnce();
        expect(cc).toEqualData({id: 1, number: '9'});
      });


      it('should allow parsing a value from headers', function() {
        // https://github.com/angular/angular.js/pull/2607#issuecomment-17759933
        $httpBackend.expect('POST', '/CreditCard').respond(201, '', {'Location': '/new-id'});

        var parseUrlFromHeaders = function(response) {
          var resource = response.resource;
          resource.url = response.headers('Location');
          return resource;
        };

        var CreditCard = $resource('/CreditCard', {}, {
          save: {
            method: 'post',
            interceptor: {response: parseUrlFromHeaders}
          }
        });

        var cc = new CreditCard({name: 'Me'});

        cc.$save();
        $httpBackend.flush();

        expect(cc.url).toBe('/new-id');
      });


      it('should pass the same transformed value to success callbacks and to promises', function() {
        $httpBackend.expect('GET', '/CreditCard').respond(200, { value: 'original' });

        var transformResponse = function(response) {
          return { value: 'transformed' };
        };

        var CreditCard = $resource('/CreditCard', {}, {
          call: {
            method: 'get',
            interceptor: { response: transformResponse }
          }
        });

        var successValue,
            promiseValue;

        var cc = new CreditCard({ name: 'Me' });

        var req = cc.$call({}, function(result) {
          successValue = result;
        });
        req.then(function(result) {
          promiseValue = result;
        });

        $httpBackend.flush();
        expect(successValue).toEqual({ value: 'transformed' });
        expect(promiseValue).toEqual({ value: 'transformed' });
        expect(successValue).toBe(promiseValue);
      });
    });


    describe('resource collection', function() {

      it('should add $promise to the result object', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(callback);
        expect(callback).not.toHaveBeenCalled();

        $httpBackend.flush();

        expect(callback).toHaveBeenCalledOnce();
        expect(callback.calls.mostRecent().args[0]).toBe(ccs);
      });


      it('should keep $promise around after resolution', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(callback);
        $httpBackend.flush();

        callback.calls.reset();

        ccs.$promise.then(callback);
        $rootScope.$apply(); //flush async queue

        expect(callback).toHaveBeenCalledOnce();
      });


      it('should allow promise chaining', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(function(value) { return 'new value'; }).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledOnceWith('new value');
      });


      it('should allow $promise error callback registration', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond(404, 'resource not found');
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(null, callback);
        $httpBackend.flush();

        var response = callback.calls.mostRecent().args[0];

        expect(response.data).toEqual('resource not found');
        expect(response.status).toEqual(404);
      });


      it('should add $resolved boolean field to the result object', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'}, callback);

        expect(ccs.$resolved).toBe(false);

        ccs.$promise.then(callback);
        expect(ccs.$resolved).toBe(false);

        $httpBackend.flush();

        expect(ccs.$resolved).toBe(true);
      });


      it('should set $resolved field to true when an error occurs', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond(404, 'resource not found');
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(null, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnce();
        expect(ccs.$resolved).toBe(true);
      });
    });


    describe('requestInterceptor', function() {
      var rejectReason = {'lol':'cat'};
      var successSpy, failureSpy;

      beforeEach(function() {
        successSpy = jasmine.createSpy('successSpy');
        failureSpy = jasmine.createSpy('failureSpy');
      });

      it('should allow per action request interceptor that gets full configuration', function() {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request: function(httpConfig) {
                callback(httpConfig);
                return httpConfig;
              }
            }
          }
        });

        $httpBackend.expect('GET', '/CreditCard').respond([{id: 1}]);

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnce();
        expect(successSpy).toHaveBeenCalledOnce();
        expect(failureSpy).not.toHaveBeenCalled();

        expect(callback).toHaveBeenCalledWith({
          'method': 'get',
          'url': '/CreditCard'
        });
      });

      it('should call $http with the value returned from requestInterceptor', function() {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request: function(httpConfig) {
                httpConfig.url = '/DebitCard';
                return httpConfig;
              }
            }
          }
        });

        $httpBackend.expect('GET', '/DebitCard').respond([{id: 1}]);

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);

        $httpBackend.flush();
        expect(successSpy).toHaveBeenCalledOnceWith(jasmine.arrayContaining([
          jasmine.objectContaining({id: 1})
        ]));
        expect(failureSpy).not.toHaveBeenCalled();
      });

      it('should abort the operation if the requestInterceptor rejects the operation', function() {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request: function() {
                return $q.reject(rejectReason);
              }
            }
          }
        });

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);

        // Make sure all promises resolve.
        $rootScope.$apply();

        // Ensure the resource promise was rejected
        expect(resource.$resolved).toBeTruthy();
        expect(successSpy).not.toHaveBeenCalled();
        expect(failureSpy).toHaveBeenCalledOnceWith(rejectReason);

        // Ensure that no requests were made.
        $httpBackend.verifyNoOutstandingRequest();
      });

      it('should call requestErrorInterceptor if requestInterceptor rejects the operation', function() {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request: function() {
                return $q.reject(rejectReason);
              },
              requestError: function(rejection) {
                callback(rejection);
                return $q.reject(rejection);
              }
            }
          }
        });

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);
        $rootScope.$digest();

        expect(callback).toHaveBeenCalledOnceWith(rejectReason);
        expect(successSpy).not.toHaveBeenCalled();
        expect(failureSpy).toHaveBeenCalledOnceWith(rejectReason);

        // Ensure that no requests were made.
        $httpBackend.verifyNoOutstandingRequest();
      });

      it('should abort the operation if a requestErrorInterceptor rejects the operation', function() {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request: function() {
                return $q.reject(rejectReason);
              },
              requestError: function(rejection) {
                return $q.reject(rejection);
              }
            }
          }
        });

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);
        $rootScope.$apply();

        expect(resource.$resolved).toBeTruthy();
        expect(successSpy).not.toHaveBeenCalled();
        expect(failureSpy).toHaveBeenCalledOnceWith(rejectReason);

        // Ensure that no requests were made.
        $httpBackend.verifyNoOutstandingRequest();
      });

      it('should continue the operation if a requestErrorInterceptor rescues it', function() {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request: function(httpConfig) {
                return $q.reject(httpConfig);
              },
              requestError: function(httpConfig) {
                return $q.resolve(httpConfig);
              }
            }
          }
        });

        $httpBackend.expect('GET', '/CreditCard').respond([{id: 1}]);

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);
        $httpBackend.flush();

        expect(resource.$resolved).toBeTruthy();
        expect(successSpy).toHaveBeenCalledOnceWith(jasmine.arrayContaining([
          jasmine.objectContaining({id: 1})
        ]));
        expect(failureSpy).not.toHaveBeenCalled();

        $httpBackend.verifyNoOutstandingRequest();
      });
    });


    describe('responseInterceptor', function() {
      it('should allow per action response interceptor that gets full response', function() {
        var response;

        $httpBackend.expect('GET', '/CreditCard').respond(201, {id: 1}, {foo: 'bar'}, 'Ack');
        CreditCard = $resource('/CreditCard', {}, {
          get: {
            method: 'get',
            interceptor: {response: function(resp) { response = resp; }}
          }
        });

        var cc = CreditCard.get();
        $httpBackend.flush();

        expect(response.resource).toBe(cc);
        expect(response.config).toBeDefined();
        expect(response.status).toBe(201);
        expect(response.statusText).toBe('Ack');
        expect(response.headers()).toEqual({foo: 'bar'});
      });


      it('should allow per action responseError interceptor that gets full response', function() {
        var response;

        $httpBackend.expect('GET', '/CreditCard').respond(404, {ignored: 'stuff'}, {foo: 'bar'}, 'Ack');
        CreditCard = $resource('/CreditCard', {}, {
          get: {
            method: 'get',
            interceptor: {responseError: function(resp) { response = resp; }}
          }
        });

        var cc = CreditCard.get();
        $httpBackend.flush();

        expect(response.resource).toBe(cc);
        expect(response.config).toBeDefined();
        expect(response.status).toBe(404);
        expect(response.statusText).toBe('Ack');
        expect(response.headers()).toEqual({foo: 'bar'});
      });


      it('should fulfill the promise with the value returned by the response interceptor',
        function() {
          $httpBackend.whenGET('/CreditCard').respond(200);
          CreditCard = $resource('/CreditCard', {}, {
            test1: {
              method: 'get',
              interceptor: {response: function() { return 'foo'; }}
            },
            test2: {
              method: 'get',
              interceptor: {response: function() { return $q.resolve('bar'); }}
            },
            test3: {
              method: 'get',
              interceptor: {response: function() { return $q.reject('baz'); }}
            }
          });

          CreditCard.test1().$promise.then(callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('foo');

          callback.calls.reset();

          CreditCard.test2().$promise.then(callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('bar');

          callback.calls.reset();

          CreditCard.test3().$promise.then(null, callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('baz');
        }
      );


      it('should fulfill the promise with the value returned by the responseError interceptor',
        function() {
          $httpBackend.whenGET('/CreditCard').respond(404);
          CreditCard = $resource('/CreditCard', {}, {
            test1: {
              method: 'get',
              interceptor: {responseError: function() { return 'foo'; }}
            },
            test2: {
              method: 'get',
              interceptor: {responseError: function() { return $q.resolve('bar'); }}
            },
            test3: {
              method: 'get',
              interceptor: {responseError: function() { return $q.reject('baz'); }}
            }
          });

          CreditCard.test1().$promise.then(callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('foo');

          callback.calls.reset();

          CreditCard.test2().$promise.then(callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('bar');

          callback.calls.reset();

          CreditCard.test3().$promise.then(null, callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('baz');
        }
      );


      it('should call the success callback when response interceptor succeeds', function() {
        $httpBackend.whenGET('/CreditCard').respond(200);
        CreditCard = $resource('/CreditCard', {}, {
          test1: {
            method: 'get',
            interceptor: {response: function() { return 'foo'; }}
          },
          test2: {
            method: 'get',
            interceptor: {response: function() { return $q.resolve('bar'); }}
          }
        });

        CreditCard.test1(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('foo', jasmine.any(Function), 200, '');

        callback.calls.reset();

        CreditCard.test2(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('bar', jasmine.any(Function), 200, '');
      });


      it('should call the error callback when response interceptor fails', function() {
        $httpBackend.whenGET('/CreditCard').respond(200);
        CreditCard = $resource('/CreditCard', {}, {
          test1: {
            method: 'get',
            interceptor: {response: function() { throw 'foo'; }}
          },
          test2: {
            method: 'get',
            interceptor: {response: function() { return $q.reject('bar'); }}
          }
        });

        CreditCard.test1(noop, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('foo');

        callback.calls.reset();

        CreditCard.test2(noop, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('bar');
      });


      it('should call the success callback when responseError interceptor succeeds', function() {
        $httpBackend.whenGET('/CreditCard').respond(404);
        CreditCard = $resource('/CreditCard', {}, {
          test1: {
            method: 'get',
            interceptor: {responseError: function() { return 'foo'; }}
          },
          test2: {
            method: 'get',
            interceptor: {responseError: function() { return $q.resolve('bar'); }}
          }
        });

        CreditCard.test1(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('foo', jasmine.any(Function), 404, '');

        callback.calls.reset();

        CreditCard.test2(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('bar', jasmine.any(Function), 404, '');
      });


      it('should call the error callback when responseError interceptor fails', function() {
        $httpBackend.whenGET('/CreditCard').respond(404);
        CreditCard = $resource('/CreditCard', {}, {
          test1: {
            method: 'get',
            interceptor: {responseError: function() { throw 'foo'; }}
          },
          test2: {
            method: 'get',
            interceptor: {responseError: function() { return $q.reject('bar'); }}
          }
        });

        CreditCard.test1(noop, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('foo');

        callback.calls.reset();

        CreditCard.test2(noop, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('bar');
      });
    });
  });


  describe('success mode', function() {
    it('should call the success callback (as 1st argument) on 2xx responses', function() {
      var instance, headers, status, statusText;
      var successCb = jasmine.createSpy('successCb').and.callFake(function(d, h, s, t) {
        expect(d).toBe(instance);
        expect(h()).toEqual(jasmine.objectContaining(headers));
        expect(s).toBe(status);
        expect(t).toBe(statusText);
      });

      instance = CreditCard.get(successCb);
      headers = {foo: 'bar'};
      status = 200;
      statusText = 'OK';
      $httpBackend.expect('GET', '/CreditCard').respond(status, {}, headers, statusText);
      $httpBackend.flush();

      expect(successCb).toHaveBeenCalledOnce();

      instance = CreditCard.get(successCb);
      headers = {baz: 'qux'};
      status = 299;
      statusText = 'KO';
      $httpBackend.expect('GET', '/CreditCard').respond(status, {}, headers, statusText);
      $httpBackend.flush();

      expect(successCb).toHaveBeenCalledTimes(2);
    });


    it('should call the success callback (as 2nd argument) on 2xx responses', function() {
      var instance, headers, status, statusText;
      var successCb = jasmine.createSpy('successCb').and.callFake(function(d, h, s, t) {
        expect(d).toBe(instance);
        expect(h()).toEqual(jasmine.objectContaining(headers));
        expect(s).toBe(status);
        expect(t).toBe(statusText);
      });

      instance = CreditCard.get({id: 123}, successCb);
      headers = {foo: 'bar'};
      status = 200;
      statusText = 'OK';
      $httpBackend.expect('GET', '/CreditCard/123').respond(status, {}, headers, statusText);
      $httpBackend.flush();

      expect(successCb).toHaveBeenCalledOnce();

      instance = CreditCard.get({id: 456}, successCb);
      headers = {baz: 'qux'};
      status = 299;
      statusText = 'KO';
      $httpBackend.expect('GET', '/CreditCard/456').respond(status, {}, headers, statusText);
      $httpBackend.flush();

      expect(successCb).toHaveBeenCalledTimes(2);
    });
  });

  describe('failure mode', function() {
    var ERROR_CODE = 500,
        ERROR_RESPONSE = 'Server Error',
        errorCB;

    beforeEach(function() {
      errorCB = jasmine.createSpy('error').and.callFake(function(response) {
        expect(response.data).toBe(ERROR_RESPONSE);
        expect(response.status).toBe(ERROR_CODE);
      });
    });


    it('should call the error callback if provided on non 2xx response', function() {
      $httpBackend.expect('GET', '/CreditCard/123').respond(ERROR_CODE, ERROR_RESPONSE);

      CreditCard.get({id:123}, callback, errorCB);
      $httpBackend.flush();
      expect(errorCB).toHaveBeenCalledOnce();
      expect(callback).not.toHaveBeenCalled();
    });


    it('should call the error callback if provided on non 2xx response (without data)', function() {
      $httpBackend.expect('GET', '/CreditCard').respond(ERROR_CODE, ERROR_RESPONSE);

      CreditCard.get(callback, errorCB);
      $httpBackend.flush();
      expect(errorCB).toHaveBeenCalledOnce();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  it('should transform request/response', function() {
    var Person = $resource('/Person/:id', {}, {
      save: {
        method: 'POST',
        params: {id: '@id'},
        transformRequest: function(data) {
          return angular.toJson({ __id: data.id });
        },
        transformResponse: function(data) {
          return { id: data.__id };
        }
      }
    });

    $httpBackend.expect('POST', '/Person/123', { __id: 123 }).respond({ __id: 456 });
    var person = new Person({id:123});
    person.$save();
    $httpBackend.flush();
    expect(person.id).toEqual(456);
  });

  describe('suffix parameter', function() {

    describe('query', function() {
      it('should add a suffix', function() {
        $httpBackend.expect('GET', '/users.json').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users/:id.json', {id: '@id'});
        var user = UserService.query();
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      it('should not require it if not provided', function() {
        $httpBackend.expect('GET', '/users.json').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users.json');
        var user = UserService.query();
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      it('should work when query parameters are supplied', function() {
        $httpBackend.expect('GET', '/users.json?red=blue').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.query({red: 'blue'});
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      it('should work when query parameters are supplied and the format is a resource parameter', function() {
        $httpBackend.expect('GET', '/users.json?red=blue').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users/:user_id.:format', {user_id: '@id', format: 'json'});
        var user = UserService.query({red: 'blue'});
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      it('should work with the action is overridden', function() {
        $httpBackend.expect('GET', '/users.json').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users/:user_id', {user_id: '@id'}, {
          query: {
            method: 'GET',
            url: '/users/:user_id.json',
            isArray: true
          }
        });
        var user = UserService.query();
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      it('should not convert string literals in array into Resource objects', function() {
        $httpBackend.expect('GET', '/names.json').respond(['mary', 'jane']);
        var strings = $resource('/names.json').query();
        $httpBackend.flush();
        expect(strings).toEqualData(['mary', 'jane']);
      });

      it('should not convert number literals in array into Resource objects', function() {
        $httpBackend.expect('GET', '/names.json').respond([213, 456]);
        var numbers = $resource('/names.json').query();
        $httpBackend.flush();
        expect(numbers).toEqualData([213, 456]);
      });

      it('should not convert boolean literals in array into Resource objects', function() {
        $httpBackend.expect('GET', '/names.json').respond([true, false]);
        var bools = $resource('/names.json').query();
        $httpBackend.flush();
        expect(bools).toEqualData([true, false]);
      });
    });

    describe('get', function() {
      it('should add them to the id', function() {
        $httpBackend.expect('GET', '/users/1.json').respond({id: 1, name: 'user1'});
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.get({user_id: 1});
        $httpBackend.flush();
        expect(user).toEqualData({id: 1, name: 'user1'});
      });

      it('should work when an id and query parameters are supplied', function() {
        $httpBackend.expect('GET', '/users/1.json?red=blue').respond({id: 1, name: 'user1'});
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.get({user_id: 1, red: 'blue'});
        $httpBackend.flush();
        expect(user).toEqualData({id: 1, name: 'user1'});
      });

      it('should work when the format is a parameter', function() {
        $httpBackend.expect('GET', '/users/1.json?red=blue').respond({id: 1, name: 'user1'});
        var UserService = $resource('/users/:user_id.:format', {user_id: '@id', format: 'json'});
        var user = UserService.get({user_id: 1, red: 'blue'});
        $httpBackend.flush();
        expect(user).toEqualData({id: 1, name: 'user1'});
      });

      it('should work with the action is overridden', function() {
        $httpBackend.expect('GET', '/users/1.json').respond({id: 1, name: 'user1'});
        var UserService = $resource('/users/:user_id', {user_id: '@id'}, {
          get: {
            method: 'GET',
            url: '/users/:user_id.json'
          }
        });
        var user = UserService.get({user_id: 1});
        $httpBackend.flush();
        expect(user).toEqualData({id: 1, name: 'user1'});
      });
    });

    describe('save', function() {
      it('should append the suffix', function() {
        $httpBackend.expect('POST', '/users.json', '{"name":"user1"}').respond({id: 123, name: 'user1'});
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.save({name: 'user1'}, callback);
        expect(user).toEqualData({name: 'user1'});
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(user).toEqualData({id: 123, name: 'user1'});
        expect(callback).toHaveBeenCalledOnce();
        expect(callback.calls.mostRecent().args[0]).toEqual(user);
        expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));
      });

      it('should append when an id is supplied', function() {
        $httpBackend.expect('POST', '/users/123.json', '{"id":123,"name":"newName"}').respond({id: 123, name: 'newName'});
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.save({id: 123, name: 'newName'}, callback);
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(user).toEqualData({id: 123, name: 'newName'});
        expect(callback).toHaveBeenCalledOnce();
        expect(callback.calls.mostRecent().args[0]).toEqual(user);
        expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));
      });

      it('should append when an id is supplied and the format is a parameter', function() {
        $httpBackend.expect('POST', '/users/123.json', '{"id":123,"name":"newName"}').respond({id: 123, name: 'newName'});
        var UserService = $resource('/users/:user_id.:format', {user_id: '@id', format: 'json'});
        var user = UserService.save({id: 123, name: 'newName'}, callback);
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(user).toEqualData({id: 123, name: 'newName'});
        expect(callback).toHaveBeenCalledOnce();
        expect(callback.calls.mostRecent().args[0]).toEqual(user);
        expect(callback.calls.mostRecent().args[1]()).toEqual(Object.create(null));
      });
    });

    describe('escaping /. with /\\.', function() {
      it('should work with query()', function() {
        $httpBackend.expect('GET', '/users/.json').respond();
        $resource('/users/\\.json').query();
      });
      it('should work with get()', function() {
        $httpBackend.expect('GET', '/users/.json').respond();
        $resource('/users/\\.json').get();
      });
      it('should work with save()', function() {
        $httpBackend.expect('POST', '/users/.json').respond();
        $resource('/users/\\.json').save({});
      });
      it('should work with save() if dynamic params', function() {
        $httpBackend.expect('POST', '/users/.json').respond();
        $resource('/users/:json', {json: '\\.json'}).save({});
      });
      it('should work with query() if dynamic params', function() {
        $httpBackend.expect('GET', '/users/.json').respond();
        $resource('/users/:json', {json: '\\.json'}).query();
      });
      it('should work with get() if dynamic params', function() {
        $httpBackend.expect('GET', '/users/.json').respond();
        $resource('/users/:json', {json: '\\.json'}).get();
      });
    });
  });

  describe('action-level url override', function() {

    it('should support overriding url template with static url', function() {
      $httpBackend.expect('GET', '/override-url?type=Customer&typeId=123').respond({id: 'abc'});
      var TypeItem = $resource('/:type/:typeId', {type: 'Order'}, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/override-url'
        }
      });
      var item = TypeItem.get({typeId: 123});
      $httpBackend.flush();
      expect(item).toEqualData({id: 'abc'});
    });


    it('should support overriding url template with a new template ending in param', function() {
      //    url parameter in action, parameter ending the string
      $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});
      var TypeItem = $resource('/foo/:type', {type: 'Order'}, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/:type/:typeId'
        }
      });
      var item = TypeItem.get({typeId: 123});
      $httpBackend.flush();
      expect(item).toEqualData({id: 'abc'});

      //    url parameter in action, parameter not ending the string
      $httpBackend.expect('GET', '/Customer/123/pay').respond({id: 'abc'});
      TypeItem = $resource('/foo/:type', {type: 'Order'}, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/:type/:typeId/pay'
        }
      });
      item = TypeItem.get({typeId: 123});
      $httpBackend.flush();
      expect(item).toEqualData({id: 'abc'});
    });


    it('should support overriding url template with a new template ending in string', function() {
      $httpBackend.expect('GET', '/Customer/123/pay').respond({id: 'abc'});
      var TypeItem = $resource('/foo/:type', {type: 'Order'}, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/:type/:typeId/pay'
        }
      });
      var item = TypeItem.get({typeId: 123});
      $httpBackend.flush();
      expect(item).toEqualData({id: 'abc'});
    });
  });
});

describe('extra params', function() {
  var $http;
  var $httpBackend;
  var $resource;
  var $rootScope;

  beforeEach(module('ngResource'));

  beforeEach(module(function($provide) {
    $provide.decorator('$http', function($delegate) {
      return jasmine.createSpy('$http').and.callFake($delegate);
    });
  }));

  beforeEach(inject(function(_$http_, _$httpBackend_, _$resource_, _$rootScope_) {
    $http = _$http_;
    $httpBackend = _$httpBackend_;
    $resource = _$resource_;
    $rootScope = _$rootScope_;
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });


  it('should pass extra params to `$http` as `config.params`', function() {
    $httpBackend.expectGET('/bar?baz=qux').respond('{}');

    var R = $resource('/:foo');
    R.get({foo: 'bar', baz: 'qux'});

    $rootScope.$digest();
    expect($http).toHaveBeenCalledWith(jasmine.objectContaining({params: {baz: 'qux'}}));
  });

  it('should pass extra params even if `Object.prototype` has properties with the same name',
    function() {
      $httpBackend.expectGET('/foo?toString=bar').respond('{}');

      var R = $resource('/foo');
      R.get({toString: 'bar'});
    }
  );
});

describe('errors', function() {
  var $httpBackend, $resource;

  beforeEach(module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(module('ngResource'));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $resource = $injector.get('$resource');
  }));


  it('should fail if action expects an object but response is an array', function() {
    var successSpy = jasmine.createSpy('successSpy');
    var failureSpy = jasmine.createSpy('failureSpy');

    $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});

    $resource('/Customer/123').query()
      .$promise.then(successSpy, function(e) { failureSpy(e.message); });
    $httpBackend.flush();

    expect(successSpy).not.toHaveBeenCalled();
    expect(failureSpy).toHaveBeenCalled();
    expect(failureSpy.calls.mostRecent().args[0]).toEqualMinErr('$resource', 'badcfg',
        'Error in resource configuration for action `query`. ' +
        'Expected response to contain an array but got an object (Request: GET /Customer/123)');
  });

  it('should fail if action expects an array but response is an object', function() {
    var successSpy = jasmine.createSpy('successSpy');
    var failureSpy = jasmine.createSpy('failureSpy');

    $httpBackend.expect('GET', '/Customer/123').respond([1,2,3]);

    $resource('/Customer/123').get()
      .$promise.then(successSpy, function(e) { failureSpy(e.message); });
    $httpBackend.flush();

    expect(successSpy).not.toHaveBeenCalled();
    expect(failureSpy).toHaveBeenCalled();
    expect(failureSpy.calls.mostRecent().args[0]).toEqualMinErr('$resource', 'badcfg',
        'Error in resource configuration for action `get`. ' +
        'Expected response to contain an object but got an array (Request: GET /Customer/123)');
  });
});

describe('handling rejections', function() {
  var $exceptionHandler;
  var $httpBackend;
  var $resource;

  beforeEach(module('ngResource'));
  beforeEach(module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(inject(function(_$exceptionHandler_, _$httpBackend_, _$resource_) {
    $exceptionHandler = _$exceptionHandler_;
    $httpBackend = _$httpBackend_;
    $resource = _$resource_;

    $httpBackend.whenGET('/CreditCard').respond(404);
  }));


  it('should reject the promise even when there is an error callback', function() {
    var errorCb1 = jasmine.createSpy('errorCb1');
    var errorCb2 = jasmine.createSpy('errorCb2');
    var CreditCard = $resource('/CreditCard');

    CreditCard.get(noop, errorCb1).$promise.catch(errorCb2);
    $httpBackend.flush();

    expect(errorCb1).toHaveBeenCalledOnce();
    expect(errorCb2).toHaveBeenCalledOnce();
  });


  it('should report a PUR when no error callback or responseError interceptor is provided',
    function() {
      var CreditCard = $resource('/CreditCard');

      CreditCard.get();
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0]).toMatch(/^Possibly unhandled rejection/);
    }
  );


  it('should not report a PUR when an error callback or responseError interceptor is provided',
    function() {
      var CreditCard = $resource('/CreditCard', {}, {
        test1: {
          method: 'GET'
        },
        test2: {
          method: 'GET',
          interceptor: {responseError: function() { return {}; }}
        }
      });

      // With error callback
      CreditCard.test1(noop, noop);
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(0);

      // With responseError interceptor
      CreditCard.test2();
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(0);

      // With error callback and responseError interceptor
      CreditCard.test2(noop, noop);
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(0);
    }
  );


  it('should report a PUR when the responseError interceptor returns a rejected promise',
    inject(function($q) {
      var CreditCard = $resource('/CreditCard', {}, {
        test: {
          method: 'GET',
          interceptor: {responseError: function() { return $q.reject({}); }}
        }
      });

      CreditCard.test();
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0]).toMatch(/^Possibly unhandled rejection/);
    })
  );


  it('should not swallow exceptions in success callback when error callback is provided',
    function() {
      $httpBackend.expectGET('/CreditCard/123').respond(null);
      var CreditCard = $resource('/CreditCard/:id');
      CreditCard.get({id: 123},
          function(res) { throw new Error('should be caught'); },
          function() {});

      $httpBackend.flush();
      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0]).toMatch(/^Error: should be caught/);
    }
  );


  it('should not swallow exceptions in success callback when error callback is not provided',
    function() {
      $httpBackend.expectGET('/CreditCard/123').respond(null);
      var CreditCard = $resource('/CreditCard/:id');
      CreditCard.get({id: 123},
          function(res) { throw new Error('should be caught'); });

      $httpBackend.flush();
      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0]).toMatch(/^Error: should be caught/);
    }
  );


  it('should not swallow exceptions in success callback when error callback is provided and has responseError interceptor',
    function() {
      $httpBackend.expectGET('/CreditCard/123').respond(null);
      var CreditCard = $resource('/CreditCard/:id', null, {
        get: {
          method: 'GET',
          interceptor: {responseError: function() {}}
        }
      });

      CreditCard.get({id: 123},
          function(res) { throw new Error('should be caught'); },
          function() {});

      $httpBackend.flush();
      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0]).toMatch(/^Error: should be caught/);
    }
  );


  it('should not swallow exceptions in success callback when error callback is not provided and has responseError interceptor',
    function() {
      $httpBackend.expectGET('/CreditCard/123').respond(null);
      var CreditCard = $resource('/CreditCard/:id', null, {
        get: {
          method: 'GET',
          interceptor: {responseError: function() {}}
        }
      });

      CreditCard.get({id: 123},
          function(res) { throw new Error('should be caught'); });

      $httpBackend.flush();
      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0]).toMatch(/^Error: should be caught/);
    }
  );


  it('should not propagate exceptions in success callback to the returned promise', function() {
    var successCallbackSpy = jasmine.createSpy('successCallback').and.throwError('error');
    var promiseResolveSpy = jasmine.createSpy('promiseResolve');
    var promiseRejectSpy = jasmine.createSpy('promiseReject');

    $httpBackend.expectGET('/CreditCard/123').respond(null);
    var CreditCard = $resource('/CreditCard/:id');
    CreditCard.get({id: 123}, successCallbackSpy).
      $promise.then(promiseResolveSpy, promiseRejectSpy);

    $httpBackend.flush();
    expect(successCallbackSpy).toHaveBeenCalled();
    expect(promiseResolveSpy).toHaveBeenCalledWith(jasmine.any(CreditCard));
    expect(promiseRejectSpy).not.toHaveBeenCalled();
  });


  it('should not be able to recover from inside the error callback', function() {
    var errorCallbackSpy = jasmine.createSpy('errorCallback').and.returnValue({id: 123});
    var promiseResolveSpy = jasmine.createSpy('promiseResolve');
    var promiseRejectSpy = jasmine.createSpy('promiseReject');

    $httpBackend.expectGET('/CreditCard/123').respond(404);
    var CreditCard = $resource('/CreditCard/:id');
    CreditCard.get({id: 123}, noop, errorCallbackSpy).
      $promise.then(promiseResolveSpy, promiseRejectSpy);

    $httpBackend.flush();
    expect(errorCallbackSpy).toHaveBeenCalled();
    expect(promiseResolveSpy).not.toHaveBeenCalled();
    expect(promiseRejectSpy).toHaveBeenCalledWith(jasmine.objectContaining({status: 404}));
  });


  describe('requestInterceptor', function() {
    var rejectReason = {'lol':'cat'};
    var $q, $rootScope;
    var successSpy, failureSpy, callback;

    beforeEach(inject(function(_$q_, _$rootScope_) {
      $q = _$q_;
      $rootScope = _$rootScope_;

      successSpy = jasmine.createSpy('successSpy');
      failureSpy = jasmine.createSpy('failureSpy');
      callback = jasmine.createSpy();
    }));

    it('should call requestErrorInterceptor if requestInterceptor throws an error', function() {
      var CreditCard = $resource('/CreditCard', {}, {
        query: {
          method: 'get',
          isArray: true,
          interceptor: {
            request: function() {
              throw rejectReason;
            },
            requestError: function(rejection) {
              callback(rejection);
              return $q.reject(rejection);
            }
          }
        }
      });

      var resource = CreditCard.query();
      resource.$promise.then(successSpy, failureSpy);
      $rootScope.$apply();

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(rejectReason);
      expect(successSpy).not.toHaveBeenCalled();
      expect(failureSpy).toHaveBeenCalledOnce();
      expect(failureSpy).toHaveBeenCalledWith(rejectReason);

      // Ensure that no requests were made.
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should abort the operation if a requestErrorInterceptor throws an exception', function() {
      var CreditCard = $resource('/CreditCard', {}, {
        query: {
          method: 'get',
          isArray: true,
          interceptor: {
            request: function() {
              return $q.reject();
            },
            requestError: function() {
              throw rejectReason;
            }
          }
        }
      });

      var resource = CreditCard.query();
      resource.$promise.then(successSpy, failureSpy);
      $rootScope.$apply();

      expect(resource.$resolved).toBeTruthy();
      expect(successSpy).not.toHaveBeenCalled();
      expect(failureSpy).toHaveBeenCalledOnce();
      expect(failureSpy).toHaveBeenCalledWith(rejectReason);

      // Ensure that no requests were made.
      $httpBackend.verifyNoOutstandingRequest();
    });
  });
});

describe('cancelling requests', function() {
  var httpSpy;
  var $httpBackend;
  var $resource;
  var $timeout;

  beforeEach(module('ngResource', function($provide) {
    $provide.decorator('$http', function($delegate) {
      httpSpy = jasmine.createSpy('$http').and.callFake($delegate);
      return httpSpy;
    });
  }));

  beforeEach(inject(function(_$httpBackend_, _$resource_, _$timeout_) {
    $httpBackend = _$httpBackend_;
    $resource = _$resource_;
    $timeout = _$timeout_;
  }));

  it('should accept numeric timeouts in actions and pass them to $http', function() {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        timeout: 10000
      }
    });

    CreditCard.get();
    $httpBackend.flush();

    expect(httpSpy).toHaveBeenCalledOnce();
    expect(httpSpy.calls.argsFor(0)[0].timeout).toBe(10000);
  });

  it('should delete non-numeric timeouts in actions and log a $debug message',
    inject(function($log, $q) {
      spyOn($log, 'debug');
      $httpBackend.whenGET('/CreditCard').respond({});

      var CreditCard = $resource('/CreditCard', {}, {
        get: {
          method: 'GET',
          timeout: $q.defer().promise
        }
      });

      CreditCard.get();
      $httpBackend.flush();

      expect(httpSpy).toHaveBeenCalledOnce();
      expect(httpSpy.calls.argsFor(0)[0].timeout).toBeUndefined();
      expect($log.debug).toHaveBeenCalledOnceWith('ngResource:\n' +
          '  Only numeric values are allowed as `timeout`.\n' +
          '  Promises are not supported in $resource, because the same value would ' +
          'be used for multiple requests. If you are looking for a way to cancel ' +
          'requests, you should use the `cancellable` option.');
    })
  );

  it('should use `cancellable` value if passed a non-numeric `timeout` in an action',
    inject(function($log, $q, $rootScope) {
      spyOn($log, 'debug');
      $httpBackend.whenGET('/CreditCard').respond({});

      var CreditCard = $resource('/CreditCard', {}, {
        get: {
          method: 'GET',
          timeout: $q.defer().promise,
          cancellable: true
        }
      });

      var creditCard = CreditCard.get();
      $rootScope.$digest();
      expect(creditCard.$cancelRequest).toBeDefined();
      expect(httpSpy.calls.argsFor(0)[0].timeout).toEqual(jasmine.any($q));
      expect(httpSpy.calls.argsFor(0)[0].timeout.then).toBeDefined();

      expect($log.debug).toHaveBeenCalledOnceWith('ngResource:\n' +
          '  Only numeric values are allowed as `timeout`.\n' +
          '  Promises are not supported in $resource, because the same value would ' +
          'be used for multiple requests. If you are looking for a way to cancel ' +
          'requests, you should use the `cancellable` option.');
    })
  );

  it('should not create a `$cancelRequest` method for instance calls', function() {
    $httpBackend.whenPOST('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      save1: {
        method: 'POST',
        cancellable: false
      },
      save2: {
        method: 'POST',
        cancellable: true
      }
    });

    var creditCard = new CreditCard();

    var promise1 = creditCard.$save1();
    expect(promise1.$cancelRequest).toBeUndefined();
    expect(creditCard.$cancelRequest).toBeUndefined();

    var promise2 = creditCard.$save2();
    expect(promise2.$cancelRequest).toBeUndefined();
    expect(creditCard.$cancelRequest).toBeUndefined();

    $httpBackend.flush();
    expect(promise1.$cancelRequest).toBeUndefined();
    expect(promise2.$cancelRequest).toBeUndefined();
    expect(creditCard.$cancelRequest).toBeUndefined();
  });

  it('should not create a `$cancelRequest` method for non-cancellable calls', function() {
    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: false
      }
    });

    var creditCard = CreditCard.get();

    expect(creditCard.$cancelRequest).toBeUndefined();
  });

  it('should also take into account `options.cancellable`', function() {
    var options = {cancellable: true};
    var CreditCard = $resource('/CreditCard', {}, {
      get1: {method: 'GET', cancellable: false},
      get2: {method: 'GET', cancellable: true},
      get3: {method: 'GET'}
    }, options);

    var creditCard1 = CreditCard.get1();
    var creditCard2 = CreditCard.get2();
    var creditCard3 = CreditCard.get3();

    expect(creditCard1.$cancelRequest).toBeUndefined();
    expect(creditCard2.$cancelRequest).toBeDefined();
    expect(creditCard3.$cancelRequest).toBeDefined();

    options = {cancellable: false};
    CreditCard = $resource('/CreditCard', {}, {
      get1: {method: 'GET', cancellable: false},
      get2: {method: 'GET', cancellable: true},
      get3: {method: 'GET'}
    }, options);

    creditCard1 = CreditCard.get1();
    creditCard2 = CreditCard.get2();
    creditCard3 = CreditCard.get3();

    expect(creditCard1.$cancelRequest).toBeUndefined();
    expect(creditCard2.$cancelRequest).toBeDefined();
    expect(creditCard3.$cancelRequest).toBeUndefined();
  });

  it('should accept numeric timeouts in cancellable actions and cancel the request when timeout occurs', function() {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        timeout: 10000,
        cancellable: true
      }
    });

    var ccs = CreditCard.get();
    ccs.$promise.catch(noop);
    $timeout.flush();
    expect($httpBackend.flush).toThrow(new Error('No pending request to flush !'));

    CreditCard.get();
    expect($httpBackend.flush).not.toThrow();

  });

  it('should cancel the request (if cancellable), when calling `$cancelRequest`', function() {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: true
      }
    });

    var ccs = CreditCard.get();
    ccs.$cancelRequest();
    expect($httpBackend.flush).toThrow(new Error('No pending request to flush !'));

    CreditCard.get();
    expect($httpBackend.flush).not.toThrow();
  });

  it('should cancel the request, when calling `$cancelRequest` in cancellable actions with timeout defined', function() {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        timeout: 10000,
        cancellable: true
      }
    });

    var ccs = CreditCard.get();
    ccs.$cancelRequest();
    expect($httpBackend.flush).toThrow(new Error('No pending request to flush !'));

    CreditCard.get();
    expect($httpBackend.flush).not.toThrow();
  });

  it('should reset `$cancelRequest` after the response arrives', function() {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: true
      }
    });

    var creditCard = CreditCard.get();

    expect(creditCard.$cancelRequest).not.toBe(noop);

    $httpBackend.flush();

    expect(creditCard.$cancelRequest).toBe(noop);
  });

  it('should not break when calling old `$cancelRequest` after the response arrives', function() {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: true
      }
    });

    var creditCard = CreditCard.get();
    var cancelRequest = creditCard.$cancelRequest;

    $httpBackend.flush();

    expect(cancelRequest).not.toBe(noop);
    expect(cancelRequest).not.toThrow();
  });
});

describe('configuring `cancellable` on the provider', function() {
  var $resource;

  beforeEach(module('ngResource', function($resourceProvider) {
    $resourceProvider.defaults.cancellable = true;
  }));

  beforeEach(inject(function(_$resource_) {
    $resource = _$resource_;
  }));

  it('should also take into account `$resourceProvider.defaults.cancellable`', function() {
    var CreditCard = $resource('/CreditCard', {}, {
      get1: {method: 'GET', cancellable: false},
      get2: {method: 'GET', cancellable: true},
      get3: {method: 'GET'}
    });

    var creditCard1 = CreditCard.get1();
    var creditCard2 = CreditCard.get2();
    var creditCard3 = CreditCard.get3();

    expect(creditCard1.$cancelRequest).toBeUndefined();
    expect(creditCard2.$cancelRequest).toBeDefined();
    expect(creditCard3.$cancelRequest).toBeDefined();
  });
});
});


})(window, window.angular);
