# Product polish status

Current branch: `product-polish-pre-domain`

Completed in this batch:
- Hide all admin navigation until server-side Supabase authentication and `admin_users` membership verification succeeds.
- Keep `/admin/*` protected by the existing proxy redirect before page rendering.
- Redirect already-authenticated admins away from `/admin/login` to `/admin`.
- Remove the unowned `admin@gameyer.az` placeholder from the login form.
- Add CI regression checks so admin navigation cannot leak onto the pre-auth login page.
- Keep admin pages `noindex, nofollow`.
- Fix empty-search messaging so users are not told to clear filters when no filters are active.
- Harden club sharing with clipboard and legacy-copy fallbacks plus visible failure feedback.
- Remove public rating rendering and the unused `RatingBadge` component so external ratings cannot accidentally reappear in public UI.

Validation:
- Migration manifest validation passes.
- Production dependency audit passes.
- Lint passes.
- Production build passes.
- Production server starts successfully.
- Public/admin smoke tests pass.

Release rule:
- Keep this branch out of production until the final polish batch is explicitly approved for merge/deploy.
