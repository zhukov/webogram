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

  ConfigStorage.get('current_layout', function (layout) {
    switch (layout) {
      case 'mobile': Config.Mobile = true; break;
      case 'desktop': Config.Mobile = false; break;
      default: Config.Mobile = Config.Mobile; break;
    }

    $('head').append(
      '<link rel="stylesheet" href="css/' + (Config.Mobile ? 'mobile.css' : 'desktop.css') + '" />'
    );
    $(document).ready(function() {
      angular.bootstrap(document, ['myApp']);
    });
  });
})();