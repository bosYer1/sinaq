# Search Console opportunity workflow

GameYer SEO dəyişiklikləri yalnız real query/landing evidence əsasında prioritetləşdirilir.

## Input

Search Console Performance export CSV: query, page (əgər page dimension ilə export olunubsa), clicks, impressions, CTR, position.

Run:

```bash
node scripts/search-console-opportunities.mjs path/to/export.csv
```

## Prioritet qaydası

1. Ən azı 20 impression.
2. Orta mövqe 4–20 aralığında olan query-lər.
3. Eyni zamanda aşağı CTR olan query-lər əvvəlcə title/description/snippet intent auditinə gedir.
4. Query ilə mövcud landing intent-i uyğun gəlirsə həmin səhifədə content polish və internal linking edilir.
5. Eyni intent üçün birdən çox landing varsa cannibalization yoxlanır; yeni landing yaradılmır.
6. Yeni landing yalnız real query demand + kifayət qədər real GameYer klub datası olduqda ayrıca review edilir.
7. Dəyişiklikdən sonra eyni query/page üçün impressions, clicks, CTR və position müqayisə olunur.

## Data quality

Search Console proqramatik connector mövcud deyilsə export faylı istifadə olunur. Təxmin və üçüncü tərəf keyword-volume rəqəmləri production SEO qərarının əsas sübutu sayılmır.
