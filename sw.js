// Service Worker para que la app funcione offline
const CACHE_NAME = 'mus-v1';
const ARCHIVOS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Al instalar, guardamos todos los archivos en caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ARCHIVOS).catch(err => {
                console.log('Algunos archivos no se pudieron cachear:', err);
            });
        })
    );
    self.skipWaiting();
});

// Al activarse, borramos cachés antiguas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((nombres) => {
            return Promise.all(
                nombres.map((nombre) => {
                    if (nombre !== CACHE_NAME) {
                        return caches.delete(nombre);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Cuando se pide un archivo, primero buscamos en caché
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((respuesta) => {
            return respuesta || fetch(event.request);
        })
    );
});
