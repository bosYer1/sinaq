const stats = [
  { label: 'Ümumi klub sayı' },
  { label: 'Aktiv klub sayı' },
  { label: 'Premium klub sayı' },
  { label: 'Rayon sayı' },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Dashboard</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
