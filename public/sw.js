/* Chemistry Explorer – Service Worker
 * Ziel: gespeicherte Inhalte und alle lokal berechneten Funktionen offline nutzbar machen.
 * Live-Abfragen bei Dritten (z. B. PubChem) werden nie zwischengespeichert und nie vorgetäuscht. */
const VERSION = "ce-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const ROUTES = ["/", "/editor", "/glycan", "/tests", "/mehr", "/identifikator", "/vergleich", "/favoriten", "/lernen"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add("/offline.html")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function put(cacheName, request, response) {
  if (response && response.ok && response.type === "basic") {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fremde Dienste (PubChem u. a.) nie anfassen
  if (url.pathname === "/sw.js" || url.pathname.startsWith("/api/")) return;

  // Unveränderliche Dateien (Hash im Namen) und RDKit: zuerst Cache
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/rdkit/") || /\.(png|svg|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => put(STATIC, req, res)))
    );
    return;
  }

  // Seiten und Seitendaten: zuerst Netzwerk (immer aktuell), sonst gespeicherte Kopie
  e.respondWith(
    fetch(req)
      .then((res) => put(PAGES, req, res))
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        if (req.mode === "navigate") return (await caches.match("/offline.html")) || Response.error();
        return Response.error();
      })
  );
});

// Die App fordert nach dem Start an, die Hauptseiten samt ihrer Skripte für offline zu speichern.
self.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "precache") return;
  e.waitUntil((async () => {
    const pages = await caches.open(PAGES);
    const statics = await caches.open(STATIC);
    for (const route of ROUTES) {
      try {
        const res = await fetch(route, { credentials: "same-origin" });
        if (!res.ok) continue;
        const html = await res.clone().text();
        await pages.put(route, res);
        const assets = [...new Set(html.match(/\/_next\/static\/[^"'\\ )]+\.(?:js|css)/g) || [])];
        for (const a of assets) {
          if (await statics.match(a)) continue;
          try { const r = await fetch(a); if (r.ok) await statics.put(a, r); } catch (_) { /* nächstes */ }
        }
      } catch (_) { /* offline oder Fehler: später erneut */ }
    }
  })());
});
