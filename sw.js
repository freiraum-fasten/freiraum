// Freiraum Service Worker
// App-Dateien: immer frisch vom Server (neue Versionen sofort), offline aus dem Speicher.
// Texterkennung (ocr/…): ändert sich nie → einmal laden, danach aus dem Speicher (spart Datenvolumen).
const CACHE = "freiraum-v7", OCR = "freiraum-ocr";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== OCR).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/ocr/")) {
    e.respondWith(caches.open(OCR).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (url.pathname.endsWith("version.json")) return; // immer live
  e.respondWith(
    fetch(e.request, { cache: "no-cache" }).then(r => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
