'use strict'

angular.module('myApp.i18n', ['izhukov.utils'])
  .factory('_', ['$rootScope', '$locale', function ($rootScope, $locale) {
    var locale = Config.I18n.locale
    var messages = Config.I18n.messages
    var fallbackMessages = Config.I18n.fallback_messages
    var paramRegEx = /\{\s*([a-zA-Z\d\-_]+)(?:\s*:\s*(.*?))?\s*\}/g

    function insertParams (msgstr, params) {
      return msgstr.replace(paramRegEx, function ($0, paramKey, nestedMsgStr) {
        var param = params[paramKey]
        if (param === undefined) {
          console.warn('[i18n] missing param ' + paramKey + ' for message "' + msgstr + '"')
          return ''
        }
        if (nestedMsgStr !== undefined) {
          param = insertParams(param, nestedMsgStr.split('|'))
        }
        return param.toString().trim()
      })
    }

    function parseMarkdownString (msgstr, msgid) {
      msgstr = msgstr
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n|&#10;/g, '<br/>')

      return msgstr
    }

    function _ (msgid, params) {
      var raw = false
      var msgstr = msgid

      if (msgid.substr(-4) === '_raw') {
        raw = true
        msgid = msgid.substr(0, msgid.length - 4)
      }

      if (messages.hasOwnProperty(msgid)) {
        msgstr = messages[msgid]
      } else if (fallbackMessages.hasOwnProperty(msgid)) {
        msgstr = fallbackMessages[msgid]
        console.warn('[i18n] missing locale key ' + locale + ' / ' + msgid)
      } else {
        console.warn('[i18n] missing key ' + msgid)
        return msgid
      }

      if (!raw) {
        msgstr = encodeEntities(msgstr)
      }
      if (msgid.substr(-3) == '_md') {
        msgstr = parseMarkdownString(msgstr)
      }

      if (arguments.length > 1) {
        if (typeof params == 'string') {
          Array.prototype.shift.apply(arguments)
          msgstr = insertParams(msgstr, arguments)
        } else {
          msgstr = insertParams(msgstr, params)
        }
      }

      return msgstr
    }

    _.locale = function () {
      return locale
    }

    _.pluralize = function (msgid) {
      var categories = $rootScope.$eval(_(msgid + '_raw'))
      return function (count) {
        return (categories[$locale.pluralCat(count)] || '').replace('{}', count)
      }
    }

    return _
  }])

  .filter('i18n', ['_', function (_) {
    return function (msgid, params) {
      return _(msgid + '_raw', params)
    }
  }])

  .directive('ngPluralize', ['_', function (_) {
    return {
      restrict: 'EA',
      priority: 1, // execute before built-in ngPluralize
      compile: function (element) {
        var msgid = element.attr('when')
        var msgstr = _(msgid + '_raw')
        element.attr('when', msgstr)
      }
    }
  }])

  .directive('myI18n', ['_', function (_) {
    return {
      restrict: 'EA',
      compile: function (element) {
        var params = element.children('my-i18n-param:not([name]), [my-i18n-param=""]:not([name])').map(function (index, param) {
          return param.outerHTML
        }).toArray()
        element.children('my-i18n-param[name], [my-i18n-param]:not([my-i18n-param=""]), [my-i18n-param][name]').each(function (i, param) {
          params[angular.element(param).attr('my-i18n-param') || angular.element(param).attr('name')] = param.outerHTML
        })
        element.children('my-i18n-param').remove()
        var formats = element.attr('my-i18n') || element.attr('msgid') ? element : element.children('my-i18n-format, [my-i18n-format]')
        formats.each(function (index, element) {
          var format = angular.element(element)
          var msgid = format.attr('my-i18n') || format.attr('msgid') || format.attr('my-i18n-format') || format.html().replace(/\s+/g, ' ').trim()
          if (format.hasClass('nocopy')) {
            var msgstr = _(msgid + '_raw', params)
            format.attr('data-content', msgstr)
          } else {
            var msgstr = _(msgid, params)
            format.html(msgstr)
          }
        })
      }
    }
  }])
