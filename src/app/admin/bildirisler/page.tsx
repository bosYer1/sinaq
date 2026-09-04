import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { markAllNotificationsRead, markNotificationRead } from './actions';

export const dynamic = 'force-dynamic';

type AdminNotification = {
  id: string;
  type: string;
  submission_id: string | null;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('az-AZ', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function AdminNotificationsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('id,type,submission_id,title,message,read_at,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const notifications = (data ?? []) as AdminNotification[];
  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Bildirişlər</h1>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">{unreadCount} oxunmamış</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-gray-500">Yeni klub, düzəliş və owner müraciətlərini admin növbəsində itirməmək üçün mərkəzi inbox.</p>
        </div>

        {unreadCount > 0 ? (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              Hamısını oxundu et
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/muracietler?status=pending" className="rounded-lg bg-[#7C5CFC] px-4 py-2 font-semibold text-white hover:bg-[#6A47F0]">Gözləyən müraciətlər</Link>
        <Link href="/admin/muracietler?status=reviewing" className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">Yoxlanılanlar</Link>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="font-semibold text-gray-900">Bildiriş yoxdur</p>
          <p className="mt-1 text-sm text-gray-500">Yeni müraciət daxil olanda burada görünəcək.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((item) => {
            const unread = !item.read_at;
            return (
              <article
                key={item.id}
                className={`rounded-xl border p-4 shadow-sm sm:p-5 ${unread ? 'border-violet-200 bg-violet-50/60' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {unread ? <span className="h-2.5 w-2.5 rounded-full bg-red-600" aria-label="Oxunmamış" /> : null}
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-600">
                        {item.type === 'club_submission' ? 'Müraciət' : item.type}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                    </div>
                    <h2 className="mt-3 text-base font-bold text-gray-950">{item.title}</h2>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">{item.message}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {item.submission_id ? (
                      <Link href="/admin/muracietler" className="inline-flex h-9 items-center rounded-lg bg-[#7C5CFC] px-3 text-sm font-semibold text-white hover:bg-[#6A47F0]">
                        Müraciətlərə bax
                      </Link>
                    ) : null}
                    {unread ? (
                      <form action={markNotificationRead}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                          Oxundu et
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
