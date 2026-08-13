import Link from 'next/link';
import { getAdminClubs } from '@/lib/queries/admin/clubs';

export default async function AdminKlublarPage() {
  const clubs = await getAdminClubs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Klublar</h1>
        <Link
          href="/admin/klublar/yeni"
          className="rounded-card bg-primary px-4 py-2 text-sm font-medium text-white shadow-card"
        >
          Yeni klub əlavə et
        </Link>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">Rayon</th>
              <th className="px-4 py-3 font-medium">Aktiv</th>
              <th className="px-4 py-3 font-medium">Premium</th>
              <th className="px-4 py-3 font-medium">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {clubs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Hələ heç bir klub əlavə edilməyib.
                </td>
              </tr>
            )}
            {clubs.map((club) => (
              <tr key={club.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{club.name}</td>
                <td className="px-4 py-3 text-muted">{club.district_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      club.is_active
                        ? 'rounded-full bg-green-100 px-2 py-1 text-xs text-green-700'
                        : 'rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600'
                    }
                  >
                    {club.is_active ? 'Aktiv' : 'Passiv'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {club.is_premium ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                      Premium
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted">Redaktə (tezliklə)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
