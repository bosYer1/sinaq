# GameYer unified admin panel

GameYer Next.js/Supabase layihəsinin admin hissəsi bir mərkəzi paneldə idarə olunur.

Əsas fayllar:
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/actions.ts`
- `src/app/admin/klublar/page.tsx`
- `src/app/admin/klublar/[id]/page.tsx`
- `src/app/admin/klublar/yeni/page.tsx`
- `src/components/admin/ClubAdminForm.tsx`

## Cari MVP imkanları

- PC və PlayStation klublarının siyahısı və xəritəsi
- Rayon, klub tipi və qiymət üzrə filtr
- İstifadəçinin icazəsi ilə ən yaxın klublara görə sıralama
- Klub detal səhifəsi, əlaqə və Google Maps marşrutu
- Admin login və qorunan admin bölməsi
- Klub yaratma, redaktə, aktiv/premium status idarəsi
- İş saatları, qiymətlər, tiplər və şəkillərin idarəsi
- Supabase Storage üzərindən klub şəkilləri
- Data completeness göstəriciləri
- Bakı saat qurşağına uyğun açıq/bağlı hesablaması

## Data prinsipi

Real məlumat təsdiqlənməyibsə qiymət, iş saatı, telefon və klub şəkli uydurulmur. Çatışmayan məlumat admin panelində görünür və yalnız təsdiqləndikdən sonra əlavə edilir.
