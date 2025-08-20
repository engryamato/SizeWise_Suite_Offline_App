const CACHE_NAME = 'sizewise-cache-v1';
const QUEUE_DB = 'sizewise-queue';
const QUEUE_STORE = 'requests';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/projects') || url.pathname.startsWith('/api/tasks')) {
    if (request.method === 'GET') {
      event.respondWith(handleGetRequest(request));
    } else if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      event.respondWith(handleMutatingRequest(request));
    }
  }
});

async function handleGetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    processQueue();
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || new Response(null, { status: 503 });
  }
}

async function handleMutatingRequest(request) {
  try {
    return await fetch(request);
  } catch (err) {
    await queueRequest(request);
    return new Response(JSON.stringify({ queued: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function queueRequest(request) {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  const body = await request.clone().json().catch(() => null);
  const headers = [...request.headers];
  store.add({ url: request.url, method: request.method, headers, body });
  await promisify(tx);
  await self.registration.sync.register('sizewise-sync');
}

self.addEventListener('sync', event => {
  if (event.tag === 'sizewise-sync') {
    event.waitUntil(processQueue());
  }
});

async function processQueue() {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  const all = await getAll(store);
  for (const entry of all) {
    await fetch(entry.url, {
      method: entry.method,
      headers: new Headers(entry.headers),
      body: entry.body ? JSON.stringify(entry.body) : undefined
    });
  }
  store.clear();
  await promisify(tx);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(QUEUE_STORE, { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function promisify(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
