self.addEventListener('push', function(event) {
  const data = event.data.json();
  const title = data.titulo || "Gringa Style";
  const options = {
    body: data.mensagem,
    icon: '/apple-touch-icon.png', 
    badge: '/favicon-32x32.png',
    data: {
      url: data.link || '/'
    }
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(client => client.navigate(urlToOpen));
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

