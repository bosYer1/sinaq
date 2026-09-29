export const INFO_PAGES = {
  contact: { title: 'Əlaqə', body: 'GameYer ilə əlaqə saxlamaq və məlumatda səhv bildirmək üçün rəsmi Instagram səhifəmizdən istifadə edə bilərsiniz.', url: 'https://www.instagram.com/gameyer.az/', action: 'GameYer Instagram' },
  owners: { title: 'Klub sahibləri üçün', body: 'Klubun adı, ünvanı, rəsmi əlaqə kanalı, oyun avadanlığı, qiymətləri və iş saatları düzgün təqdim edilməlidir. Bu beta tətbiqdə müraciət forması və məlumat yazılması yoxdur.', url: null, action: null },
  about: { title: 'Haqqımızda', body: 'GameYer Azərbaycanda gaming klublarını kəşf etməyə kömək edir. Klub məlumatları, qiymətlər və iş saatları dəyişə bilər; getməzdən əvvəl rəsmi əlaqə kanalından dəqiqləşdirin.', url: 'https://gameyer.az/haqqimizda', action: 'Saytda daha ətraflı' },
  privacy: { title: 'Məxfilik', body: 'Yaxınlıq üçün mövqe yalnız sizin istəyinizlə alınır və müvəqqəti cihaz yaddaşında saxlanılır. Ekrandan çıxanda təmizlənir. Mövqe Supabase-ə və analytics-ə göndərilmir. Background izləmə yoxdur. Klub məlumatları və şəkillər internetdən yüklənir. Xarici keçidlər müvafiq xidmətlərin məxfilik qaydalarına tabedir.', url: 'https://gameyer.az/mexfilik', action: 'Saytın məxfilik məlumatı' },
} as const;

export function infoPage(key: string | undefined) {
  return key && Object.prototype.hasOwnProperty.call(INFO_PAGES, key) ? INFO_PAGES[key as keyof typeof INFO_PAGES] : null;
}
