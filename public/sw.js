const CACHE_NAME = 'mis-finanzas-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
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
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { text: event.data.text() };
    }
  }

  const options = {
    body: data.body || '¿Registrar este movimiento como gasto?',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      ...data,
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: data.actions || [
      {
        action: 'register',
        title: 'Registrar',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'ignore',
        title: 'Ignorar',
        icon: '/pwa-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Transacción Detectada', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'register') {
    // Handle "Register" action
    const transactionData = event.notification.data;
    const url = `/?action=add-transaction&amount=${transactionData.amount}&type=${transactionData.type}&description=${encodeURIComponent(transactionData.description)}`;
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'ignore') {
    // Handle "Ignore" action - just close
    console.log('User ignored transaction');
  } else {
    // Handle default click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});