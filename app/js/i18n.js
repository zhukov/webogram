'use strict';

angular.module('myApp.i18n', ['izhukov.utils'])
  .factory('_', ['$http', '$route', 'Storage', '$locale', function($http, $route, Storage, $locale) {
    var locale = 'en-us';
    var messages = {};
    var fallbackMessages = {};
    var supported = {
      'en-us': 'English'
    };
    var aliases = {
      'en': 'en-us'
    };
    var paramRegEx = /\{\s*([a-zA-Z\d\--]+)(?:\s*:\s*(.*?))?\s*\}/g;

    function insertParams(msgstr, params) {
      return msgstr.replace(paramRegEx, function ($0, paramKey, nestedMsgStr) {
        var param = params[paramKey];
        if (param === undefined) {
          console.warn('[i18n] missing param ' + paramKey + ' for message "' + msgstr + '"');
          return '';
        }
        if (nestedMsgStr !== undefined) {
          param = insertParams(param, nestedMsgStr.split('|'));
        }
        return param.toString().trim();
      });
    }

    function encodeEntities(value) {
      return value.
        replace(/&/g, '&amp;').
        replace(/([^\#-~| |!])/g, function (value) { // non-alphanumeric
          return '&#' + value.charCodeAt(0) + ';';
        }).
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;');
    }

    function parseMarkdownString(msgstr, msgid) {
      msgstr = msgstr.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br/>");
      return msgstr;
    }

    function _(msgid, params) {
      var raw = false;
      var msgstr = msgid;

      if (msgid.substr(-4) === '_raw') {
        raw = true;
        msgid = msgid.substr(0, msgid.length - 4);
      }

      if (messages.hasOwnProperty(msgid)) {
        msgstr = messages[msgid];
      } else if (fallbackMessages.hasOwnProperty(msgid)) {
        msgstr = fallbackMessages[msgid];
        console.warn('[i18n] missing locale key ' + locale + ' / ' + msgid);
      } else {
        console.warn('[i18n] missing key ' + msgid);
        return msgid;
      }

      if (!raw) {
        msgstr = encodeEntities(msgstr);
      }

      if (msgid.substr(-3) == '_md') {
        msgstr = parseMarkdownString(msgstr);
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
        var newMessages = false;
        var ngLocaleReady = false;
        var onReady = function() {
          if (newMessages === false || ngLocaleReady === false) {
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
          messages = newMessages;
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
          newMessages = json;
          onReady();
        });
      }
    };

    $http({method: 'GET', url: 'js/locales/en-us.json'}).success(function(json){
      fallbackMessages = json;
      if (locale == 'en-us') {
        messages = fallbackMessages;
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
