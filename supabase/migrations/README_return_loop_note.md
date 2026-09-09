# Return-loop migration note

`20260909122500_add_club_updates.sql` creates the verified tournament/offer foundation only. It intentionally contains no seed rows and must not invent club updates. Production application should happen only through the normal reviewed migration path after CI/security/responsive checks pass.
