console.log('[SW] Push worker started')

var pendingNotification = false

var defaultBaseUrl
switch (location.hostname) {
  case 'localhost':
    defaultBaseUrl = 'http://localhost:8000/app/index.html#/im'
    break
  case 'zhukov.github.io':
    defaultBaseUrl = 'https://zhukov.github.io/webogram/#/im'
    break
  default:
  case 'web.telegram.org':
    defaultBaseUrl = 'https://' + location.hostname + '/#/im'
}

self.addEventListener('push', function(event) {
  var obj = event.data.json()
  console.log('[SW] push', obj)

  var hasActiveWindows = false
  var checksPromise = new Promise(function (resolve, reject) {
    var nowTime = +(new Date())
    Promise.all([getMuteUntil(), getLastAliveTime()]).then(function (result) {
      var muteUntil = result[0]
      var lastAliveTime = result[1]
      return clients.matchAll({type: 'window'}).then(function(clientList) {
        console.log('matched clients', clientList)
        hasActiveWindows = clientList.length > 0
        if (hasActiveWindows) {
          console.log('Supress notification because some instance is alive')
          return reject()
        }
        if (userInvisibleIsSupported() &&
            muteUntil &&
            nowTime < muteUntil) {
          console.log('Supress notification because mute for ', Math.ceil((muteUntil - nowTime) / 60000), 'min')
          return reject()
        }
        if (!obj.badge) {
          return reject()
        }
        return resolve()
      })
    })
  })

  var notificationPromise = checksPromise.then(function () {
    return Promise.all([getSettings(), getLang()]).then(function (result) {
      return fireNotification(obj, result[0], result[1])
    })
  })

  var closePromise = notificationPromise.catch(function () {
    console.log('[SW] Closing all notifications on push', hasActiveWindows)
    if (userInvisibleIsSupported() || hasActiveWindows) {
      return closeAllNotifications()
    }
    return self.registration.showNotification('Telegram', {
      tag: 'unknown_peer'
    }).then(function () {
      if (hasActiveWindows) {
        return closeAllNotifications()
      }
      setTimeout(closeAllNotifications, hasActiveWindows ? 0 : 100)
    }).catch(function (error) {
      console.error('Show notification error', error)
    })
  })

  event.waitUntil(closePromise)
})

self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', function(event) {
  console.log('[SW] on activate')
  event.waitUntil(self.clients.claim());
});


self.addEventListener('message', function(event) {
  console.log('[SW] on message', event.data)
  var client = event.ports && event.ports[0] || event.source
  if (event.data.type == 'ping') {
    if (event.data.localNotifications) {
      lastAliveTime = +(new Date())
      IDBManager.setItem('push_last_alive', lastAliveTime)
    }

    if (pendingNotification &&
        client &&
        'postMessage' in client) {
      client.postMessage(pendingNotification)
      pendingNotification = false
    }

    if (event.data.lang) {
      lang = event.data.lang
      IDBManager.setItem('push_lang', lang)
    }
    if (event.data.settings) {
      settings = event.data.settings
      IDBManager.setItem('push_settings', settings)
    }
  }
  if (event.data.type == 'notifications_clear') {
    closeAllNotifications()
  }
})

function fireNotification(obj, settings, lang) {
  var title = obj.title || 'Telegram'
  var body = obj.description || ''
  var icon = 'img/logo_share.png'
  var peerID

  if (obj.custom && obj.custom.channel_id) {
    peerID = -obj.custom.channel_id
  }
  else if (obj.custom && obj.custom.chat_id) {
    peerID = -obj.custom.chat_id
  }
  else {
    peerID = obj.custom && obj.custom.from_id || 0
  }
  obj.custom.peerID = peerID
  var tag = 'peer' + peerID

  if (settings && settings.nopreview) {
    title = 'Telegram'
    body = lang.push_message_nopreview || 'You have a new message'
    tag = 'unknown_peer'
  }

  console.log('[SW] show notify', title, body, icon, obj)

  var notificationPromise = self.registration.showNotification(title, {
    body: body,
    icon: icon,
    tag: tag,
    data: obj,
    actions: [
      {
        action: 'mute1d',
        title: lang.push_action_mute1d || 'Mute for 24H'
      },
      {
        action: 'push_settings',
        title: lang.push_action_settings || 'Settings'
      }
    ]
  })

  return notificationPromise.then(function (event) {
    if (event && event.notification) {
      pushToNotifications(event.notification)
    }
    return Promise.resolve()
  }).catch(function (error) {
    console.error('Show notification promise', error)
  })
}


var notifications = []
function pushToNotifications(notification) {
  if (notifications.indexOf(notification) == -1) {
    notifications.push(notification)
    notification.onclose = onCloseNotification
  }
}

function onCloseNotification(event) {
  removeFromNotifications(event.notification)
}

function removeFromNotifications(notification) {
  var pos = notifications.indexOf(notification)
  if (pos != -1) {
    notifications.splice(pos, 1)
  }
}

function closeAllNotifications() {
  for (var i = 0, len = notifications.length; i < len; i++) {
    try {
      notifications[i].close()
    } catch (e) {}
  }

  var promise
  if ('getNotifications' in self.registration) {
    promise = self.registration.getNotifications({}).then(function(notifications) {
      for (var i = 0, len = notifications.length; i < len; i++) {
        try {
          notifications[i].close()
        } catch (e) {}
      }
    }).catch(function (error) {
      console.error('Offline register SW error', error)
    })
  } else {
    promise = Promise.resolve()
  }

  notifications = []

  return promise
}


self.addEventListener('notificationclick', function(event) {
  var notification = event.notification
  console.log('On notification click: ', notification.tag)
  notification.close()

  var action = event.action
  if (action == 'mute1d' && userInvisibleIsSupported()) {
    console.log('[SW] mute for 1d')
    muteUntil = +(new Date()) + 86400000
    IDBManager.setItem('push_mute_until', muteUntil)
    return
  }
  if (!notification.data) {
    return
  }

  var promise = clients.matchAll({
    type: 'window'
  }).then(function(clientList) {
    notification.data.action = action
    pendingNotification = {type: 'push_click', data: notification.data}
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i]
      if ('focus' in client) {
        client.focus()
        client.postMessage(pendingNotification)
        pendingNotification = false
        return
      }
    }
    if (clients.openWindow) {
      return getSettings().then(function (settings) {
        return clients.openWindow(settings.baseUrl || defaultBaseUrl)
      })
    }
  }).catch(function (error) {
    console.error('Clients.matchAll error', error)
  })

  event.waitUntil(promise)
})

self.addEventListener('notificationclose', onCloseNotification)




;(function () {
  var dbName = 'keyvalue'
  var dbStoreName = 'kvItems'
  var dbVersion = 2
  var openDbPromise
  var idbIsAvailable = self.indexedDB !== undefined &&
    self.IDBTransaction !== undefined

  function isAvailable () {
    return idbIsAvailable
  }

  function openDatabase () {
    if (openDbPromise) {
      return openDbPromise
    }

    return openDbPromise = new Promise(function (resolve, reject) {
      try {
        var request = indexedDB.open(dbName, dbVersion)
        var createObjectStore = function (db) {
          db.createObjectStore(dbStoreName)
        }
        if (!request) {
          return reject()
        }
      } catch (error) {
        console.error('error opening db', error.message)
        idbIsAvailable = false
        return reject(error)
      }

      var finished = false
      setTimeout(function () {
        if (!finished) {
          request.onerror({type: 'IDB_CREATE_TIMEOUT'})
        }
      }, 3000)

      request.onsuccess = function (event) {
        finished = true
        var db = request.result

        db.onerror = function (error) {
          idbIsAvailable = false
          console.error('Error creating/accessing IndexedDB database', error)
          reject(error)
        }

        resolve(db)
      }

      request.onerror = function (event) {
        finished = true
        idbIsAvailable = false
        console.error('Error creating/accessing IndexedDB database', event)
        reject(event)
      }

      request.onupgradeneeded = function (event) {
        finished = true
        console.warn('performing idb upgrade from', event.oldVersion, 'to', event.newVersion)
        var db = event.target.result
        if (event.oldVersion == 1) {
          db.deleteObjectStore(dbStoreName)
        }
        createObjectStore(db)
      }
    })
  }

  function setItem (key, value) {
    return openDatabase().then(function (db) {
      try {
        var objectStore = db.transaction([dbStoreName], IDBTransaction.READ_WRITE || 'readwrite').objectStore(dbStoreName)
        var request = objectStore.put(value, key)
      } catch (error) {
        idbIsAvailable = false
        return Promise.reject(error)
      }

      return new Promise(function(resolve, reject) {
        request.onsuccess = function (event) {
          resolve(value)
        }

        request.onerror = function (error) {
          reject(error)
        }
      })
    })
  }

  function getItem (key) {
    return openDatabase().then(function (db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([dbStoreName], IDBTransaction.READ || 'readonly').objectStore(dbStoreName)
        var request = objectStore.get(key)

        request.onsuccess = function (event) {
          var result = event.target.result
          if (result === undefined) {
            resolve()
          } else {
            resolve(result)
          }
        }

        request.onerror = function (error) {
          reject(error)
        }
      })
      
    })
  }

  openDatabase()

  self.IDBManager = {
    name: 'IndexedDB',
    isAvailable: isAvailable,
    setItem: setItem,
    getItem: getItem
  }
})()


var lastAliveTime, muteUntil, settings, lang

function getMuteUntil() {
  if (muteUntil !== undefined) {
    return Promise.resolve(muteUntil)
  }
  return IDBManager.getItem('push_mute_until').then(function (newMuteUntil) {
    return muteUntil = Math.max(muteUntil || 0, newMuteUntil || 0) || false
  }).catch(function (error) {
    console.error('IDB error', error)
    return false
  })
}

function getLastAliveTime() {
  if (lastAliveTime !== undefined) {
    return Promise.resolve(lastAliveTime)
  }
  return IDBManager.getItem('push_last_alive').then(function (newLastAliveTime) {
    return lastAliveTime = Math.max(lastAliveTime || 0, newLastAliveTime || 0) || false
  }).catch(function (error) {
    console.error('IDB error', error)
    return false
  })
}

function getLang() {
  if (lang !== undefined) {
    return Promise.resolve(lang)
  }
  return IDBManager.getItem('push_lang').then(function (newLang) {
    return lang = newLang || {}
  }).catch(function (error) {
    console.error('IDB error', error)
    return {}
  })
}

function getSettings() {
  if (settings !== undefined) {
    return Promise.resolve(settings)
  }
  return IDBManager.getItem('push_settings').then(function (newSettings) {
    return settings = newSettings || {}
  }).catch(function (error) {
    console.error('IDB error', error)
    return {}
  })
}

function userInvisibleIsSupported() {
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
  return isFirefox ? true : false
}
