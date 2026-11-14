// Satsland: macht die Seite installierbar. Immer zuerst das Netz (frisch, am HTTP-Cache vorbei), offline die letzte Version.
const CACHE = "satsland-v108";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./icon-192.png", "./icon-512.png"])).catch(() => {}));
});
// Alte Caches löschen, damit keine veralteten Seiten übrig bleiben
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Seiten, Skripte und Styles immer frisch vom Server prüfen lassen ("no-cache" = nachfragen, ob es Neues gibt)
  const net = req.mode === "navigate" ? fetch(req.url, {cache: "no-cache", credentials: "same-origin"}) : fetch(req, {cache: "no-cache"});
  e.respondWith(
    net.then(r => { if (r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
