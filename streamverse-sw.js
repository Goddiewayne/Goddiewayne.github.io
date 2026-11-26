/* Shell cache only. Public catalogue uses its integrity-checked IndexedDB cache separately. */
const CACHE = "streamverse-shell-9a8f066dbacf43b6198f";
const SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/brand-symbol.svg",
  "/brand-wordmark.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png", "/assets/BrandingJourney-CFWgFmh5.js", "/assets/ChannelBranding-Ba_7Oxda.css", "/assets/ChannelBranding-D0m1SfRu.js", "/assets/ConnectionEmblem-BQaSMrr6.js", "/assets/EventPlayer-8evGKTTs.js", "/assets/EventPlayer-DTd2dFdv.css", "/assets/MediaJourney-CclGkCOV.js", "/assets/OrientationJourney-f_pCxMkz.js", "/assets/SourceJourney-BEiNChQM.js", "/assets/VerifiedYouTubePlayer-z0NjeF14.js", "/assets/Viewer-8Pej5sCa.js", "/assets/Viewer-KXw_J3Zo.css", "/assets/YouTubePagePlayer-BggmUpoo.js", "/assets/YouTubePagePlayer-DgU-Y2lg.css", "/assets/branding.worker-CqmUICFU.js", "/assets/browser-media-T-eYQ2hP.js", "/assets/catalogue-client-YAY3Tp1x.js", "/assets/discovery.worker-BEwgPMOe.js", "/assets/framework-CXnKph_e.js", "/assets/index-BxeyTW9H.js", "/assets/index-CcHCXyQh.css", "/assets/layout-segment-context-BrTzSNfo.js", "/assets/media-journey-C9gpGNwX.css", "/assets/playback-recovery-Ccr-lwOF.js", "/assets/playback-session-CWY54DOh.js", "/assets/premium-layout-CKRbkV3C.js", "/assets/premium-layout-M3nIZ8U3.css", "/assets/rolldown-runtime-S-ySWqyJ.js", "/assets/runtime-playback-B9I8miR5.js", "/assets/shaka-player.compiled-D9u3wLNA.js", "/assets/youtube-Cnw_gDPc.js",
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
