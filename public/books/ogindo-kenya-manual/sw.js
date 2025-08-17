const CACHE_NAME = 'obstetrics-book-complete-v3';
const STATIC_CACHE = 'obstetrics-static-v3';
const DYNAMIC_CACHE = 'obstetrics-dynamic-v3';
const ASSETS_CACHE = 'obstetrics-assets-v3';

// Essential resources for offline functionality
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// All medical images and assets for complete offline experience
const MEDICAL_ASSETS = [
  '/src/assets/antenatal-examination.jpg',
  '/src/assets/asthma-pregnancy-clinical.jpg',
  '/src/assets/cervical-dilation-stages.jpg',
  '/src/assets/cesarean-section-procedure.jpg',
  '/src/assets/clinical-protocols-flowchart.jpg',
  '/src/assets/clinical-ultrasound-32weeks-clean.jpg',
  '/src/assets/clinical-ultrasound-32weeks.jpg',
  '/src/assets/ctg-monitoring-chart.jpg',
  '/src/assets/delivery-room-equipment.jpg',
  '/src/assets/epilepsy-pregnancy-medical.jpg',
  '/src/assets/episiotomy-repair-procedure.jpg',
  '/src/assets/febrile-illness-kenya-pregnancy.jpg',
  '/src/assets/fetal-demise-pathophysiology.jpg',
  '/src/assets/fetal-development-timeline.jpg',
  '/src/assets/fetal-heart-monitoring-patterns.jpg',
  '/src/assets/fetus-32-weeks.jpg',
  '/src/assets/fetus-34-weeks-complete.jpg',
  '/src/assets/fetus-cephalic-presentation-beautiful.jpg',
  '/src/assets/fetus-cephalic-presentation-real.jpg',
  '/src/assets/fetus-cephalic-presentation-ultrasound.jpg',
  '/src/assets/labor-stages-progression.jpg',
  '/src/assets/leopolds-maneuvers-diagram.jpg',
  '/src/assets/long-term-pregnancy-effects.jpg',
  '/src/assets/malaria-pregnancy-clinical.jpg',
  '/src/assets/manual-placenta-removal.jpg',
  '/src/assets/maternal-health-fetal-development.jpg',
  '/src/assets/maternal-lactation-physiology.jpg',
  '/src/assets/maternal-physiology-adaptations.jpg',
  '/src/assets/obstetric-emergency-flowchart.jpg',
  '/src/assets/pph-emergency-protocol.jpg',
  '/src/assets/pph-emergency-team.jpg',
  '/src/assets/pph-four-ts-diagram.jpg',
  '/src/assets/pph-management-flowchart.jpg',
  '/src/assets/shoulder-dystocia-maneuvers.jpg',
  '/src/assets/thrombophilia-pregnancy-diagram.jpg',
  '/src/assets/thyroid-disease-pregnancy.jpg',
  '/src/assets/tuberculosis-pregnancy-medical.jpg',
  '/src/assets/uterus-fetus-cover.jpg',
  '/src/assets/vacuum-delivery-technique.jpg',
  '/src/assets/venous-thromboembolism-pregnancy.jpg',
  '/src/assets/vital-signs-reference-card.jpg'
];

// Google Fonts for consistent typography offline
const FONT_RESOURCES = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600&display=swap',
  'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap'
];

// Install event - comprehensive caching for complete offline experience
self.addEventListener('install', event => {
  console.log('📦 Installing complete offline service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📋 Caching critical resources...');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Cache all medical assets
      caches.open(ASSETS_CACHE).then(cache => {
        console.log('🖼️ Caching medical images and assets...');
        return Promise.allSettled(
          MEDICAL_ASSETS.map(asset => 
            cache.add(asset).catch(error => {
              console.warn(`Failed to cache asset ${asset}:`, error);
            })
          )
        );
      }),
      
      // Cache fonts for consistent typography
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('🔤 Caching web fonts...');
        return Promise.allSettled(
          FONT_RESOURCES.map(font => 
            cache.add(font).catch(error => {
              console.warn(`Failed to cache font ${font}:`, error);
            })
          )
        );
      })
    ]).then(() => {
      console.log('✅ Complete offline installation successful');
      return self.skipWaiting();
    }).catch(error => {
      console.error('❌ Offline installation failed:', error);
    })
  );
});

// Activate event - clean up and take control
self.addEventListener('activate', event => {
  console.log('🔄 Activating complete offline service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, ASSETS_CACHE, CACHE_NAME];
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!validCaches.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Complete offline service worker activated');
    })
  );
});

// Fetch event - comprehensive offline-first strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other protocol requests
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Cache-first for assets (images, fonts, etc.)
    if (isAssetRequest(request)) {
      return await handleAssetRequest(request);
    }
    
    // Strategy 2: Network-first for HTML and API requests
    if (isNavigationRequest(request) || isApiRequest(request)) {
      return await handleNavigationRequest(request);
    }
    
    // Strategy 3: Cache-first for fonts and external resources
    if (isFontRequest(request) || isExternalResource(request)) {
      return await handleExternalRequest(request);
    }
    
    // Default: Try cache first, then network
    return await handleDefaultRequest(request);
    
  } catch (error) {
    console.error('Request handling failed:', request.url, error);
    return await handleOfflineFallback(request);
  }
}

async function handleAssetRequest(request) {
  const url = new URL(request.url);

  // Do NOT cache Vite dev dependency bundles to avoid stale React/runtime issues
  if (url.pathname.includes('/node_modules/.vite/') || url.pathname.includes('/node_modules/.vite-shim/')) {
    try {
      return await fetch(request);
    } catch (error) {
      return new Response('Dev asset not available', { status: 404, statusText: 'Not Found' });
    }
  }

  // Cache-first for all other assets (images, CSS, JS)
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(ASSETS_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Asset not available offline', { 
      status: 404,
      statusText: 'Not Found'
    });
  }
}

async function handleNavigationRequest(request) {
  // Network-first for HTML pages and API calls
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, return the app shell
    if (request.mode === 'navigate') {
      const appShell = await caches.match('/') || await caches.match('/index.html');
      if (appShell) return appShell;
    }
    
    throw error;
  }
}

async function handleExternalRequest(request) {
  // Cache-first for fonts and external resources
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('External resource not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function handleDefaultRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

async function handleOfflineFallback(request) {
  // Provide appropriate offline fallbacks
  if (request.mode === 'navigate') {
    // Return cached app shell for navigation
    const appShell = await caches.match('/') || await caches.match('/index.html');
    if (appShell) return appShell;
    
    // Return offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Obstetrics Book</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              background: linear-gradient(135deg, #1e293b 0%, #1e40af 50%, #3730a3 100%);
              color: white; text-align: center; padding: 20px; min-height: 100vh;
              display: flex; align-items: center; justify-content: center; margin: 0;
            }
            .container { max-width: 400px; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            h1 { font-size: 2rem; margin-bottom: 1rem; font-weight: 600; }
            p { font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem; opacity: 0.9; }
            button { 
              background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
              color: white; border: none; padding: 12px 24px; 
              border-radius: 8px; font-size: 1rem; font-weight: 500;
              cursor: pointer; transition: transform 0.2s;
            }
            button:hover { transform: translateY(-2px); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🏥</div>
            <h1>You're Offline</h1>
            <p>The Complete Obstetrics Manual is available offline once downloaded. Connect to download all content for offline use.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Content not available offline', { 
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Helper functions to identify request types
function isAssetRequest(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         request.headers.get('accept')?.includes('text/html');
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isFontRequest(request) {
  const url = new URL(request.url);
  return url.hostname === 'fonts.googleapis.com' || 
         url.hostname === 'fonts.gstatic.com' ||
         url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/);
}

function isExternalResource(request) {
  const url = new URL(request.url);
  return url.origin !== self.location.origin;
}

// Background sync for content updates
self.addEventListener('sync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncOfflineContent());
  }
});

async function syncOfflineContent() {
  console.log('🔄 Syncing offline content...');
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CONTENT_SYNC_AVAILABLE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Content sync failed:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', event => {
  const { data } = event;
  
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data && data.type === 'UPDATE_CACHE') {
    event.waitUntil(updateAllCaches());
  }
  
  if (data && data.type === 'DOWNLOAD_COMPLETE_CACHE') {
    event.waitUntil(downloadCompleteOfflineCache());
  }
});

async function updateAllCaches() {
  console.log('🔄 Updating all caches...');
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Reinstall fresh caches
    const event = new ExtendableEvent('install');
    self.dispatchEvent(event);
    
    console.log('✅ All caches updated');
  } catch (error) {
    console.error('Cache update failed:', error);
  }
}

async function downloadCompleteOfflineCache() {
  console.log('📥 Downloading complete offline cache...');
  try {
    // This would integrate with the IndexedDB cache manager
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'DOWNLOAD_COMPLETE_CACHE_REQUESTED',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Complete cache download failed:', error);
  }
}