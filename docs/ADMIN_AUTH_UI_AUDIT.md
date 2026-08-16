# Admin pre-auth UI audit

- Unauthenticated visitors must see only the admin login content.
- Admin navigation (Dashboard, Statistika, Klublar, Müraciətlər, Yeni klub) is rendered only after server-side Supabase auth and `admin_users` membership checks pass.
- The admin layout keeps `noindex, nofollow` metadata.
- This change is staged on `product-polish-pre-domain`; do not deploy until the final polish batch is approved.
