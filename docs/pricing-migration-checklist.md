# Pricing migration release checklist

- Apply schema migrations before application merge/deploy.
- Verify existing simple club pricing remains readable.
- Verify detailed pricing supports multiple rows per club/type.
- Confirm package pricing is excluded from hourly discovery filters.
- Confirm decimal prices render without rounding.
- Confirm owner-claim quick pricing refuses to overwrite detailed tariffs.
- Verify Milli Gaming Arena seed values against source material before production migration.
- Run lint, TypeScript, production build, security checks, and responsive checks.
- Do not merge or deploy until all checks pass and founder explicitly approves deploy.
