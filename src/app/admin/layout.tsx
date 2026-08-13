import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <AdminHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
