# Owner verification status

Status as of 2026-08-17: operational rollout is intentionally paused.

The technical owner-verification capability exists in the codebase, but GameYer is not currently using club-owner self-verification as the primary data workflow. For now, club data and official social links are researched and recorded by GameYer, while `is_verified` is reserved for a later verification phase.

Implemented technical safeguards:
- owner claims with no `club_id` cannot apply data or verify a club;
- admins can explicitly link an unbound owner claim to an existing active club;
- selected Instagram, PC price, PlayStation price and standard daily/24-7 hours can be applied separately;
- current club values are shown next to proposed owner values before applying;
- selected fields are applied through one atomic admin-only RPC;
- applied field metadata is persisted on the submission for audit;
- completed/rejected claims cannot be modified or verified;
- only active linked clubs can be verified;
- owner verification remains separate from applying submitted data.

Current operating rule:
- do not proactively ask clubs to self-verify yet;
- do not set `is_verified=true` solely because an Instagram account or public source was found;
- continue researching official club data and social accounts independently;
- re-enable the owner-verification outreach flow only when the product/data phase is ready.
