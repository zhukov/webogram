'use strict';

angular.module('myApp.i18n', ['izhukov.utils'])
  .factory('_', ['$http', '$route', 'Storage', '$locale', function($http, $route, Storage, $locale) {
    var locale = 'en-us';
    var messages = {};
    var fallback_messages = {};
    var supported = {
      'en-us': 'English'
    };
    var aliases = {
      'en': 'en-us'
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
      } else if (fallback_messages.hasOwnProperty(msgid)) {
        msgstr = fallback_messages[msgid];
        console.log('missing message for key ' + msgid + ' for current locale ' + locale);
      } else {
        console.log('missing message for key ' + msgid);
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

    $http({method: 'GET', url: 'js/locales/en-us.json'}).success(function(json){
      fallback_messages = json;
      if (locale == 'en-us') {
        messages = fallback_messages;
      }
      $route.reload();
    });

    Storage.get('i18n_locale').then(function(newLocale) {
      if (!newLocale) {
        newLocale = (navigator.language || '').toLowerCase();
        newLocale = aliases[newLocale] ? aliases[newLocale] : newLocale;
      }
      _.locale(newLocale);
    });

    return _;
  }])

  .filter('i18n', ['_', function(_) {
    return _;
  }])

  .directive('myI18n', ['_', function(_) {
    return {
      restrict: 'EA',
      compile: function(element) {
        var params = element.children('my-i18n-param:not([name]), [my-i18n-param=""]:not([name])').map(function(index, param) {
          return param.outerHTML;
        }).toArray();
        element.children('my-i18n-param[name], [my-i18n-param]:not([my-i18n-param=""]), [my-i18n-param][name]').each(function(i, param) {
          params[angular.element(param).attr('my-i18n-param') || angular.element(param).attr('name')] = param.outerHTML;
        });
        element.children('my-i18n-param').remove();
        var formats = element.attr("my-i18n") || element.attr("msgid") ? element : element.children('my-i18n-format, [my-i18n-format]');
        formats.each(function(index, element) {
          var format = angular.element(element);
          var msgid = format.attr("my-i18n") || format.attr("msgid") || format.attr("my-i18n-format") || format.html().replace(/\s+/g, ' ').trim();
          var msgstr = _(msgid, params);
          format.html(msgstr);
        });
      }
    }
  }]);
