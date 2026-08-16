# Owner verification status

Prepared on branch `owner-verification-final` and draft PR #59.

Completed:
- owner claims with no `club_id` cannot apply data or verify a club;
- admins can explicitly link an unbound owner claim to an existing active club;
- selected Instagram, PC price, PlayStation price and standard daily/24-7 hours can be applied separately;
- current club values are shown next to proposed owner values before applying;
- selected fields are applied through one atomic admin-only RPC;
- applied field metadata is persisted on the submission for audit;
- completed/rejected claims cannot be modified or verified;
- only active linked clubs can be verified;
- owner verification remains separate from applying submitted data;
- migration manifest, dependency audit, lint, production build and smoke tests pass.

Release rule:
- do not merge to `main` and do not deploy until the user explicitly approves the final production release.
