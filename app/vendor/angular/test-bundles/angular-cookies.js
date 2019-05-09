/**
 * @license AngularJS v1.7.8
 * (c) 2010-2018 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

/**
 * @ngdoc module
 * @name ngCookies
 * @description
 *
 * The `ngCookies` module provides a convenient wrapper for reading and writing browser cookies.
 *
 * See {@link ngCookies.$cookies `$cookies`} for usage.
 */


angular.module('ngCookies', ['ng']).
  info({ angularVersion: '1.7.8' }).
  /**
   * @ngdoc provider
   * @name $cookiesProvider
   * @description
   * Use `$cookiesProvider` to change the default behavior of the {@link ngCookies.$cookies $cookies} service.
   * */
   provider('$cookies', [/** @this */function $CookiesProvider() {
    /**
     * @ngdoc property
     * @name $cookiesProvider#defaults
     * @description
     *
     * Object containing default options to pass when setting cookies.
     *
     * The object may have following properties:
     *
     * - **path** - `{string}` - The cookie will be available only for this path and its
     *   sub-paths. By default, this is the URL that appears in your `<base>` tag.
     * - **domain** - `{string}` - The cookie will be available only for this domain and
     *   its sub-domains. For security reasons the user agent will not accept the cookie
     *   if the current domain is not a sub-domain of this domain or equal to it.
     * - **expires** - `{string|Date}` - String of the form "Wdy, DD Mon YYYY HH:MM:SS GMT"
     *   or a Date object indicating the exact date/time this cookie will expire.
     * - **secure** - `{boolean}` - If `true`, then the cookie will only be available through a
     *   secured connection.
     * - **samesite** - `{string}` - prevents the browser from sending the cookie along with cross-site requests.
     *   Accepts the values `lax` and `strict`. See the [OWASP Wiki](https://www.owasp.org/index.php/SameSite)
     *   for more info. Note that as of May 2018, not all browsers support `SameSite`,
     *   so it cannot be used as a single measure against Cross-Site-Request-Forgery (CSRF) attacks.
     *
     * Note: By default, the address that appears in your `<base>` tag will be used as the path.
     * This is important so that cookies will be visible for all routes when html5mode is enabled.
     *
     * @example
     *
     * ```js
     * angular.module('cookiesProviderExample', ['ngCookies'])
     *   .config(['$cookiesProvider', function($cookiesProvider) {
     *     // Setting default options
     *     $cookiesProvider.defaults.domain = 'foo.com';
     *     $cookiesProvider.defaults.secure = true;
     *   }]);
     * ```
     **/
    var defaults = this.defaults = {};

    function calcOptions(options) {
      return options ? angular.extend({}, defaults, options) : defaults;
    }

    /**
     * @ngdoc service
     * @name $cookies
     *
     * @description
     * Provides read/write access to browser's cookies.
     *
     * <div class="alert alert-info">
     * Up until AngularJS 1.3, `$cookies` exposed properties that represented the
     * current browser cookie values. In version 1.4, this behavior has changed, and
     * `$cookies` now provides a standard api of getters, setters etc.
     * </div>
     *
     * Requires the {@link ngCookies `ngCookies`} module to be installed.
     *
     * @example
     *
     * ```js
     * angular.module('cookiesExample', ['ngCookies'])
     *   .controller('ExampleController', ['$cookies', function($cookies) {
     *     // Retrieving a cookie
     *     var favoriteCookie = $cookies.get('myFavorite');
     *     // Setting a cookie
     *     $cookies.put('myFavorite', 'oatmeal');
     *   }]);
     * ```
     */
    this.$get = ['$$cookieReader', '$$cookieWriter', function($$cookieReader, $$cookieWriter) {
      return {
        /**
         * @ngdoc method
         * @name $cookies#get
         *
         * @description
         * Returns the value of given cookie key
         *
         * @param {string} key Id to use for lookup.
         * @returns {string} Raw cookie value.
         */
        get: function(key) {
          return $$cookieReader()[key];
        },

        /**
         * @ngdoc method
         * @name $cookies#getObject
         *
         * @description
         * Returns the deserialized value of given cookie key
         *
         * @param {string} key Id to use for lookup.
         * @returns {Object} Deserialized cookie value.
         */
        getObject: function(key) {
          var value = this.get(key);
          return value ? angular.fromJson(value) : value;
        },

        /**
         * @ngdoc method
         * @name $cookies#getAll
         *
         * @description
         * Returns a key value object with all the cookies
         *
         * @returns {Object} All cookies
         */
        getAll: function() {
          return $$cookieReader();
        },

        /**
         * @ngdoc method
         * @name $cookies#put
         *
         * @description
         * Sets a value for given cookie key
         *
         * @param {string} key Id for the `value`.
         * @param {string} value Raw value to be stored.
         * @param {Object=} options Options object.
         *    See {@link ngCookies.$cookiesProvider#defaults $cookiesProvider.defaults}
         */
        put: function(key, value, options) {
          $$cookieWriter(key, value, calcOptions(options));
        },

        /**
         * @ngdoc method
         * @name $cookies#putObject
         *
         * @description
         * Serializes and sets a value for given cookie key
         *
         * @param {string} key Id for the `value`.
         * @param {Object} value Value to be stored.
         * @param {Object=} options Options object.
         *    See {@link ngCookies.$cookiesProvider#defaults $cookiesProvider.defaults}
         */
        putObject: function(key, value, options) {
          this.put(key, angular.toJson(value), options);
        },

        /**
         * @ngdoc method
         * @name $cookies#remove
         *
         * @description
         * Remove given cookie
         *
         * @param {string} key Id of the key-value pair to delete.
         * @param {Object=} options Options object.
         *    See {@link ngCookies.$cookiesProvider#defaults $cookiesProvider.defaults}
         */
        remove: function(key, options) {
          $$cookieWriter(key, undefined, calcOptions(options));
        }
      };
    }];
  }]);

/**
 * @name $$cookieWriter
 * @requires $document
 *
 * @description
 * This is a private service for writing cookies
 *
 * @param {string} name Cookie name
 * @param {string=} value Cookie value (if undefined, cookie will be deleted)
 * @param {Object=} options Object with options that need to be stored for the cookie.
 */
function $$CookieWriter($document, $log, $browser) {
  var cookiePath = $browser.baseHref();
  var rawDocument = $document[0];

  function buildCookieString(name, value, options) {
    var path, expires;
    options = options || {};
    expires = options.expires;
    path = angular.isDefined(options.path) ? options.path : cookiePath;
    if (angular.isUndefined(value)) {
      expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
      value = '';
    }
    if (angular.isString(expires)) {
      expires = new Date(expires);
    }

    var str = encodeURIComponent(name) + '=' + encodeURIComponent(value);
    str += path ? ';path=' + path : '';
    str += options.domain ? ';domain=' + options.domain : '';
    str += expires ? ';expires=' + expires.toUTCString() : '';
    str += options.secure ? ';secure' : '';
    str += options.samesite ? ';samesite=' + options.samesite : '';

    // per http://www.ietf.org/rfc/rfc2109.txt browser must allow at minimum:
    // - 300 cookies
    // - 20 cookies per unique domain
    // - 4096 bytes per cookie
    var cookieLength = str.length + 1;
    if (cookieLength > 4096) {
      $log.warn('Cookie \'' + name +
        '\' possibly not set or overflowed because it was too large (' +
        cookieLength + ' > 4096 bytes)!');
    }

    return str;
  }

  return function(name, value, options) {
    rawDocument.cookie = buildCookieString(name, value, options);
  };
}

$$CookieWriter.$inject = ['$document', '$log', '$browser'];

angular.module('ngCookies').provider('$$cookieWriter', /** @this */ function $$CookieWriterProvider() {
  this.$get = $$CookieWriter;
});

describe('$cookies', function() {
  var mockedCookies;

  beforeEach(function() {
    mockedCookies = {};
    module('ngCookies', {
      $$cookieWriter: jasmine.createSpy('$$cookieWriter').and.callFake(function(name, value) {
        mockedCookies[name] = value;
      }),
      $$cookieReader: function() {
        return mockedCookies;
      }
    });
  });


  it('should serialize objects to json', inject(function($cookies) {
    $cookies.putObject('objectCookie', {id: 123, name: 'blah'});
    expect($cookies.get('objectCookie')).toEqual('{"id":123,"name":"blah"}');
  }));


  it('should deserialize json to object', inject(function($cookies) {
    $cookies.put('objectCookie', '{"id":123,"name":"blah"}');
    expect($cookies.getObject('objectCookie')).toEqual({id: 123, name: 'blah'});
  }));


  it('should delete objects from the store when remove is called', inject(function($cookies) {
    $cookies.putObject('gonner', { 'I\'ll':'Be Back'});
    expect($cookies.get('gonner')).toEqual('{"I\'ll":"Be Back"}');
    $cookies.remove('gonner');
    expect($cookies.get('gonner')).toEqual(undefined);
  }));


  it('should handle empty string value cookies', inject(function($cookies) {
    $cookies.putObject('emptyCookie','');
    expect($cookies.get('emptyCookie')).toEqual('""');
    expect($cookies.getObject('emptyCookie')).toEqual('');
    mockedCookies['blankCookie'] = '';
    expect($cookies.getObject('blankCookie')).toEqual('');
  }));


  it('should put cookie value without serializing', inject(function($cookies) {
    $cookies.put('name', 'value');
    $cookies.put('name2', '"value2"');
    expect($cookies.get('name')).toEqual('value');
    expect($cookies.getObject('name2')).toEqual('value2');
  }));


  it('should get cookie value without deserializing', inject(function($cookies) {
    $cookies.put('name', 'value');
    $cookies.putObject('name2', 'value2');
    expect($cookies.get('name')).toEqual('value');
    expect($cookies.get('name2')).toEqual('"value2"');
  }));

  it('should get all the cookies', inject(function($cookies) {
    $cookies.put('name', 'value');
    $cookies.putObject('name2', 'value2');
    expect($cookies.getAll()).toEqual({name: 'value', name2: '"value2"'});
  }));


  it('should pass options on put', inject(function($cookies, $$cookieWriter) {
    $cookies.put('name', 'value', {path: '/a/b'});
    expect($$cookieWriter).toHaveBeenCalledWith('name', 'value', {path: '/a/b'});
  }));


  it('should pass options on putObject', inject(function($cookies, $$cookieWriter) {
    $cookies.putObject('name', 'value', {path: '/a/b'});
    expect($$cookieWriter).toHaveBeenCalledWith('name', '"value"', {path: '/a/b'});
  }));


  it('should pass options on remove', inject(function($cookies, $$cookieWriter) {
    $cookies.remove('name', {path: '/a/b'});
    expect($$cookieWriter).toHaveBeenCalledWith('name', undefined, {path: '/a/b'});
  }));


  it('should pass default options on put', function() {
    module(function($cookiesProvider) {
      $cookiesProvider.defaults.secure = true;
    });
    inject(function($cookies, $$cookieWriter) {
      $cookies.put('name', 'value', {path: '/a/b'});
      expect($$cookieWriter).toHaveBeenCalledWith('name', 'value', {path: '/a/b', secure: true});
    });
  });


  it('should pass default options on putObject', function() {
    module(function($cookiesProvider) {
      $cookiesProvider.defaults.secure = true;
    });
    inject(function($cookies, $$cookieWriter) {
      $cookies.putObject('name', 'value', {path: '/a/b'});
      expect($$cookieWriter).toHaveBeenCalledWith('name', '"value"', {path: '/a/b', secure: true});
    });
  });


  it('should pass default options on remove', function() {
    module(function($cookiesProvider) {
      $cookiesProvider.defaults.secure = true;
    });
    inject(function($cookies, $$cookieWriter) {
      $cookies.remove('name', {path: '/a/b'});
      expect($$cookieWriter).toHaveBeenCalledWith('name', undefined, {path: '/a/b', secure: true});
    });
  });


  it('should let passed options override default options', function() {
    module(function($cookiesProvider) {
      $cookiesProvider.defaults.secure = true;
    });
    inject(function($cookies, $$cookieWriter) {
      $cookies.put('name', 'value', {secure: false});
      expect($$cookieWriter).toHaveBeenCalledWith('name', 'value', {secure: false});
    });
  });


  it('should pass default options if no options are passed', function() {
    module(function($cookiesProvider) {
      $cookiesProvider.defaults.secure = true;
    });
    inject(function($cookies, $$cookieWriter) {
      $cookies.put('name', 'value');
      expect($$cookieWriter).toHaveBeenCalledWith('name', 'value', {secure: true});
    });
  });

 });

describe('$$cookieWriter', function() {
  var $$cookieWriter, document;

  function deleteAllCookies() {
    var cookies = document.cookie.split(';');
    var path = window.location.pathname;

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf('=');
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      var parts = path.split('/');
      while (parts.length) {
        document.cookie = name + '=;path=' + (parts.join('/') || '/') + ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
        parts.pop();
      }
    }
  }

  beforeEach(function() {
    document = window.document;
    deleteAllCookies();
    expect(document.cookie).toEqual('');

    module('ngCookies');
    inject(function(_$$cookieWriter_) {
      $$cookieWriter = _$$cookieWriter_;
    });
  });


  afterEach(function() {
    deleteAllCookies();
    expect(document.cookie).toEqual('');
  });


  describe('remove via $$cookieWriter(cookieName, undefined)', function() {

    it('should remove a cookie when it is present', function() {
      document.cookie = 'foo=bar;path=/';

      $$cookieWriter('foo', undefined);

      expect(document.cookie).toEqual('');
    });


    it('should do nothing when an nonexisting cookie is being removed', function() {
      $$cookieWriter('doesntexist', undefined);
      expect(document.cookie).toEqual('');
    });
  });


  describe('put via $$cookieWriter(cookieName, string)', function() {

    it('should create and store a cookie', function() {
      $$cookieWriter('cookieName', 'cookie=Value');
      expect(document.cookie).toMatch(/cookieName=cookie%3DValue;? ?/);
    });


    it('should overwrite an existing unsynced cookie', function() {
      document.cookie = 'cookie=new;path=/';

      var oldVal = $$cookieWriter('cookie', 'newer');

      expect(document.cookie).toEqual('cookie=newer');
      expect(oldVal).not.toBeDefined();
    });

    it('should encode both name and value', function() {
      $$cookieWriter('cookie1=', 'val;ue');
      $$cookieWriter('cookie2=bar;baz', 'val=ue');

      var rawCookies = document.cookie.split('; '); //order is not guaranteed, so we need to parse
      expect(rawCookies.length).toEqual(2);
      expect(rawCookies).toContain('cookie1%3D=val%3Bue');
      expect(rawCookies).toContain('cookie2%3Dbar%3Bbaz=val%3Due');
    });

    it('should log warnings when 4kb per cookie storage limit is reached', inject(function($log) {
      var i, longVal = '', cookieStr;

      for (i = 0; i < 4083; i++) {
        longVal += 'x';
      }

      cookieStr = document.cookie;
      $$cookieWriter('x', longVal); //total size 4093-4096, so it should go through
      expect(document.cookie).not.toEqual(cookieStr);
      expect(document.cookie).toEqual('x=' + longVal);
      expect($log.warn.logs).toEqual([]);

      $$cookieWriter('x', longVal + 'xxxx'); //total size 4097-4099, a warning should be logged
      expect($log.warn.logs).toEqual(
        [['Cookie \'x\' possibly not set or overflowed because it was too large (4097 > 4096 ' +
           'bytes)!']]);

      //force browser to dropped a cookie and make sure that the cache is not out of sync
      $$cookieWriter('x', 'shortVal');
      expect(document.cookie).toEqual('x=shortVal'); //needed to prime the cache
      cookieStr = document.cookie;
      $$cookieWriter('x', longVal + longVal + longVal); //should be too long for all browsers

      if (document.cookie !== cookieStr) {
        this.fail(new Error('browser didn\'t drop long cookie when it was expected. make the ' +
            'cookie in this test longer'));
      }

      expect(document.cookie).toEqual('x=shortVal');
      $log.reset();
    }));
  });

  describe('put via $$cookieWriter(cookieName, string), if no <base href> ', function() {
    beforeEach(inject(function($browser) {
      $browser.$$baseHref = undefined;
    }));

    it('should default path in cookie to "" (empty string)', function() {
      $$cookieWriter('cookie', 'bender');
      // This only fails in Safari and IE when cookiePath returns undefined
      // Where it now succeeds since baseHref return '' instead of undefined
      expect(document.cookie).toEqual('cookie=bender');
    });
  });
});

describe('cookie options', function() {
  var fakeDocument, $$cookieWriter;
  var isUndefined = angular.isUndefined;

  function getLastCookieAssignment(key) {
    return fakeDocument[0].cookie
              .split(';')
              .reduce(function(prev, value) {
                var pair = value.split('=', 2);
                if (pair[0] === key) {
                  if (isUndefined(prev)) {
                    return isUndefined(pair[1]) ? true : pair[1];
                  } else {
                    throw new Error('duplicate key in cookie string');
                  }
                } else {
                  return prev;
                }
              }, undefined);
  }

  beforeEach(function() {
    fakeDocument = [{cookie: ''}];
    module('ngCookies', {$document: fakeDocument});
    inject(function($browser) {
      $browser.$$baseHref = '/a/b';
    });
    inject(function(_$$cookieWriter_) {
      $$cookieWriter = _$$cookieWriter_;
    });
  });

  it('should use baseHref as default path', function() {
    $$cookieWriter('name', 'value');
    expect(getLastCookieAssignment('path')).toBe('/a/b');
  });

  it('should accept path option', function() {
    $$cookieWriter('name', 'value', {path: '/c/d'});
    expect(getLastCookieAssignment('path')).toBe('/c/d');
  });

  it('should accept domain option', function() {
    $$cookieWriter('name', 'value', {domain: '.example.com'});
    expect(getLastCookieAssignment('domain')).toBe('.example.com');
  });

  it('should accept secure option', function() {
    $$cookieWriter('name', 'value', {secure: true});
    expect(getLastCookieAssignment('secure')).toBe(true);
  });

  it('should accept samesite option when value is lax', function() {
    $$cookieWriter('name', 'value', {samesite: 'lax'});
    expect(getLastCookieAssignment('samesite')).toBe('lax');
  });

  it('should accept samesite option when value is strict', function() {
    $$cookieWriter('name', 'value', {samesite: 'strict'});
    expect(getLastCookieAssignment('samesite')).toBe('strict');
  });

  it('should accept expires option on set', function() {
    $$cookieWriter('name', 'value', {expires: 'Fri, 19 Dec 2014 00:00:00 GMT'});
    expect(getLastCookieAssignment('expires')).toMatch(/^Fri, 19 Dec 2014 00:00:00 (UTC|GMT)$/);
  });

  it('should always use epoch time as expire time on remove', function() {
    $$cookieWriter('name', undefined, {expires: 'Fri, 19 Dec 2014 00:00:00 GMT'});
    expect(getLastCookieAssignment('expires')).toMatch(/^Thu, 0?1 Jan 1970 00:00:00 (UTC|GMT)$/);
  });

  it('should accept date object as expires option', function() {
    $$cookieWriter('name', 'value', {expires: new Date(Date.UTC(1981, 11, 27))});
    expect(getLastCookieAssignment('expires')).toMatch(/^Sun, 27 Dec 1981 00:00:00 (UTC|GMT)$/);
  });

});


})(window, window.angular);
