const CACHE_NAME = 'mis-finanzas-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push event for notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '¿Registrar este movimiento como gasto?',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'yes',
        title: 'Sí, es un gasto',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'no',
        title: 'No',
        icon: '/pwa-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Posible Gasto Detectado', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'yes') {
    // Handle "Yes, it's an expense" action
    event.waitUntil(
      clients.openWindow('/?action=add-expense')
    );
  } else if (event.action === 'no') {
    // Handle "No" action - just close
    console.log('User declined to register expense');
  } else {
    // Handle default click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});