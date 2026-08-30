# Repository cleanup — 2026-08-30

Production source of truth:

- Repository: `bosYer1/sinaq`
- Default/release branch: `main`
- Production domain: `https://gameyer.az`
- Correct Vercel project: `gameyer`
- Legacy `gameyerr` must not be used for production work.

## Active work protected from cleanup

- `main`
- Current web sprint branch until its PR is merged
- Mobile foundation branches/PRs are a separate backlog and are not part of this web cleanup.

## Duplicate/obsolete PR handling

PR #195 contains an older version of founder-observability work. The current web sprint supersedes it with the same required observability plus additional security, analytics, monitoring and regression gates. After the sprint PR merges successfully, #195 should be closed as superseded rather than merged independently.

## Branch deletion rule

A remote branch is safe to delete only when all of the following are true:

1. Its work is already merged/superseded on `main`.
2. It is not the head/base of an open PR that still carries unique work.
3. `compare` shows no unique commits that need preservation.
4. It is not part of the separate mobile backlog.

Where branch-deletion capability is unavailable or status is ambiguous, leave the branch intact. Avoid destructive cleanup for cosmetic reasons.
