// Service Worker Gringa Style - v2.1
// Cache inteligente e offline-first

const CACHE_NAME = 'gringa-style-v2.1';
const STATIC_CACHE = 'gringa-style-static-v2.1';
const DYNAMIC_CACHE = 'gringa-style-dynamic-v2.1';
const API_CACHE = 'gringa-style-api-v2.1';

// Recursos críticos para cache imediato
const CRITICAL_RESOURCES = [
    '/',
    '/site.webmanifest',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
];

// Recursos estáticos para cache
const STATIC_RESOURCES = [
    '/_next/static/',
    '/fonts/',
    '/imagens/',
    'https://fonts.googleapis.com/',
    'https://fonts.gstatic.com/'
];

// Endpoints somente GET permitidos para cache networkFirst
const API_ENDPOINTS = [
    '/api/google-feed',
    '/api/produtos'
];

// Estratégia de cache: Stale While Revalidate para assets estáticos
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    CACHE_ONLY: 'cache-only',
    NETWORK_ONLY: 'network-only'
};

// Instalar Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            // Cache recursos críticos com tratamento de erro tolerante
            caches.open(STATIC_CACHE).then(async (cache) => {
                for (const resource of CRITICAL_RESOURCES) {
                    try {
                        await cache.add(resource);
                    } catch (e) {
                        console.warn('[SW] Falha ao pré-cachear:', resource, e);
                    }
                }
            }),

            // Pular waiting para ativar imediatamente
            self.skipWaiting()
        ])
    );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Limpar caches antigos
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== API_CACHE &&
                            cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),

            // Tomar controle de todas as páginas
            self.clients.claim()
        ])
    );
});

// Estratégia de fetch inteligente
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requisições não-GET
    if (request.method !== 'GET') return;

    // Ignorar requisições do Chrome DevTools ou schemas não-http
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // Rotas de administração e APIs administrativas nunca devem ser cacheadas
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
        return;
    }

    // Estratégia baseada no tipo de recurso com try-catch de proteção
    try {
        if (isStaticResource(url)) {
            event.respondWith(staleWhileRevalidate(request).catch(() => fetch(request)));
        } else if (isApiRequest(url)) {
            event.respondWith(networkFirst(request).catch(() => fetch(request)));
        } else if (isImageRequest(url)) {
            event.respondWith(cacheFirst(request).catch(() => fetch(request)));
        } else if (isDocumentRequest(request) || isRscRequest(request, url)) {
            event.respondWith(networkFirst(request).catch(() => fetch(request)));
        } else {
            event.respondWith(staleWhileRevalidate(request).catch(() => fetch(request)));
        }
    } catch (_err) {
        // Se houver qualquer falha interna, deixa a rede processar normalmente
        event.respondWith(fetch(request));
    }
});

// Push notifications aprimoradas
self.addEventListener('push', function (event) {
    const data = event.data.json();
    const title = data.titulo || "Gringa Style";
    const options = {
        body: data.mensagem,
        icon: '/apple-touch-icon.png',
        badge: '/favicon-96x96.png',
        data: {
            url: data.link || '/'
        },
        actions: [
            {
                action: 'view',
                title: 'Ver',
                icon: '/favicon-96x96.png'
            },
            {
                action: 'dismiss',
                title: 'Fechar'
            }
        ],
        requireInteraction: true,
        silent: false,
        tag: data.tag || 'gringa-style-notification'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Click em notificações aprimorado
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data.url;
    const action = event.action;

    if (action === 'dismiss') {
        return;
    }

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Procurar por uma janela já aberta
            for (let client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            // Abrir nova janela se não encontrou
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Background sync para pedidos offline
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-pedidos') {
        event.waitUntil(syncPedidos());
    }
});

// Message handler para comunicação com a página
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Funções utilitárias
function isStaticResource(url) {
    return STATIC_RESOURCES.some(resource =>
        url.href.includes(resource)
    );
}

function isApiRequest(url) {
    return API_ENDPOINTS.some(endpoint =>
        url.pathname.includes(endpoint)
    );
}

function isImageRequest(url) {
    return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i);
}

function isDocumentRequest(request) {
    return request.destination === 'document' ||
           Boolean(request.headers.get('accept')?.includes('text/html'));
}

function isRscRequest(request, url) {
    return url.searchParams.has('_rsc') ||
           request.headers.get('rsc') === '1' ||
           Boolean(request.headers.get('accept')?.includes('text/x-component'));
}

// Estratégias de cache
async function cacheFirst(request) {
    try {
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
    } catch (_error) {
        return new Response('Offline - Imagem não disponível', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (_error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Offline - Conteúdo não disponível', { status: 503 });
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    });

    return cachedResponse || fetchPromise;
}

// Sincronização em background para pedidos
async function syncPedidos() {
    try {
        const cache = await caches.open('pedidos-offline');
        const requests = await cache.keys();

        for (const request of requests) {
            try {
                await fetch(request);
                await cache.delete(request);
            } catch (_error) {
            }
        }
    } catch (error) {
        console.log('[SW] Background sync failed:', error);
    }
}

// Limpeza periódica de cache
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(cleanupCache());
    }
});

async function cleanupCache() {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();

    // Remover entradas antigas (mais de 1 hora)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
            const date = response.headers.get('date');
            if (date && new Date(date).getTime() < oneHourAgo) {
                await cache.delete(request);
            }
        }
    }
}