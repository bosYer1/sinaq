import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Klublar', href: '/admin/klublar' },
  { label: 'Rayonlar', href: '/admin/rayonlar' },
  { label: 'Klub tipləri', href: '/admin/tipler' },
  { label: 'Premium', href: '/admin/premium' },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-gray-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
