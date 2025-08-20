# Service Worker (Offline) - Feature Flagged

This codebase includes a service worker for offline caching and request queueing. It is disabled by default and can be enabled via configuration.

## Enabling in Production

1) Build and serve `static/service-worker.js` at `/static/service-worker.js` (already in repo)
2) Enable the feature flag in your deployment by setting the global before the app loads:

Add to the hosting HTML page before the bundle script tag:

```html
<script>
  window.__SW_ENABLED__ = true;
</script>
```

You can also inject this via your hosting platform’s HTML template or env-driven templating.

## Behavior

- GET /api/projects and /api/tasks requests are cached
- Mutations (POST/PUT/DELETE to /api/projects or /api/tasks) are queued via IndexedDB if offline and re-sent on sync
- If offline on GET, returns cached response when available, else 503

## Safety considerations

- localStorage operations are not intercepted; the service worker only handles /api/*
- Request queue is stored in IndexedDB `sizewise-queue` in store `requests`
- Service worker registration occurs only when APP_CONFIG.FEATURES.SERVICE_WORKER is true

## Local testing

- Temporarily enable flag in dev by opening the browser console and setting:

```js
window.__SW_ENABLED__ = true; location.reload();
```

- Use DevTools Application > Service Workers and Network Offline toggle to simulate offline

## Disable

- Set `window.__SW_ENABLED__ = false` (default) or remove the script tag
- Unregister in browser DevTools if needed

