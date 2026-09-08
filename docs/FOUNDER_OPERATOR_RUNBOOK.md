# GameYer Founder-independent operator runbook

Məqsəd: Founder gündəlik texniki və analitik işlərə qarışmadan GameYer-in rutin əməliyyatlarının davam etməsi. Bu sənəd secrets, project/account ID və credential saxlamır.

## 1. Tək iş ledger-i

Bütün real iş GitHub Issues/PR-lərdə izlənir. Paralel “yadda qalan task siyahıları” source of truth deyil.

Prioritet:
1. **P0 Reliability** — production, data və security incident.
2. **P1 Growth blocker** — attribution, conversion, SEO/indexing, high-intent profile quality.
3. **P2 Founder-dependency** — Founder-in manual iştirakını azaldan automation/runbook/tooling.

SMM/content Founder-owned qalır və bu loop-a daxil deyil.

## 2. Task sinifləri

### AUTO
Reversible, aşağı riskli və acceptance criteria-si ölçülə bilən işlər:
- audit və monitoring;
- test/regression əlavə etmək;
- safe bugfix;
- analytics/attribution integrity;
- SEO technical integrity;
- documentation/runbook;
- branch/PR cleanup.

Flow: **detect → issue → acceptance → fix → tests → PR → independent gate → merge/verify → close**.

### FOUNDER_APPROVAL
İstifadəçiyə və ya availability-yə ciddi təsir edə bilən qərarlar:
- DNS/nameserver/failover;
- production database restore;
- paid budget dəyişikliyi;
- irreversible data operation;
- yeni external paid service.

### HUMAN_ACTION
Yalnız login/2FA/OAuth və ya başqa real insan əməliyyatı texniki olaraq qaçılmaz olduqda.

Founder yalnız FOUNDER_APPROVAL və HUMAN_ACTION üçün interrupt edilir.

## 3. Production incident loop

1. **Təsdiqlə:** `/api/health`, homepage, representative club page, sitemap və known 404 ilə incident-in real olduğunu yoxla.
2. **Scope et:** app/Vercel, database/Supabase, DNS/network, analytics və ya external dependency.
3. **Freeze:** incident zamanı əlaqəsiz deploy/data/DNS dəyişikliklərini dayandır.
4. **Rollback-first:** son healthy production state və geri dönüş yolunu müəyyən et.
5. **Bərpa et:** ən kiçik reversible dəyişikliklə primary Vercel production-u bərpa et.
6. **Verify:** health + site integrity + responsive/security gates.
7. **Record:** root cause, elapsed time, rollback, follow-up issue.

Database corruption şübhəsində production restore test məqsədilə heç vaxt işlədilmir; əvvəl non-production restore drill və `docs/RECOVERY_RUNBOOK.md` qaydaları tətbiq edilir.

Cloudflare standby yalnız DR üçündür. **PR #325 merge edilmir.** DNS/failover dəyişiklikləri ayrıca risk qərarıdır və rehearsal bitəndə primary yenə Vercel olmalıdır.

## 4. Deploy gate

Merge/deploy-dan əvvəl minimum:
- branch cari `main`-dən geri qalmır;
- CI/test pass;
- Security pass;
- dəyişiklik public UI-yə toxunursa Responsive pass;
- rollback yolu məlumdur;
- real data uydurulmayıb;
- Supabase schema/RLS dəyişikliyi varsa ayrıca review tələb olunur.

Deploy-dan sonra production status + `/api/health` + dəyişən surface smoke-test edilir. “Merged” = “production healthy” demək deyil.

## 5. Daily operator loop

Founder-a uzun status əvəzinə yalnız qərar yönümlü brief verilir:

- **Health:** production/security/indexing incident varmı?
- **Growth:** real users, returning behavior, detail/CTA engagement və acquisition quality-də əsas dəyişiklik nədir?
- **Execution:** son 24 saatda hansı real task tamamlandı?
- **Blocker:** yalnız Founder/HUMAN_ACTION tələb edən konkret məsələ varmı?
- **Next:** bu gün ən yüksək leverage 1–3 iş.

No-change olduqda süni task yaradılmır.

## 6. Weekly loop

Həftədə bir dəfə:
- North Star və retention göstəricilərinin trendi;
- SEO/GSC query/page winners və problemlər;
- paid traffic-in keyfiyyəti, təkcə volume deyil;
- production incident və regression-lar;
- open PR/issue debt;
- Founder-dən asılı qalan manual addımlar;
- növbəti həftə üçün maksimum 3 prioritet.

## 7. Stop rules

Aşağıdakılarda avtomatik icra dayandırılır və eskalasiya edilir:
- rollback yolu yoxdur;
- production data itkisi riski var;
- auth/security boundary qeyri-müəyyəndir;
- DNS/production restore/billing tələb olunur;
- source-backed olmayan real klub məlumatı lazım olur;
- testlər problemin səbəbini ayırd etmir.

## 8. Definition of done

Task yalnız bunların hamısı olduqda bitmiş sayılır:
- acceptance criteria yerinə yetirilib;
- test/gate keçib;
- production-a təsiri varsa prod ayrıca yoxlanıb;
- rollback məlumdur;
- issue/PR-də nəticə qeyd olunub;
- Founder-in yeni manual işi yaranmayıb və ya HUMAN_ACTION açıq göstərilib.
