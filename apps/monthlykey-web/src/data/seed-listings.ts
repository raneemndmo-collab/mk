/**
 * ═══════════════════════════════════════════════════════════════
 *  Seed Listings Data — 30 properties for frontend demo
 * ═══════════════════════════════════════════════════════════════
 *
 *  This data mirrors the backend seed script. In production,
 *  the frontend fetches from the API. This file is used as
 *  fallback when the API is unavailable (dev/demo mode).
 * ═══════════════════════════════════════════════════════════════
 */

export interface SeedPhoto {
  url: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
}

export interface SeedListing {
  id: string;
  title_ar: string;
  title_en: string;
  type_key: string;
  type_ar: string;
  type_en: string;
  city_ar: string;
  city_en: string;
  district_ar: string;
  district_en: string;
  price: number;
  daily_price: number;
  beds: number;
  baths: number;
  area: number;
  max_guests: number;
  amenities: string[];
  photos: SeedPhoto[];
  cover_photo_url: string;
  photo_count: number;
  manager: {
    name_ar: string;
    name_en: string;
    initials: string;
  };
}

const PHOTO_SETS: Record<string, string[]> = {
  villa: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",
  ],
  apartment: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&h=600&fit=crop",
  ],
  studio: [
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
  ],
  hotel_suite: [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop",
  ],
};

function getPhotos(type: string, count: number): SeedPhoto[] {
  const set = PHOTO_SETS[type] || PHOTO_SETS.apartment;
  return Array.from({ length: count }, (_, i) => ({
    url: set[i % set.length],
    alt_text_en: null,
    alt_text_ar: null,
  }));
}

const MANAGERS = [
  { name_ar: "سارة العتيبي", name_en: "Sara Al-Otaibi", initials: "سع" },
  { name_ar: "محمد الراشدي", name_en: "Mohammed Al-Rashdi", initials: "مر" },
  { name_ar: "فهد المالكي", name_en: "Fahad Al-Malki", initials: "فم" },
];

const CITIES = [
  { ar: "الرياض", en: "Riyadh" },
  { ar: "جدة", en: "Jeddah" },
  { ar: "مكة المكرمة", en: "Makkah" },
  { ar: "المدينة المنورة", en: "Madinah" },
  { ar: "الخبر", en: "Khobar" },
];

const DISTRICTS: Record<string, { ar: string; en: string }[]> = {
  "الرياض": [
    { ar: "العليا", en: "Olaya" }, { ar: "النخيل", en: "Al Nakheel" },
    { ar: "الملقا", en: "Al Malqa" }, { ar: "حطين", en: "Hittin" },
    { ar: "الياسمين", en: "Al Yasmin" }, { ar: "المدينة الرقمية", en: "Digital City" },
  ],
  "جدة": [
    { ar: "حي الشاطئ", en: "Al Shati" }, { ar: "الكورنيش", en: "Corniche" },
    { ar: "الروضة", en: "Al Rawdah" }, { ar: "الحمراء", en: "Al Hamra" },
    { ar: "أبحر الشمالية", en: "Obhur" },
  ],
  "مكة المكرمة": [
    { ar: "العزيزية", en: "Al Aziziyah" }, { ar: "الشوقية", en: "Al Shawqiyyah" },
    { ar: "النسيم", en: "Al Naseem" },
  ],
  "المدينة المنورة": [
    { ar: "الحرم", en: "Al Haram" }, { ar: "قباء", en: "Quba" },
    { ar: "العنابس", en: "Al Anabis" },
  ],
  "الخبر": [
    { ar: "الكورنيش", en: "Corniche" }, { ar: "الراكة", en: "Al Rakah" },
    { ar: "اليرموك", en: "Al Yarmouk" },
  ],
};

const TYPES = [
  { key: "studio", ar: "استوديو", en: "Studio" },
  { key: "apartment", ar: "شقة", en: "Apartment" },
  { key: "villa", ar: "فيلا", en: "Villa" },
  { key: "hotel_suite", ar: "جناح فندقي", en: "Hotel Suite" },
];

const AMENITIES_POOL = [
  "wifi", "parking", "pool", "gym", "ac", "kitchen", "washer",
  "tv", "balcony", "security", "elevator", "furnished",
];

function deterministicPick(arr: string[], seed: number, n: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < n && i < arr.length; i++) {
    result.push(arr[(seed + i) % arr.length]);
  }
  return result;
}

function generateListings(): SeedListing[] {
  const listings: SeedListing[] = [];
  let idx = 0;

  for (const city of CITIES) {
    const districts = DISTRICTS[city.ar];
    const countPerCity = city.ar === "الرياض" || city.ar === "جدة" ? 8 : city.ar === "مكة المكرمة" ? 6 : 4;

    for (let i = 0; i < countPerCity; i++) {
      idx++;
      const district = districts[i % districts.length];
      const type = TYPES[idx % TYPES.length];
      const manager = MANAGERS[idx % 3];

      const beds = type.key === "studio" ? 1 : type.key === "apartment" ? (1 + (idx % 3)) : type.key === "villa" ? (3 + (idx % 3)) : (1 + (idx % 2));
      const baths = Math.max(1, Math.floor(beds * 0.7));
      const area = type.key === "studio" ? 30 + (idx % 20) : type.key === "apartment" ? 80 + (idx % 120) : type.key === "villa" ? 250 + (idx % 200) : 40 + (idx % 40);
      const price = type.key === "studio" ? 3000 + (idx * 200) : type.key === "apartment" ? 5000 + (idx * 500) : type.key === "villa" ? 15000 + (idx * 1000) : 8000 + (idx * 300);
      const dailyPrice = Math.round(price / 25);

      const titleAr = `${type.ar} ${i % 2 === 0 ? "فاخر" : "مميز"} - ${district.ar}`;
      const titleEn = `${i % 2 === 0 ? "Luxury" : "Premium"} ${type.en} - ${district.en}`;

      const photoCount = 5 + (idx % 6);
      const photos = getPhotos(type.key, photoCount);

      listings.push({
        id: `seed-${idx}`,
        title_ar: titleAr,
        title_en: titleEn,
        type_key: type.key,
        type_ar: type.ar,
        type_en: type.en,
        city_ar: city.ar,
        city_en: city.en,
        district_ar: district.ar,
        district_en: district.en,
        price,
        daily_price: dailyPrice,
        beds,
        baths,
        area,
        max_guests: beds * 2,
        amenities: deterministicPick(AMENITIES_POOL, idx, 4 + (idx % 5)),
        photos,
        cover_photo_url: photos[0].url,
        photo_count: photos.length,
        manager,
      });
    }
  }

  return listings;
}

export const SEED_LISTINGS = generateListings();

/** Get a single listing by ID */
export function getSeedListing(id: string): SeedListing | undefined {
  return SEED_LISTINGS.find((l) => l.id === id);
}

/** Get listings filtered by city, type, price range */
export function filterSeedListings(params: {
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  q?: string;
  page?: number;
  limit?: number;
}): { data: SeedListing[]; total: number; page: number; totalPages: number } {
  let filtered = [...SEED_LISTINGS];

  if (params.city) {
    filtered = filtered.filter(
      (l) => l.city_ar.includes(params.city!) || l.city_en.toLowerCase().includes(params.city!.toLowerCase())
    );
  }
  if (params.type) {
    filtered = filtered.filter((l) => l.type_key === params.type);
  }
  if (params.minPrice !== undefined) {
    filtered = filtered.filter((l) => l.price >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    filtered = filtered.filter((l) => l.price <= params.maxPrice!);
  }
  if (params.beds !== undefined) {
    filtered = filtered.filter((l) => l.beds >= params.beds!);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.title_ar.includes(q) ||
        l.title_en.toLowerCase().includes(q) ||
        l.city_ar.includes(q) ||
        l.city_en.toLowerCase().includes(q) ||
        l.district_ar.includes(q) ||
        l.district_en.toLowerCase().includes(q)
    );
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return { data, total, page, totalPages };
}
