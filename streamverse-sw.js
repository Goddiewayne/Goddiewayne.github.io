/* Shell cache only. Public catalogue uses its integrity-checked IndexedDB cache separately. */
const CACHE = "streamverse-shell-dd03a4b6abbcebb950cc";
const SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/brand-symbol.svg",
  "/brand-wordmark.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png", "/assets/BrandingJourney-CzGWy6pA.js", "/assets/EventPlayer-DMvVxhBf.js", "/assets/EventPlayer-DTd2dFdv.css", "/assets/MediaJourney-jQTtsLwG.js", "/assets/OrientationJourney-D6-PVpNg.js", "/assets/SourceJourney-DeseYdEg.js", "/assets/VerifiedYouTubePlayer-CFeprRuW.js", "/assets/Viewer-6DNuXyjK.js", "/assets/Viewer-vQLuX9pb.css", "/assets/YouTubePagePlayer-CwV94WUJ.js", "/assets/YouTubePagePlayer-DgU-Y2lg.css", "/assets/branding.worker-CqmUICFU.js", "/assets/browser-media-DYQPadd5.js", "/assets/catalogue-client-B1Wc7bK6.js", "/assets/discovery.worker-C3j7PlE7.js", "/assets/framework-CXnKph_e.js", "/assets/index-1tBOQLZO.css", "/assets/index-CJ6LuJe5.js", "/assets/layout-segment-context-D9L9EJIN.js", "/assets/media-journey-C9gpGNwX.css", "/assets/playback-recovery-D1DgMcnn.js", "/assets/playback-session-CWY54DOh.js", "/assets/premium-layout-BrLB3ycC.js", "/assets/premium-layout-CAGr_9gM.css", "/assets/rolldown-runtime-S-ySWqyJ.js", "/assets/runtime-playback-D2sZH4HQ.js", "/assets/shaka-player.compiled-vfBZ98kx.js", "/assets/youtube-DjLa-AQ2.js",
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
