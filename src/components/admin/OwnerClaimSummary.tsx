import { parseOwnerClaimMessage } from '@/lib/ownerClaim';

export function OwnerClaimSummary({ message }: { message: string }) {
  const claim = parseOwnerClaimMessage(message);
  if (!claim) return <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">{message}</p>;

  const fields = [
    ['Klubla əlaqə', claim.role],
    ['Rəsmi Instagram', claim.officialInstagram],
    ['PC qiyməti', claim.pcPrice],
    ['PlayStation qiyməti', claim.psPrice],
    ['İş saatları', claim.hours],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="mt-4 rounded-xl border border-[#7C5CFC]/20 bg-[#7C5CFC]/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6A47F0]">Strukturlaşdırılmış məlumat</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
      {claim.note ? (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Əlavə qeyd</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{claim.note}</p>
        </div>
      ) : null}
    </div>
  );
}
