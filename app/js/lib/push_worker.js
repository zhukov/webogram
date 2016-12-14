console.log('Push worker placeholder')


var port

self.addEventListener('push', function(event) {
  var obj = event.data.json()
  console.log('push obj', obj)
  fireNotification(obj, event)
})

self.onmessage = function(e) {
  console.log(e)
  port = e.ports[0]
}

function fireNotification(obj, event) {
  var title = obj.title || 'Telegram'
  var body = obj.description || ''
  var icon = 'img/Telegram72.png'
   
  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: icon
  }))
}


self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag)
  event.notification.close()

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i]
      if ('focus' in client) {
        return client.focus()
      }
    }
    if (clients.openWindow)
      return clients.openWindow('')
  }))
})