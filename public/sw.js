const CACHE = "journey-static-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        "/offline.html",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
      ])
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (key) =>
                  key.startsWith("journey-static-") && key !== CACHE
              )
              .map((key) => caches.delete(key))
          )
        ),
      self.clients.claim(),
    ])
  );
});

// Never cache authenticated pages, API responses, or user records.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
  }
});

// Receive a push message even when the website is not currently open.
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      body: event.data ? event.data.text() : "",
    };
  }

  const title = data.title || "Time to read the Qur'an";

  const options = {
    body:
      data.body ||
      "Continue your Qur'an journey from where you left off.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "quran-reading-reminder",
    renotify: true,
    data: {
      url: data.url || "/progress",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Open the app when the reminder notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification.data?.url || "/progress";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        return self.clients.openWindow(url);
      })
  );
});