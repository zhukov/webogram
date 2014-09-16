'use strict';

angular.module('myApp.i18n', ['izhukov.utils'])
  .factory('_', ['$http', '$route', '$sanitize', 'Storage', '$locale', function($http, $route, $sanitize, Storage, $locale) {
    var locale = 'en-us';
    var messages = {};
    var fallbackMessages = {};
    var supported = {
      'de-de': 'Deutsch',
      'en-us': 'English'
    };
    var paramRegEx = /\{\s*([a-zA-Z\d\--]+)(?:\s*:\s*(.*?))?\s*\}/g,
        markdownRegEx = /\*\*(.+?)\*\*|(\n)/g,
        parserCache = {};

    function insertParams(msgstr, params) {
      return msgstr.replace(paramRegEx, function ($0, paramKey, nestedMsgStr) {
        var param = params[paramKey];
        if (param === undefined) {
          console.warn('[i18n] missing param ' + paramKey + ' for key ' + msgstr);
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
      if (parserCache[msgid] !== undefined) {
        return parserCache[msgid];
      }
      var raw = msgstr,
          match,
          html = [],
          result;

      while (match = raw.match(markdownRegEx)) {
        html.push(encodeEntities(raw.substr(0, match.index)));
        if (match[1]) {
          html.push('<strong>', encodeEntities(match[1]), '</strong>')
        } else if (match[2]) {
          html.push('<br/>')
        }
        raw = raw.substr(match.index + match[0].length);
      }
      html.push(encodeEntities(raw));

      return parserCache[msgid] = $sanitize(html.join(''));
    }

    function _(msgid, params) {
      var msgstr = msgid;
      if (messages.hasOwnProperty(msgid)) {
        msgstr = messages[msgid];
      } else if (fallbackMessages.hasOwnProperty(msgid)) {
        msgstr = fallbackMessages[msgid];
        console.warn('[i18n] missing locale key ' + locale + ' / ' + msgid);
      } else {
        console.warn('[i18n] missing key ' + msgid);
        return msgid;
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
    });

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
        if (msgid.substr(-3) == '_md') {
          element.html(msgstr);
        } else {
          element.text(msgstr);
        }
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
          if (msgid.substr(-3) == '_md') {
            format.html(msgstr);
          } else {
            format.text(msgstr);
          }
        });
        element.children('my-param').remove();
      }
    }
  }]);
