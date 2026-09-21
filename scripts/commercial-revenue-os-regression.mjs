import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [candidate, page, actions, layout] = await Promise.all([
  readFile(new URL('../docs/monetization/revenue-migration-candidate.sql', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/kommersiya/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/kommersiya/actions.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/layout.tsx', import.meta.url), 'utf8'),
]);

for (const table of ['commercial_opportunities','commercial_performance_snapshots']) {
  assert.ok(candidate.includes(`create table if not exists public.${table}`), `Missing ${table}`);
  assert.ok(candidate.includes(`alter table public.${table} enable row level security;`), `RLS missing for ${table}`);
  assert.ok(candidate.includes(`revoke all on table public.${table} from anon, authenticated;`), `Explicit revoke missing for ${table}`);
}
assert.ok(candidate.includes("stage in ('targeted','contacted','replied','offered','paid','activated','reported','renewed','lost')"), 'Sales pipeline stage contract missing');
assert.ok(candidate.includes("snapshot_type in ('baseline','day7','final')"), 'Performance snapshot contract missing');
assert.ok(candidate.includes("'premium_founder_30d'") && candidate.includes('29.00'), 'Founding Partner commercial package seed missing');
assert.ok(candidate.includes('commercial_opportunities_one_open_per_club_idx'), 'Open opportunity uniqueness guard missing');
assert.ok(!/grant\s+delete\s+on\s+table\s+public\.commercial_payments/i.test(candidate), 'Payment ledger must not allow DELETE');
assert.ok(!/grant\s+[^;]*update[^;]*commercial_payments/i.test(candidate), 'Payment ledger must be append-only for authenticated admins');
assert.ok(!candidate.includes('commercial_payments_admin_update'), 'Payment update policy must not exist');

assert.ok(layout.includes('href="/admin/kommersiya"'), 'Admin navigation must expose commercial control tower');
assert.ok(page.includes('Revenue OS') && page.includes('Satış pipeline'), 'Commercial admin page missing core surfaces');
assert.ok(page.includes('Paid sale yaz') && page.includes('Premium-u aktivləşdir'), 'Commercial admin page must separate payment recording from activation');
assert.ok(actions.includes('await requireAdmin()'), 'Commercial server actions must enforce admin + AAL2');
assert.ok(actions.includes("MANUAL_SALES_STAGES = new Set(['targeted','contacted','replied','offered','lost'])"), 'Paid and post-paid stages must be system-owned');
assert.ok(actions.includes('artıq açıq satış opportunity-si var'), 'Duplicate open opportunity guard missing');
assert.ok(actions.includes("previousOpportunity?.customer_id") && actions.includes('createdCustomerId'), 'Repeat sales must reuse the club customer instead of duplicating it');
assert.ok(candidate.includes("when status = 'refunded' then -amount_azn") && candidate.includes('into v_net_paid'), 'Premium activation must be refund-aware inside the atomic DB transaction.');
assert.ok(candidate.includes("v_contract_id, v_net_amount, 'paid'") && candidate.includes('now()'), 'Atomic paid sale must create a paid ledger row.');
assert.ok(candidate.includes('v_net_paid + 0.001 < v_required_total'), 'Atomic Premium activation must verify full net payment.');
assert.ok(candidate.includes("v_placement_id, v_club_id, 'baseline'"), 'Atomic Premium activation must lock pre-placement baseline.');
assert.ok(candidate.includes('set is_premium = true') && candidate.includes('premium_expires_at = v_contract.ends_at'), 'Premium presentation state must be synchronized from paid contract dates inside the atomic transaction.');
assert.ok(actions.includes("snapshotType === 'final'"), 'Final report path must remain explicit.');
for (const rpcName of ['record_paid_commercial_sale_atomic','activate_commercial_premium_atomic','finalize_commercial_performance_atomic']) {
  assert.ok(candidate.includes(`function public.${rpcName}`), `Missing atomic RPC ${rpcName}`);
  assert.ok(candidate.includes(`security invoker`), 'Commercial atomic RPCs must preserve caller RLS via SECURITY INVOKER.');
  assert.ok(candidate.includes(`revoke execute on function public.${rpcName}`), `Atomic RPC ${rpcName} must revoke default execute grants.`);
  assert.ok(actions.includes(`.rpc('${rpcName}'`), `Server actions must call atomic RPC ${rpcName}`);
}
assert.ok(candidate.includes('commercial_opportunities_contract_id_uidx'), 'Opportunity→contract idempotency index missing');
assert.ok(candidate.includes('commercial_payments_paid_contract_uidx'), 'Initial paid-payment idempotency index missing');
assert.ok(candidate.includes('commercial_payments_external_reference_uidx'), 'External payment reference uniqueness guard missing');
assert.ok(candidate.includes('commercial_placements_contract_type_uidx'), 'Contract placement uniqueness guard missing');
assert.ok(candidate.includes('commercial_placements_one_active_premium_per_club_uidx'), 'One-active-Premium-per-club invariant missing');
assert.ok(candidate.includes('for update'), 'Atomic lifecycle RPCs must lock the serialized business rows.');
assert.ok(candidate.includes('on conflict (placement_id, snapshot_type) do nothing'), 'Baseline/final snapshot retries must be idempotent.');
assert.equal((candidate.match(/as \$gameyer_commercial\$/g) || []).length, 3, 'All commercial PL/pgSQL functions must use a valid named dollar-quote opener.');
assert.equal((candidate.match(/\$gameyer_commercial\$;/g) || []).length, 3, 'All commercial PL/pgSQL functions must use a valid named dollar-quote closer.');
assert.doesNotMatch(candidate, /as \$(?!gameyer_commercial\$)/, 'Invalid single-dollar PL/pgSQL delimiter must never ship.');
assert.ok(!actions.includes('Satış yazıldı, amma status sinxronizasiyası tamamlanmadı'), 'Paid sale must not rely on partial application-level rollback/status sync.');
assert.ok(!actions.includes("supabase.from('commercial_contracts').delete().eq('id', contract.id)"), 'Paid sale must not rely on compensating deletes.');
assert.ok(actions.includes("existing && snapshotType === 'day7'"), 'Final retries must reach the atomic reconciler while day7 duplicate capture stays guarded.');
assert.ok(actions.includes('if (contactName) contactPatch.contact_name = contactName') && actions.includes('if (contactPhone) contactPatch.contact_phone = contactPhone') && actions.includes('if (contactInstagram) contactPatch.contact_instagram = contactInstagram'), 'Reused commercial customers must preserve omitted contact fields instead of nulling them during partial edits.');
assert.ok(actions.includes("opportunity.stage === 'lost'") && actions.includes("LOST opportunity əvvəlcə yenidən aktiv satış mərhələsinə keçirilməlidir."), 'Lost opportunities must not jump directly into the paid ledger.');
assert.ok(actions.includes("Deaktiv klub üçün ödənişli satış qeyd edilmir.") && actions.includes("Deaktiv klub Premium-a keçirilmir."), 'Commercial sale and Premium activation must reject clubs that became inactive.');
assert.ok(page.includes("!contract && opportunity.stage !== 'lost'"), 'Commercial UI must hide paid-sale action for lost opportunities.');
assert.ok(page.includes('yalnız real owner/official kontaktına başladıqda pipeline-a əlavə olunur') && page.includes('Real kontaktı pipeline-a əlavə et'), 'Revenue OS UI must not encourage speculative uncontacted targets to be written as customer/pipeline records.');
assert.ok(actions.includes("select('session_id,user_agent')"), 'Commercial snapshots must read user-agent evidence for traffic-quality filtering.');
assert.ok(actions.includes('SYNTHETIC_USER_AGENT_RE') && actions.includes('rawViewRows.filter'), 'Commercial snapshots must exclude synthetic/bot-like profile traffic.');
assert.ok(actions.includes('normalViewSessionIds.has(row.session_id)'), 'Commercial intent must be limited to normal profile-visitor IDs so synthetic CTA tests cannot inflate results.');

console.log('Commercial Revenue OS regression passed.');
