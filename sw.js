/* =============================================================
   EDUPLAN AI — SERVICE WORKER MINIMAL
   Hanya menyimpan halaman pemberitahuan offline.
   Tidak menyimpan app.js, style.css, API, sesi, atau dokumen.
   Tidak memaksa skipWaiting untuk menghindari perubahan di tengah sesi.
   ============================================================= */
'use strict';

const SCOPE_URL = new URL('./', self.location.href);
const PREFIX = `eduplan-offline-${encodeURIComponent(SCOPE_URL.pathname)}-`;
const CACHE_NAME = `${PREFIX}v1`;
const OFFLINE_URL = new URL('./offline.html', SCOPE_URL).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(OFFLINE_URL, {cache: 'reload'});
    if (!response.ok) throw new Error('Halaman offline gagal dimuat.');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(OFFLINE_URL, response);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return;

  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch (_) {
      const cache = await caches.open(CACHE_NAME);
      const offline = await cache.match(OFFLINE_URL);
      return offline || new Response('Tidak ada koneksi internet. Silakan coba kembali.', {
        status: 503,
        headers: {'Content-Type': 'text/plain; charset=utf-8'}
      });
    }
  })());
});
