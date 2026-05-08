/**
 * coi-serviceworker.js
 * Adds Cross-Origin-Embedder-Policy + Cross-Origin-Opener-Policy headers
 * to every response so that SharedArrayBuffer (required by WebLLM/WebGPU)
 * is available even on GitHub Pages which doesn't support custom headers.
 *
 * Adapted from https://github.com/gzuidhof/coi-serviceworker (MIT)
 */

/* eslint-disable no-restricted-globals */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function handleFetch(request) {
  // Don't intercept non-GET or chrome-extension requests
  if (request.method !== "GET") return fetch(request);
  if (request.url.startsWith("chrome-extension://")) return fetch(request);

  // Don't add headers to opaque responses (cross-origin without CORS)
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return new Response(null, { status: 504 });
  }

  let response;
  try {
    response = await fetch(request);
  } catch (e) {
    return new Response(null, { status: 0 });
  }

  // Only patch successful responses
  if (response.status === 0) return response;

  const newHeaders = new Headers(response.headers);
  newHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
  newHeaders.set("Cross-Origin-Opener-Policy",   "same-origin");

  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers:    newHeaders,
  });
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleFetch(event.request));
});
