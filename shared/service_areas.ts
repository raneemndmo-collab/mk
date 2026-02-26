/**
 * Service Areas — Static data source for cities & districts
 *
 * HOW TO UPDATE:
 * 1. Add/remove districts in the arrays below
 * 2. Change city status: "active" | "coming_soon"
 * 3. Commit + push → Railway auto-deploys
 *
 * This file is imported by both client and server.
 * No database migration needed — it's a static reference.
 */

export type CityStatus = "active" | "coming_soon";

export interface ServiceDistrict {
  ar: string;
  en: string;
}

export interface ServiceCity {
  id: string;
  name_ar: string;
  name_en: string;
  status: CityStatus;
  districts: ServiceDistrict[];
}

export const SERVICE_AREAS: ServiceCity[] = [
  {
    id: "riyadh",
    name_ar: "الرياض",
    name_en: "Riyadh",
    status: "active",
    districts: [
      { ar: "العليا", en: "Al Olaya" },
      { ar: "الملز", en: "Al Malaz" },
      { ar: "السليمانية", en: "Al Sulaimaniyah" },
      { ar: "الياسمين", en: "Al Yasmin" },
      { ar: "النخيل", en: "Al Nakheel" },
      { ar: "الروضة", en: "Al Rawdah" },
      { ar: "المروج", en: "Al Muruj" },
      { ar: "الصحافة", en: "Al Sahafah" },
      { ar: "الربوة", en: "Al Rabwah" },
      { ar: "الورود", en: "Al Wurud" },
      { ar: "النرجس", en: "Al Narjis" },
      { ar: "الملقا", en: "Al Malqa" },
      { ar: "حطين", en: "Hittin" },
      { ar: "الرحمانية", en: "Al Rahmaniyah" },
      { ar: "الغدير", en: "Al Ghadir" },
      { ar: "العقيق", en: "Al Aqiq" },
      { ar: "الرمال", en: "Al Rimal" },
      { ar: "قرطبة", en: "Qurtubah" },
      { ar: "الحمراء", en: "Al Hamra" },
      { ar: "المونسية", en: "Al Munsiyah" },
      { ar: "الازدهار", en: "Al Izdihar" },
      { ar: "الشفا", en: "Al Shifa" },
      { ar: "العريجاء", en: "Al Uraija" },
      { ar: "الدرعية", en: "Al Diriyah" },
      { ar: "طويق", en: "Tuwaiq" },
      { ar: "الخزامى", en: "Al Khuzama" },
      { ar: "السفارات", en: "Diplomatic Quarter" },
      { ar: "الواحة", en: "Al Wahah" },
      { ar: "المصيف", en: "Al Masif" },
      { ar: "الفلاح", en: "Al Falah" },
    ],
  },
  {
    id: "jeddah",
    name_ar: "جدة",
    name_en: "Jeddah",
    status: "coming_soon",
    districts: [
      { ar: "الحمراء", en: "Al Hamra" },
      { ar: "الروضة", en: "Al Rawdah" },
      { ar: "الزهراء", en: "Al Zahra" },
      { ar: "الأندلس", en: "Al Andalus" },
      { ar: "الشاطئ", en: "Al Shati" },
      { ar: "المروة", en: "Al Marwah" },
      { ar: "الصفا", en: "Al Safa" },
      { ar: "النعيم", en: "Al Naeem" },
      { ar: "المحمدية", en: "Al Mohammadiyah" },
      { ar: "أبحر الشمالية", en: "Obhur North" },
      { ar: "أبحر الجنوبية", en: "Obhur South" },
      { ar: "الخالدية", en: "Al Khalidiyah" },
      { ar: "السلامة", en: "Al Salamah" },
      { ar: "البوادي", en: "Al Bawadi" },
      { ar: "الفيحاء", en: "Al Fayha" },
    ],
  },
  {
    id: "madinah",
    name_ar: "المدينة المنورة",
    name_en: "Madinah",
    status: "coming_soon",
    districts: [
      { ar: "الحرم", en: "Al Haram" },
      { ar: "قباء", en: "Quba" },
      { ar: "العزيزية", en: "Al Aziziyah" },
      { ar: "الإسكان", en: "Al Iskan" },
      { ar: "الخالدية", en: "Al Khalidiyah" },
      { ar: "العيون", en: "Al Uyun" },
      { ar: "أحد", en: "Uhud" },
      { ar: "الروضة", en: "Al Rawdah" },
      { ar: "النزهة", en: "Al Nuzha" },
      { ar: "بني بياضة", en: "Bani Bayada" },
      { ar: "العنابس", en: "Al Anabis" },
      { ar: "الدفاع", en: "Al Difa" },
    ],
  },
];

/** Get only active cities */
export function getActiveCities() {
  return SERVICE_AREAS.filter((c) => c.status === "active");
}

/** Get coming soon cities */
export function getComingSoonCities() {
  return SERVICE_AREAS.filter((c) => c.status === "coming_soon");
}

/** Localized "coming soon" message */
export function getComingSoonMessage(lang: string): string {
  if (lang === "ar") {
    const names = getComingSoonCities().map((c) => c.name_ar).join(" و");
    const active = getActiveCities().map((c) => c.name_ar).join(" و");
    return `حالياً نخدم ${active} فقط — قريباً ${names}.`;
  }
  const names = getComingSoonCities().map((c) => c.name_en).join(" and ");
  const active = getActiveCities().map((c) => c.name_en).join(" and ");
  return `Currently we serve ${active} only. ${names} coming soon.`;
}
