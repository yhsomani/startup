const CACHE_NAME = 'talentsphere-v1';
const STATIC_CACHE_NAME = 'talentsphere-static-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/static/media/logo.png',
  '/static/media/icons/',
  '/offline.html'
];

const API_CACHE_NAME = 'talentsphere-api-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      caches.delete(STATIC_CACHE_NAME.replace('v1', 'v0')),
      caches.delete(API_CACHE_NAME.replace('v1', 'v0'))
    ]).then(() => {
      console.log('Service Worker: Old caches cleaned up');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith(asset))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle HTML documents with stale-while-revalidate strategy
  if (request.destination === 'document') {
    event.respondWith(handleHtmlRequest(request));
    return;
  }

  // Default to network
  event.respondWith(fetch(request));
});

// API request handler with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network failed for API request', error);
  }
  
  // Fallback to cache
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline response
  return new Response(
    JSON.stringify({ 
      error: 'Offline - No cached data available',
      message: 'This content is not available offline. Please check your internet connection.' 
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Static asset handler with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('Service Worker: Serving from cache:', request.url);
    return cachedResponse;
  }
  
  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      console.log('Service Worker: Caching static asset:', request.url);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', error);
  }
  
  return new Response('Asset not found', { status: 404 });
}

// HTML document handler with stale-while-revalidate strategy
async function handleHtmlRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Start network request
  const networkPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      // Update cache with fresh response
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    return null;
  }).catch(error => {
    console.log('Service Worker: Network failed for HTML request:', error);
    return null;
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    console.log('Service Worker: Serving stale HTML from cache:', request.url);
    
    // Trigger network update in background
    networkPromise;
    
    // Add header to indicate it's from cache
    const responseWithHeader = new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: new Headers({
        ...cachedResponse.headers,
        'X-From-Cache': 'true'
      })
    });
    
    return responseWithHeader;
  }
  
  // Wait for network response
  try {
    const networkResponse = await networkPromise;
    if (networkResponse) {
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network and cache both failed:', error);
  }
  
  // Return offline page for HTML requests
  return caches.match('/offline.html');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  const cache = await caches.open(API_CACHE_NAME);
  const requests = await cache.keys();
  
  // Process pending offline actions
  for (const requestUrl of requests) {
    if (requestUrl.includes('/offline-actions/')) {
      try {
        const cachedRequest = await cache.match(requestUrl);
        if (cachedRequest) {
          const action = await cachedRequest.json();
          
          // When online, try to execute the pending action
          const networkResponse = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body
          });
          
          if (networkResponse.ok) {
            // Remove from cache after successful sync
            cache.delete(requestUrl);
            console.log('Service Worker: Synced offline action:', action.type);
          }
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync offline action:', error);
      }
    }
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data?.body || 'New notification',
    icon: '/static/media/icons/icon-192x192.png',
    badge: '/static/media/icons/badge-72x72.png',
    tag: event.data?.tag || 'default',
    data: event.data,
    actions: [
      {
        action: 'view',
        title: 'View'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(event.data?.title || 'TalentSphere', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app to the relevant page
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  } else {
    // Default: open app to home page
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_VERSION') {
    // Update cache version
    const version = event.data.version;
    console.log('Service Worker: Updating cache version to:', version);
    
    // Clear old caches and update with new version
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.includes('talentsphere-'))
            .map(name => caches.delete(name))
        );
      })
    );
  }
});

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP') {
    cleanupOldCache();
  }
});

async function cleanupOldCache() {
  const cacheNames = await caches.keys();
  const now = Date.now();
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && response.headers.has('date')) {
        const responseDate = new Date(response.headers.get('date')).getTime();
        if (now - responseDate > MAX_AGE) {
          await cache.delete(request);
          console.log('Service Worker: Cleaned up old cache entry:', request);
        }
      }
    }
  }
}