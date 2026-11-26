/* Shell cache only. Public catalogue uses its integrity-checked IndexedDB cache separately. */
const CACHE = "streamverse-shell-020b832119b698591db6";
const SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/brand-symbol.svg",
  "/brand-wordmark.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png", "/assets/BrandingJourney-w2CsIPpo.js", "/assets/ChannelBranding-Ba_7Oxda.css", "/assets/ChannelBranding-D0m1SfRu.js", "/assets/ConnectionEmblem-BQaSMrr6.js", "/assets/EventPlayer-DB7mNrv0.js", "/assets/EventPlayer-DTd2dFdv.css", "/assets/MediaJourney-CSMEjO66.js", "/assets/OrientationJourney-BFWilgTp.js", "/assets/SourceJourney-CVZ8a33i.js", "/assets/VerifiedYouTubePlayer-CQNF5kve.js", "/assets/Viewer-DKCMg4m1.js", "/assets/Viewer-KXw_J3Zo.css", "/assets/YouTubePagePlayer-COflomRR.js", "/assets/YouTubePagePlayer-DgU-Y2lg.css", "/assets/branding.worker-CqmUICFU.js", "/assets/browser-media-a4fn1PMS.js", "/assets/catalogue-client-Z61YsfRz.js", "/assets/discovery.worker-BEwgPMOe.js", "/assets/framework-CXnKph_e.js", "/assets/index-CO7Owi39.js", "/assets/index-CcHCXyQh.css", "/assets/layout-segment-context-CTFqqEXA.js", "/assets/media-journey-C9gpGNwX.css", "/assets/playback-recovery-Cr6b0HnF.js", "/assets/playback-session-CWY54DOh.js", "/assets/premium-layout-M3nIZ8U3.css", "/assets/premium-layout-VThpAJ6H.js", "/assets/rolldown-runtime-S-ySWqyJ.js", "/assets/runtime-playback-KwX_wqAN.js", "/assets/shaka-player.compiled-D9u3wLNA.js", "/assets/youtube-Ci1x5ica.js",
];
const origin = self.location.origin;
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  // Deliberately wait for all old tabs to close. Never force an active playback update.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("streamverse-shell-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== origin ||
    url.search ||
    request.headers.has("Authorization") ||
    request.headers.has("Range")
  )
    return;
  if (request.mode === "navigate" && url.pathname === "/") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          return await fetch(request);
        } catch {
          return (
            (await cache.match("/")) ||
            (await cache.match("/offline.html")) ||
            new Response("You are offline.", { status: 503 })
          );
        }
      })(),
    );
  } else if (
    (url.pathname !== "/" && SHELL.includes(url.pathname)) ||
    /^\/assets\/[^/]+-[a-zA-Z0-9_-]{8,}\.(js|css|woff2)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE),
          saved = await cache.match(request);
        if (saved) return saved;
        const response = await fetch(request);
        if (
          response.ok &&
          response.type !== "opaque" &&
          !/no-store/i.test(response.headers.get("Cache-Control") || "") &&
          Number(response.headers.get("Content-Length") || 0) <= 3 * 1024 * 1024
        ) {
          await cache.put(request, response.clone()).catch(() => {});
          const keys = await cache.keys();
          await Promise.all(
            keys
              .slice(0, Math.max(0, keys.length - 160))
              .map((key) => cache.delete(key)),
          );
        }
        return response;
      })(),
    );
  }
});
