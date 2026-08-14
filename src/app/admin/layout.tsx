import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f9] text-[#14161c]">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="sticky top-0 p-5">
            <Link href="/admin" className="text-lg font-bold">Game<span className="text-[#7C5CFC]">Yer</span> Admin</Link>
            <nav className="mt-7 space-y-1 text-sm">
              <Link href="/admin" className="block rounded-lg px-3 py-2.5 font-medium text-gray-700 hover:bg-gray-100">Dashboard</Link>
              <Link href="/admin/klublar" className="block rounded-lg px-3 py-2.5 font-medium text-gray-700 hover:bg-gray-100">Klublar</Link>
              <Link href="/admin/klublar/yeni" className="block rounded-lg px-3 py-2.5 font-medium text-gray-700 hover:bg-gray-100">+ Yeni klub</Link>
              <Link href="/" className="block rounded-lg px-3 py-2.5 font-medium text-gray-500 hover:bg-gray-100">Sayta qayıt</Link>
            </nav>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="flex items-center gap-3 overflow-x-auto px-4 py-3 text-sm">
              <Link href="/admin" className="shrink-0 font-bold">GameYer Admin</Link>
              <Link href="/admin/klublar" className="shrink-0 text-gray-600">Klublar</Link>
              <Link href="/admin/klublar/yeni" className="shrink-0 text-[#7C5CFC]">+ Yeni klub</Link>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
