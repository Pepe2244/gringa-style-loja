// Service Worker Gringa Style - Single Endpoint Architecture
// Cache inteligente para assets estáticos e suporte a Push Notifications

const CACHE_NAME = 'gringa-style-v2.4';
const STATIC_CACHE = 'gringa-style-static-v2.4';
const DYNAMIC_CACHE = 'gringa-style-dynamic-v2.4';

// Recursos críticos para cache imediato
const CRITICAL_RESOURCES = [
    '/site.webmanifest',
    '/favicon.ico'
];

// Recursos estáticos para cache
const STATIC_RESOURCES = [
    '/_next/static/',
    '/fonts/',
    '/imagens/'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(async (cache) => {
                for (const resource of CRITICAL_RESOURCES) {
                    try {
                        await cache.add(resource);
                    } catch (e) {
                        console.warn('[SW] Falha ao pré-cachear:', resource, e);
                    }
                }
            }),
            self.skipWaiting()
        ])
    );
});

// Ativar Service Worker - Purga automática de qualquer cache de versão antiga
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Estratégia de fetch inteligente e segura (nunca rejeita a Promise do FetchEvent)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Ignorar requisições não-GET
    if (request.method !== 'GET') return;

    // 2. Ignorar esquemas não-HTTP (chrome-extension://, etc.)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // 3. Ignorar requisições cross-origin (Clarity, GA4, Ahrefs, Supabase, R2 CDN)
    if (url.origin !== self.location.origin) return;

        // 4. Ignorar rotas administrativas e de API
        if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) {
            return;
        }

            // 5. Ignorar prefetches e payloads RSC do Next.js App Router (evita AbortError / Failed to fetch em navegações)
            if (
                isRscRequest(request, url) ||
                request.headers.get('next-router-prefetch') === '1' ||
                request.headers.get('purpose') === 'prefetch'
            ) {
                return;
            }

                // 6. Interceptar apenas recursos estáticos, imagens locais e navegações de documento HTML
                if (isStaticResource(url)) {
                    event.respondWith(staleWhileRevalidate(request));
                } else if (isImageRequest(url)) {
                    event.respondWith(cacheFirst(request));
                } else if (request.mode === 'navigate') {
                    event.respondWith(networkFirstDocument(request));
                }
            });

// Push notifications
self.addEventListener('push', function (event) {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch {
            data = { mensagem: event.data.text() };
        }
    }
    const title = data.titulo || data.title || "Gringa Style";
    const options = {
        body: data.mensagem || data.body || "Nova atualização disponível!",
        icon: '/apple-touch-icon.png',
        badge: '/favicon-96x96.png',
        data: {
            url: data.link || data.url || '/'
        },
        actions: [
            { action: 'view', title: 'Ver', icon: '/favicon-96x96.png' },
            { action: 'dismiss', title: 'Fechar' }
        ],
        requireInteraction: true,
        silent: false,
        tag: data.tag || 'gringa-style-notification'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Click em notificações
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const urlToOpen = event.notification.data ? event.notification.data.url : '/';
    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            for (let client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Funções utilitárias
function isStaticResource(url) {
    return STATIC_RESOURCES.some(resource => url.pathname.startsWith(resource));
}

function isImageRequest(url) {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(url.pathname);
}

function isRscRequest(request, url) {
    return url.searchParams.has('_rsc') ||
        request.headers.get('rsc') === '1' ||
        Boolean(request.headers.get('accept')?.includes('text/x-component'));
}

async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.ok) {
                const cache = await caches.open(DYNAMIC_CACHE);
                cache.put(request, networkResponse.clone()).catch(() => { });
            }
            return networkResponse;
        } catch (_error) {
            return new Response('Offline - Imagem não disponível', { status: 503 });
        }
    }

        async function networkFirstDocument(request) {
            try {
                return await fetch(request);
            } catch (_error) {
                const cachedResponse = await caches.match(request);
                if (cachedResponse) return cachedResponse;
                const offlineHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sem Conexão - Gringa Style</title>
    <style>
        body { margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111; color: #fff; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 2rem; margin: 0 0 12px; color: #ff6b00; }
        p { color: #aaa; max-width: 460px; line-height: 1.6; margin: 0 0 24px; font-size: 1rem; }
        .btn { background: linear-gradient(135deg, #ffa500, #ff8c00); color: #111; border: none; padding: 14px 28px; border-radius: 999px; font-weight: bold; font-size: 1rem; cursor: pointer; text-decoration: none; display: inline-block; }
    </style>
</head>
<body>
    <div class="icon">⚡</div>
    <h1>Você está offline</h1>
    <p>Não foi possível conectar aos servidores da Gringa Style. Verifique sua conexão com a internet e tente recarregar.</p>
    <button class="btn" onclick="window.location.reload()">Tentar Novamente</button>
</body>
</html>`;
                return new Response(offlineHtml, {
                    status: 200,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
            }
        }

        async function staleWhileRevalidate(request) {
            try {
                const cache = await caches.open(STATIC_CACHE);
                const cachedResponse = await cache.match(request);

                        const fetchPromise = fetch(request)
                            .then(networkResponse => {
                                if (networkResponse && networkResponse.ok) {
                                    cache.put(request, networkResponse.clone()).catch(() => { });
                                }
                                return networkResponse;
                            })
                            .catch(() => null);

                        if (cachedResponse) {
                            return cachedResponse;
                        }

                const liveResponse = await fetchPromise;
                if (liveResponse) {
                    return liveResponse;
                }

                return new Response('Recurso temporariamente indisponível', { status: 503 });
            } catch (_error) {
                return new Response('Recurso temporariamente indisponível', { status: 503 });
            }
        }
