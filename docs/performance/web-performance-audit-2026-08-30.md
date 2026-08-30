# GameYer web performance audit — 2026-08-30

Scope: production web only. No map-provider swap, speculative UI rewrite or club-data mutation.

## Existing strengths retained

- Interactive full map is dynamically imported client-side rather than forcing Leaflet into the server render.
- Map has a lightweight loading state and the discovery flow can remain list-first on small screens.
- Club status time-dependent UI was already made deterministic at hydration and refreshed after mount, avoiding hydration churn.
- Fonts use Next.js font loading; image/profile handling remains centralized rather than adding new third-party image loaders.
- Production build, responsive browser smoke and sitemap integrity are already release gates.

## Main remaining bottleneck risk

The map/discovery surface is the heaviest interactive area because it combines geolocation state, filtering, distance enrichment and Leaflet. Refactoring it without measured evidence would be higher risk than benefit. The correct next measurement layer is real-user Core Web Vitals.

## Change in this sprint

`useReportWebVitals` now records public-page Web Vitals to GA4 and PostHog with only metric name/id/value/rating and path. Admin/API paths are excluded. This establishes real LCP/INP/CLS evidence for future optimizations instead of relying only on synthetic guesses.

The Responsive gate also exercises search, filters and map rendering in a real headless Chromium session, so performance-related refactors cannot silently break the main discovery flow.

## Optimization decision rule

A production optimization should be made only when one of these is demonstrated:

1. Real-user LCP/INP/CLS is consistently poor on a specific route/device class.
2. Next build output identifies a materially oversized route/client bundle attributable to removable code.
3. Browser profiling identifies a repeatable long task, layout shift or blocking network dependency.

Do not replace OpenStreetMap/Leaflet, remove working functionality, reduce data accuracy or introduce a paid CDN merely to improve a synthetic score.
