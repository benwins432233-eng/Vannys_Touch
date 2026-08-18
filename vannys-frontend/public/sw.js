/*
 * Service worker Vannys Touch.
 *
 * Pour l'instant il ne fait qu'une chose : recevoir les notifications push.
 * La mise en cache et le mode hors ligne arrivent avec le lot L9, dans CE
 * fichier — un site ne peut avoir qu'un seul service worker par portée, et en
 * enregistrer un second remplacerait celui-ci.
 *
 * Aucun gestionnaire `fetch` ici, volontairement : une branche `respondWith`
 * qui résoudrait sur `undefined` casserait toute la navigation.
 */

const CACHE_VERSION = 'v1';

self.addEventListener('install', () => {
  // Le nouveau worker prend la main sans attendre la fermeture des onglets.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  // Une charge utile illisible ne doit pas faire disparaître la notification :
  // mieux vaut un titre générique que rien du tout.
  let payload = { title: 'Vannys Touch', body: '', link: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (error) {
    payload.body = event.data ? event.data.text() : '';
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: payload.link,
      data: { link: payload.link },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Réutiliser un onglet déjà ouvert plutôt que d'en empiler un nouveau.
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
