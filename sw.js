const CACHE_VERSION = 'tnp-studio-pwa-20260924-tnp-v2';
const ASSET_VERSION = '20260924-tnp-v2';
const APP_SHELL = [
  './',
  './index.html',
  './guide.html',
  './app.html',
  './install.html',
  `./pwa-install.js?v=${ASSET_VERSION}`,
  `./studio-library.js?v=${ASSET_VERSION}`,
  `./styles.css?v=${ASSET_VERSION}`,
  `./home-content.js?v=${ASSET_VERSION}`,
  `./analytics-config.js?v=${ASSET_VERSION}`,
  `./analytics.js?v=${ASSET_VERSION}`,
  `./app.js?v=${ASSET_VERSION}`,
  './share/player.html',
  './manifest.json',
  './icons/tnp-studio-logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  `./studio-theme.css?v=${ASSET_VERSION}`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key.startsWith('tnp-studio-pwa-') && key !== CACHE_VERSION).map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

function isRuntimeCacheable(requestUrl) {
  const url = new URL(requestUrl);
  if (url.origin === self.location.origin) return true;
  return ['raw.githubusercontent.com', 'githubusercontent.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname);
}

function isNavigationRequest(request) {
  if (request.mode === 'navigate') return true;
  if (request.destination === 'document') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function isRangeRequest(request) {
  return request.headers.has('range');
}

function isImageRequest(request) {
  return request.destination === 'image' || /\.(png|jpe?g|webp|gif|svg|ico|avif)$/i.test(new URL(request.url).pathname);
}

async function storeResponse(cache, request, response) {
  if (response && (response.ok || response.type === 'opaque') && response.status !== 206) {
    try { await cache.put(request, response.clone()); } catch (error) {
      console.warn('Cache write failed', error);
    }
  }
}

self.addEventListener('message', event => {
  if (event.data?.type !== 'WARM_CACHE' || !Array.isArray(event.data.assets)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const assets = [...new Set(event.data.assets)].filter(value => {
      try {
        const url = new URL(value, self.location.href);
        return url.origin === self.location.origin && isImageRequest({ url: url.href });
      } catch { return false; }
    });
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (assets.length) {
        const url = assets.shift();
        try {
          if (!await cache.match(url)) await storeResponse(cache, url, await fetch(url));
        } catch { /* Missing images can be retried on the next visit. */ }
      }
    }));
  })());
});

function isMediaOrDataRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const destination = request.destination || '';

  if (['audio', 'video'].includes(destination)) return true;

  return /\.(mp3|m4a|aac|wav|ogg|flac|lrc|json)$/i.test(path);
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);

  // ?ㅻ뵒??seek(Range ?붿껌)???쒕퉬?ㅼ썙而ㅺ? 嫄대뱶由ъ? ?딅룄濡?洹몃?濡??ㅽ듃?뚰겕濡?蹂대깂
  if (isRangeRequest(request)) {
    event.respondWith(offlineRange(request));
    return;
  }

  // HTML 臾몄꽌 ?대룞留?index.html fallback ?덉슜
  if (isNavigationRequest(request) && requestUrl.origin === self.location.origin) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_VERSION);
        return await cache.match(request, { ignoreSearch: true }) || await cache.match('./index.html');
      })
    );
    return;
  }

  if (!isRuntimeCacheable(request.url) && !isImageRequest(request)) return;
  if (!['http:', 'https:'].includes(requestUrl.protocol)) return;

  // 誘몃뵒??媛??JSON? ?덈? index.html濡??泥댄븯吏 ?딆쓬
  if (isMediaOrDataRequest(request)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const downloaded = await (await caches.open(DOWNLOAD_CACHE)).match(request.url);
      if (downloaded) return downloaded;
      const cached = await cache.match(request);

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          await storeResponse(cache, request, response);
        }
        return response;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request);
    if (cached) {
      if (isImageRequest(request)) return cached;
      event.waitUntil(
        fetch(request)
          .then(response => {
            if (response && (response.ok || response.type === 'opaque')) {
              return storeResponse(cache, request, response);
            }
          })
          .catch(() => {})
      );
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        await storeResponse(cache, request, response);
      }
      return response;
    } catch (error) {
      throw error;
    }
  })());
});



// Explicit downloads survive application-shell upgrades.
const DOWNLOAD_CACHE = 'tnp-studio-downloads-v1';
async function offlineRange(request) {
  const downloaded = await (await caches.open(DOWNLOAD_CACHE)).match(request.url);
  if (!downloaded || downloaded.status !== 200) return fetch(request);
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  const blob = await downloaded.blob();
  const size = blob.size;
  const unsatisfied = () => new Response(null, {status:416,headers:{'Content-Range':'bytes */'+size}});
  if (!match || (!match[1] && !match[2])) return unsatisfied();
  let start, end;
  if (!match[1]) { const suffix=Number(match[2]); if(suffix<=0)return unsatisfied();start=Math.max(0,size-suffix);end=size-1; }
  else { start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1; }
  if(start>=size||start>end||!Number.isSafeInteger(start)||!Number.isSafeInteger(end))return unsatisfied();
  const headers=new Headers(downloaded.headers);
  headers.delete('content-encoding');
  headers.set('Content-Range','bytes '+start+'-'+end+'/'+size);
  headers.set('Content-Length',String(end-start+1));
  headers.set('Accept-Ranges','bytes');
  return new Response(blob.slice(start,end+1),{status:206,statusText:'Partial Content',headers});
}
