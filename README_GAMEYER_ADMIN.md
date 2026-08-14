# BosYer unified admin panel

Bu paket mövcud BosYer Next.js/Supabase layihəsinin admin hissəsini bir mərkəzi panelə yığır.

Əsas fayllar:
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/actions.ts`
- `src/app/admin/klublar/page.tsx`
- `src/app/admin/klublar/[id]/page.tsx`
- `src/app/admin/klublar/yeni/page.tsx`
- `src/components/admin/ClubAdminForm.tsx`

Mövcud Supabase client/server, DB schema, auth/middleware, RLS və public frontend/query layer ilə inteqrasiya olunur.

## Cari MVP imkanları

- PC və PlayStation klublarının siyahısı və xəritəsi
- Rayon, klub tipi, qiymət və açıq statusu üzrə filtr
- İstifadəçinin icazəsi ilə ən yaxın klublara görə sıralama
- Klub detal səhifəsi, əlaqə və naviqasiya keçidləri
- Admin login və qorunan admin bölməsi
- Klub yaratma, redaktə, aktiv/premium status idarəsi
- İş saatları, qiymətlər, tiplər və şəkillərin idarəsi
- Supabase Storage üzərindən klub şəkilləri
- Data completeness göstəriciləri
- Bakı saat qurşağına uyğun açıq/bağlı hesablaması

## Data keyfiyyəti

Admin panelində məlumat boşluqları izlənir. Real məlumat təsdiqlənməyibsə qiymət, şəkil və digər sahələr uydurulmur; sonradan admin panelindən tamamlanır.
