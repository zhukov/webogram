'use strict'
/* global ConfigStorage, Config */

;(function initTestApplication () {
  ConfigStorage.get('layout_selected', 'i18n_locale', function (params) {
    var locale = params[1]
    var defaultLocale = 'en-us'
    var bootReady = {
      dom: false,
      i18n_ng: false,
      i18n_messages: false,
      i18n_fallback: false
    }

    if (!locale) {
      locale = (navigator.language || '').toLowerCase()
      locale = Config.I18n.aliases[locale] || locale
    }
    for (var i = 0; i < Config.I18n.supported.length; i++) {
      if (Config.I18n.supported[i] === locale) {
        Config.I18n.locale = locale
        break
      }
    }
    bootReady.i18n_ng = Config.I18n.locale === defaultLocale // Already included

    $.getJSON('base/js/locales/' + Config.I18n.locale + '.json').success(function (json) {
      Config.I18n.messages = json
      bootReady.i18n_messages = true
      if (Config.I18n.locale === defaultLocale) { // No fallback, leave empty object
        bootReady.i18n_fallback = true
      }
    })

    if (Config.I18n.locale !== defaultLocale) {
      $.getJSON('base/js/locales/' + defaultLocale + '.json').success(function (json) {
        Config.I18n.fallback_messages = json
        bootReady.i18n_fallback = true
      })
    }
  })
})()
