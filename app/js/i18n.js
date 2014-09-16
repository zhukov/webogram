'use strict';

angular.module('myApp.i18n', ['izhukov.utils'])
  .factory('_', ['$http', '$route', 'Storage', '$locale', function($http, $route, Storage, $locale) {
    var locale = 'en-us';
    var messages = {};
    var supported = {
      'de-de': 'Deutsch',
      'en-us': 'English'
    };

    function insertParams(msgstr, params) {
      for (var i in params) {
        if (params.hasOwnProperty(i)){
          var param = params[i];
          var regex = new RegExp('\{ *' + i + '(?: *: *(.*))? *\}');
          var match = regex.exec(msgstr);
          if (match) {
            if (match[1] != undefined) {
              param = insertParams(param, match[1].split('|'));
            }
            msgstr = msgstr.replace(match[0], param.toString().trim());
          }
        }
      }
      return msgstr;
    }

    function _(msgid, params) {
      var msgstr = msgid;
      if (messages.hasOwnProperty(msgid)) {
        msgstr = messages[msgid];
      }
      if (arguments.length > 1) {
        if (typeof params == 'string') {
          Array.prototype.shift.apply(arguments);
          msgstr = insertParams(msgstr, arguments);
        } else {
          msgstr = insertParams(msgstr, params);
        }
      }
      return msgstr;
    }

    _.supported = function() {
      return supported;
    };

    _.locale = function(newValue) {
      if (newValue === undefined) {
        return locale;
      }

      if (!supported.hasOwnProperty(newValue)) {
        newValue = 'en-us'; // fallback
      }

      if (locale != newValue) {
        var new_messages = false;
        var ngLocaleReady = false;
        var onReady = function() {
          if (new_messages === false || ngLocaleReady === false) {
            // only execute when both - ngLocale and the new messages - are loaded
            return;
          }
          function deepUpdate(oldValue, newValue) {
            for (var i in newValue) {
              if (i in oldValue && typeof oldValue[i] === 'object' && i !== null){
                deepUpdate(oldValue[i], newValue[i]);
              } else {
                oldValue[i] = newValue[i];
              }
            }
          }
          // first we need to explizitly request the new $locale so it gets initialized
          // then we recursively update our current $locale with it so all other modules
          // already holding a reference to our $locale will get the new values as well
          // this hack is necessary because ngLocale just isn't designed to be changed at runtime
          deepUpdate($locale, angular.injector(['ngLocale']).get('$locale'));
          messages = new_messages;
          locale = newValue;
          $route.reload();
        };

        angular.element('<script>')
          .appendTo(angular.element('head'))
          .on('load', function() {
            ngLocaleReady = true;
            onReady();
          })
          .attr('src', 'vendor/angular/i18n/angular-locale_' + newValue + '.js');

        $http({method: 'GET', url: 'js/locales/' + newValue + '.json'}).success(function(json){
          new_messages = json;
          onReady();
        });
      }
    };

    Storage.get('i18n_locale').then(_.locale);

    return _;
  }])

  .filter('i18n', ['_', function(_) {
    return _;
  }])

  .directive('myI18n', ['_', function(_) {
    return {
      restrict: 'EA',
      compile: function(element) {
        var msgid = element.attr("my-i18n") || element.attr("msgid") || element.html().replace(/\s+/g, ' ').trim();
        var msgstr = _(msgid);
        element.html(msgstr);
      }
    }
  }])

  .directive('ngPluralize', ['_', function(_) {
    return {
      restrict: 'EA',
      priority: 1, // execute before built-in ngPluralize
      compile: function(element) {
        var msgid = element.attr('when');
        var msgstr = _(msgid);
        element.attr('when', msgstr);
      }
    }
  }])

  .directive('myI18nFormat', ['_', function(_) {
    return {
      restrict: 'EA',
      compile: function(element) {
        var params = element.children('my-param:not([name])').map(function(index, param) {
          return angular.element(param).html();
        }).toArray();
        element.children('my-param[name]').each(function(i, param) {
          param = angular.element(param);
          params[param.attr('name')] = param.html();
        });
        var formats = element.attr("my-i18n-format") || element.attr("msgid") ? element : element.children('my-format, [my-format]');
        formats.each(function(index, element) {
          var format = angular.element(element);
          var msgid = format.attr("my-i18n-format") || format.attr("msgid") || format.html().replace(/\s+/g, ' ').trim();
          var msgstr = _(msgid, params);
          format.html(msgstr);
        });
        element.children('my-param').remove();
      }
    }
  }]);
