/**
 * Service Worker for Background Notifications
 * Enables notification sounds and alerts even when the website is in background
 */

const CACHE_NAME = 'boost-notifications-v1';
const STATIC_CACHE_NAME = 'gearscore-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'gearscore-dynamic-v1.0.0';
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';
const CHAT_SOUND_URL = '/sounds/chat.mp3';

// Static assets to cache for performance
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/images/logo.webp',
  '/images/hero-bg.webp',
  NOTIFICATION_SOUND_URL,
  CHAT_SOUND_URL
];

// Assets that should never be cached
const NEVER_CACHE = [
  '/api/auth/',
  '/api/socket.io/',
  '/socket.io/',
  'chrome-extension://'
];

// Install event - cache notification sounds and static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    Promise.all([
      // Cache notification sounds
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          NOTIFICATION_SOUND_URL,
          CHAT_SOUND_URL,
          '/favicon.ico'
        ]).catch((error) => {
          console.warn('⚠️ Failed to cache notification resources:', error);
        });
      }),
      // Cache static assets for performance
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('⚠️ Failed to cache static assets:', error);
        });
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim clients
      self.clients.claim()
    ])
  );
});

// Handle background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-notification') {
    event.waitUntil(handleBackgroundNotification());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received:', event.data?.text());
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'New Notification', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('📩 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
    playNotificationSound(event.data.soundType || 'notification');
  }
  
  if (event.data && event.data.type === 'SHOW_BACKGROUND_NOTIFICATION') {
    showBackgroundNotification(event.data.notification);
  }
});

// Function to play notification sound in background
async function playNotificationSound(soundType = 'notification') {
  try {
    const soundUrl = soundType === 'chat' ? CHAT_SOUND_URL : NOTIFICATION_SOUND_URL;
    
    // Try to get cached sound first
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(soundUrl);
    
    if (cachedResponse) {
      console.log('🔊 Playing cached notification sound');
      // Note: Service workers can't directly play audio
      // We'll send a message to all clients to play the sound
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PLAY_SOUND_FROM_SW',
          soundType: soundType
        });
      });
    }
  } catch (error) {
    console.error('❌ Failed to play notification sound:', error);
  }
}

// Function to show background notification
async function showBackgroundNotification(notificationData) {
  try {
    const options = {
      body: notificationData.message || 'New notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notificationData.tag || 'background-notification',
      requireInteraction: false,
      silent: false,
      data: notificationData
    };
    
    await self.registration.showNotification(
      notificationData.title || 'New Notification',
      options
    );
    
    // Also try to play sound
    await playNotificationSound(notificationData.soundType);
    
    console.log('✅ Background notification shown');
  } catch (error) {
    console.error('❌ Failed to show background notification:', error);
  }
}

// Handle background notification sync
async function handleBackgroundNotification() {
  try {
    // This would typically fetch pending notifications from your API
    console.log('🔄 Handling background notification sync');
  } catch (error) {
    console.error('❌ Background notification sync failed:', error);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Ignore Next.js HMR and build assets to prevent dev reload loops
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/__nextjs_original-stack-frame/') || url.pathname.endsWith('.hot-update.json')) {
    return;
  }
  
  // Skip requests that should never be cached
  if (NEVER_CACHE.some(pattern => url.pathname.startsWith(pattern))) {
    return;
  }
  
  // Skip cross-origin requests (except for fonts and images)
  if (url.origin !== location.origin && 
      !request.destination.match(/^(font|image)$/)) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Handle different caching strategies
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Cache First for static assets (images, fonts, sounds, etc.)
    if (request.destination.match(/^(image|font|audio)$/) || 
        url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|css|js|mp3|wav)$/)) {
      return await cacheFirst(request);
    }
    
    // Strategy 2: Network First for API calls
    if (url.pathname.startsWith('/api/')) {
      return await networkFirst(request);
    }
    
    // Strategy 3: Stale While Revalidate for pages
    return await staleWhileRevalidate(request);
    
  } catch (error) {
    console.error('🚨 Request handling failed:', error);
    return fetch(request);
  }
}

// Cache First Strategy - for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🚨 Cache first failed:', error);
    return caches.match(request);
  }
}

// Network First Strategy - for dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('🚨 Network first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While Revalidate Strategy - for pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.error('🚨 Network request failed:', error);
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

console.log('🚀 Service Worker script loaded');