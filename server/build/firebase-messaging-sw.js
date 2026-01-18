/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker (Compat API for simplicity)
// This file MUST be located at the root of your web app (public/) so it is served at:
//   https://your-domain/firebase-messaging-sw.js
// If it is missing or at a different path, the browser will fetch index.html and
// register it with MIME type text/html, causing the error you saw.

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Keep this config in sync with client/src/config/firebase.js
firebase.initializeApp({
  apiKey: 'AIzaSyB27nVr6lKWiTgj0lW0wQx5m1-lslhMipw',
  authDomain: 'fans-food-stf.firebaseapp.com',
  projectId: 'fans-food-stf',
  storageBucket: 'fans-food-stf.firebasestorage.app',
  messagingSenderId: '267118373830',
  appId: '1:267118373830:web:dbec72cb78e58940fc60c7',
  measurementId: 'G-0J0Q8GCTX4'
});

const messaging = firebase.messaging();

// Optional: Handle background messages
messaging.onBackgroundMessage(function(payload) {
  // Customize and show a notification
  const notificationTitle = payload.notification?.title || 'Fans Munch';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/app_icon.png',
    data: payload.data || {}
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Click handling to focus/open page
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification?.data?.click_action || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
