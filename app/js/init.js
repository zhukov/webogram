;(function initAutoUpgrade () {

  // Prevent click-jacking
  try {
    if (window == window.top || window.chrome && chrome.app && chrome.app.window) {
      document.documentElement.style.display = 'block';
    } else {
      top.location = self.location;
    }
  } catch (e) {console.error('CJ protection', e)};

  window.safeConfirm = function (params, callback) {
    if (typeof params === 'string') {
      params = {message: params};
    }
    var result = false
    try {
      result = confirm(params.message);
    } catch (e) {
      result = true;
    }
    setTimeout(function () {callback(result)}, 10);
  };

  if (!window.applicationCache || Config.Modes.packed || !window.addEventListener) {
    return;
  }

  var appCache = window.applicationCache,
      declined = false,
      updateTimeout = false,
      scheduleUpdate = function (delay) {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(function () {
          try {
            appCache.update();
          } catch (ex) {
            console.log('appCache.update: ' + ex);
          }
        }, delay || 300000);
      },
      attach = function () {
        appCache.addEventListener('updateready', function (e) {
          if (appCache.status == appCache.UPDATEREADY) {
            if (!declined) {
              safeConfirm({type: 'WEBOGRAM_UPDATED_RELOAD', message: 'A new version of Webogram is downloaded. Launch it?'}, function (result) {
                if (result) {
                  window.location.reload();
                } else {
                  declined = true;
                }
              });
              scheduleUpdate();
            }
          }
        }, false);
        appCache.addEventListener('noupdate', function () {scheduleUpdate()}, false);
        appCache.addEventListener('error', function () {scheduleUpdate()}, false);
      };

  scheduleUpdate(3000);
  window.addEventListener('load', attach);
})();

(function initApplication () {
  var classes = [
    Config.Navigator.osX ? 'osx' : 'non_osx',
    Config.Navigator.retina ? 'is_2x' : 'is_1x'
  ];
  if (Config.Modes.ios_standalone) {
    classes.push('ios_standalone');
  }
  $(document.body).addClass(classes.join(' '));

  ConfigStorage.get('current_layout', 'i18n_locale', function (params) {
    var layout = params[0],
        locale = params[1],
        defaultLocale = 'en-us',
        bootReady = {
          dom: false,
          i18n_ng: false,
          i18n_messages: false,
          i18n_fallback: false
        },
        checkReady = function checkReady () {
          var i, ready = true;
          for (i in bootReady) {
            if (bootReady.hasOwnProperty(i) && bootReady[i] === false) {
              ready = false;
              break;
            }
          }
          if (ready) {
            bootReady.boot = false; 
            angular.bootstrap(document, ['myApp']);
          }
        };

    switch (layout) {
      case 'mobile': Config.Mobile = true; break;
      case 'desktop': Config.Mobile = false; break;
      default:
        Config.Mobile = Config.Navigator.mobile || $(window).width() < 480;
        break;
    }
    $('head').append(
      '<link rel="stylesheet" href="css/' + (Config.Mobile ? 'mobile.css' : 'desktop.css') + '" />'
    );

    if (!locale) {
      locale = (navigator.language || '').toLowerCase();
      locale = Config.I18n.aliases[locale] || locale;
    }
    for (var i = 0; i < Config.I18n.supported.length; i++) {
      if (Config.I18n.supported[i] == locale) {
        Config.I18n.locale = locale;
        break;
      }
    }
    bootReady.i18n_ng = Config.I18n.locale == defaultLocale; // Already included

    $.getJSON('js/locales/' + Config.I18n.locale + '.json').success(function (json) {
      Config.I18n.messages = json;
      bootReady.i18n_messages = true;
      if (Config.I18n.locale == defaultLocale) { // No fallback, leave empty object
        bootReady.i18n_fallback = true;
      }
      checkReady();
    });

    if (Config.I18n.locale != defaultLocale) {
      $.getJSON('js/locales/' + defaultLocale + '.json').success(function (json) {
        Config.I18n.fallback_messages = json;
        bootReady.i18n_fallback = true;
        checkReady();
      });
    }

    $(document).ready(function() {
      bootReady.dom = true;
      if (!bootReady.i18n_ng) { // onDOMready because needs to be after angular
        $('<script>').appendTo('body')
        .on('load', function() {
          bootReady.i18n_ng = true;
          checkReady();
        })
        .attr('src', 'vendor/angular/i18n/angular-locale_' + Config.I18n.locale + '.js');
      } else {
        checkReady();
      }
    });
  });
})();
