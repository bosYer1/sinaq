# Return-loop release checklist

- [ ] Migration reviewed for RLS and expiry behavior
- [ ] No seed/fake tournament or offer rows
- [ ] Public query returns active, non-expired rows only
- [ ] `/yenilikler` renders safe empty state when there is no verified data
- [ ] Analytics events fire through `trackPostHogEvent`
- [ ] CI passes
- [ ] Security passes
- [ ] Responsive checks pass
- [ ] Vercel preview passes
- [ ] Production migration/deploy happens only after review
