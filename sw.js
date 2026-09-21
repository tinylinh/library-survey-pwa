const CACHE_NAME = "library-survey-v4";

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./config.js",
    "./native-plugins.bundle.js",
    "./manifest.json"
];

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
    );

    self.skipWaiting();
});


self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );

    self.clients.claim();
});


self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl =
        new URL(event.request.url);

    if (
        requestUrl.origin === self.location.origin &&
        APP_SHELL.some(path =>
            path === "./"
                ? requestUrl.pathname.endsWith("/")
                : requestUrl.pathname.endsWith(
                    path.replace("./", "")
                )
        )
    ) {

        event.respondWith(

            fetch(event.request)
                .then(response => {

                    const clonedResponse =
                        response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(
                                event.request,
                                clonedResponse
                            );
                        });

                    return response;
                })
                .catch(() =>
                    caches.match(event.request)
                )
        );

        return;
    }

    event.respondWith(

        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(response => {

                        if (
                            !response ||
                            response.status !== 200 ||
                            response.type !== "basic"
                        ) {
                            return response;
                        }

                        const clonedResponse = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(
                                    event.request,
                                    clonedResponse
                                );
                            });

                        return response;
                    });

            })
            .catch(() => {

                return caches.match("./index.html");

            })
    );
});
