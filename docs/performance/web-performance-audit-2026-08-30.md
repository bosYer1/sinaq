# GameYer web performance audit — 2026-08-30 / 2026-08-31 closeout

Scope: production web only. No map-provider swap, speculative UI rewrite or club-data mutation.

## Existing strengths retained

- Interactive full map is dynamically imported client-side rather than forcing Leaflet into the server render.
- Map has a lightweight loading state and the discovery flow can remain list-first on small screens.
- Club status time-dependent UI was already made deterministic at hydration and refreshed after mount, avoiding hydration churn.
- Fonts use Next.js font loading; image/profile handling remains centralized rather than adding new third-party image loaders.
- Production build, responsive browser smoke and sitemap integrity are already release gates.

## Main measured bottleneck and completed work

The map/discovery surface is the heaviest interactive area because it combines geolocation state, filtering, distance enrichment and Leaflet. The audit therefore used real-user telemetry before changing it.

The production sequence added privacy-safe LCP/INP attribution, reduced unnecessary preview work without changing the provider, restored the Founder-approved current-data preview contract, and finally made the already-visible 2x2 OSM preview tiles parser-discoverable high-priority image requests. No real club coordinates, marker semantics or interactive Leaflet behavior were changed.

## Real-user closeout evidence — 2026-08-31

Seven-day public PostHog `web_vital` telemetry after the measurement layer was introduced shows:

- CLS p75 is `0` across the sampled homepage, discovery/category, SEO landing and club-detail surfaces.
- Mobile homepage LCP currently has 55 samples at roughly `2408 ms` p75; this is inside the Core Web Vitals good threshold and is the surface already optimized by the measured map-preview work.
- Mobile homepage INP has 39 samples at roughly `328 ms` p75. Attribution is active for future targeted work; no broad interaction rewrite is justified from the current mixed sample.
- Sampled SEO landings such as `/bakida-playstation-klublari` and `/rayon/xatai/playstation` are around `2252 ms` LCP p75 with zero sampled CLS.
- `/rayon` is around `2018 ms` LCP p75 and `102 ms` INP p75 on mobile in the current sample.
- Club-detail samples are still sparse. A repeated `3928 ms` INP burst appeared at the same moment across homepage and multiple club paths with different metric IDs, indicating navigation/lifecycle attribution noise rather than evidence that one specific club page owns a repeatable long task. That burst is not a safe basis for a club-detail UI rewrite.

The measurement therefore does **not** justify another speculative map, club-detail, font or image refactor in this closeout batch. Future work should wait for a repeatable route/target signal with enough organic samples.

## Bundle / rendering / blocking-request audit

- Leaflet remains isolated behind the existing dynamic map boundary instead of becoming baseline server-render work.
- No new large client dependency was introduced during this performance sprint.
- The homepage preview bottleneck was an external tile discovery/priority issue rather than a reason to replace OSM/Leaflet.
- Existing Next.js font loading is retained; there is no evidence-backed reason to replace the current font pipeline.
- Club images continue through the existing centralized image/profile handling; no additional loader/CDN or paid service is introduced.
- CI build, responsive Chromium regression and production smoke remain mandatory release gates.

## Optimization decision rule

A future production optimization should be made only when one of these is demonstrated:

1. Real-user LCP/INP/CLS is consistently poor on a specific route/device class with enough clean samples.
2. Next build output identifies a materially oversized route/client bundle attributable to removable code.
3. Browser profiling identifies a repeatable long task, layout shift or blocking network dependency.

Do not replace OpenStreetMap/Leaflet, remove working functionality, reduce data accuracy or introduce a paid CDN merely to improve a synthetic score.
