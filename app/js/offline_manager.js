;(function initAutoUpgrade () {
  window.safeConfirm = function (params, callback) {
    if (typeof params === 'string') {
      params = {message: params}
    }
    var result = false
    try {
      result = confirm(params.message)
    } catch (e) {
      result = true
    }
    setTimeout(function () {callback(result)}, 10)
  }

  if ((!navigator.serviceWorker && !window.applicationCache) ||
    Config.Modes.packed ||
    !window.addEventListener) {
    return
  }
  if ('web.telegram.org' !== location.hostname ||
      Config.Modes.test ||
      Config.Modes.ios_standalone ||
      location.search.indexOf('legacy=1') != -1) {
    // procceed
  } else {
    return
  }

  var declined = false
  function updateFound () {
    if (!declined) {
      safeConfirm({type: 'WEBOGRAM_UPDATED_RELOAD', message: 'A new version of Webogram is downloaded. Launch it?'}, function (result) {
        if (result) {
          window.location.reload()
        } else {
          declined = true
        }
      })
    }
  }

  if (navigator.serviceWorker) {
    // If available, use a Service Worker to handle offlining.
    navigator.serviceWorker.register('service_worker.js').then(function (registration) {
      console.log('Offline worker registered')
      registration.addEventListener('updatefound', function () {
        var installingWorker = this.installing

        // Wait for the new service worker to be installed before prompting to update.
        installingWorker.addEventListener('statechange', function () {
          switch (installingWorker.state) {
            case 'installed':
              // Only show the prompt if there is currently a controller so it is not
              // shown on first load.
              if (navigator.serviceWorker.controller) {
                updateFound()
              }
              break

            case 'redundant':
              console.error('The installing service worker became redundant.')
              break
          }
        })
      })
    }).catch(function (error) {
      console.error('Offline register SW error', error)
    })
  } else {
    // Otherwise, use AppCache.
    var appCache = window.applicationCache
    var updateTimeout = false
    var scheduleUpdate = function (delay) {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(function () {
        try {
          appCache.update()
        } catch (ex) {
          console.log('appCache.update: ' + ex)
        }
      }, delay || 300000)
    }

    scheduleUpdate(3000)
    window.addEventListener('load', function () {
      appCache.addEventListener('updateready', function () {
        if (appCache.status == appCache.UPDATEREADY) {
          updateFound()
        }
      }, false)
      appCache.addEventListener('noupdate', function () {scheduleUpdate()}, false)
      appCache.addEventListener('error', function () {scheduleUpdate()}, false)
    })
  }
})()
