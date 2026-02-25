#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  MonthlyKey — Seed Data Script
 * ═══════════════════════════════════════════════════════════════
 *
 *  Inserts 30 properties across 5 Saudi cities, 5–10 photos each,
 *  3 property manager accounts, and sample bookings.
 *
 *  Idempotent: uses ON CONFLICT DO NOTHING for users/units,
 *  and deletes existing seed photos/bookings before re-inserting.
 *
 *  Usage:
 *    ENABLE_SEED_DATA=true node scripts/seed-data.mjs
 *
 *  Requires: DATABASE_URL environment variable
 * ═══════════════════════════════════════════════════════════════
 */

import pg from "pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const { Pool } = pg;

if (process.env.ENABLE_SEED_DATA !== "true") {
  console.log("⏭  ENABLE_SEED_DATA is not true — skipping seed.");
  process.exit(0);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// ─── Deterministic UUIDs from seed names ────────────────────
function seedUUID(name) {
  const hash = crypto.createHash("sha256").update(`mk-seed-${name}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    "8" + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ─── Curated Unsplash photo URLs (stable, high-quality) ─────
const PHOTO_SETS = {
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

function getPhotos(type, count = 7) {
  const set = PHOTO_SETS[type] || PHOTO_SETS.apartment;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(set[i % set.length]);
  }
  return result;
}

// ─── Managers ───────────────────────────────────────────────
const MANAGERS = [
  {
    id: seedUUID("manager-a"),
    name: "سارة العتيبي",
    fullNameAr: "سارة العتيبي",
    fullNameEn: "Sara Al-Otaibi",
    email: "sara.manager@monthlykey.sa",
    phone: "+966501000001",
    role: "OWNER",
  },
  {
    id: seedUUID("manager-b"),
    name: "محمد الراشدي",
    fullNameAr: "محمد الراشدي",
    fullNameEn: "Mohammed Al-Rashdi",
    email: "mohammed.manager@monthlykey.sa",
    phone: "+966501000002",
    role: "OWNER",
  },
  {
    id: seedUUID("manager-c"),
    name: "فهد المالكي",
    fullNameAr: "فهد المالكي",
    fullNameEn: "Fahad Al-Malki",
    email: "fahad.manager@monthlykey.sa",
    phone: "+966501000003",
    role: "OWNER",
  },
];

// ─── 30 Properties ──────────────────────────────────────────
const CITIES = [
  { ar: "الرياض", en: "Riyadh" },
  { ar: "جدة", en: "Jeddah" },
  { ar: "مكة المكرمة", en: "Makkah" },
  { ar: "المدينة المنورة", en: "Madinah" },
  { ar: "الخبر", en: "Khobar" },
];

const DISTRICTS = {
  "الرياض": [
    { ar: "العليا", en: "Olaya" },
    { ar: "النخيل", en: "Al Nakheel" },
    { ar: "الملقا", en: "Al Malqa" },
    { ar: "حطين", en: "Hittin" },
    { ar: "الياسمين", en: "Al Yasmin" },
    { ar: "المدينة الرقمية", en: "Digital City" },
  ],
  "جدة": [
    { ar: "حي الشاطئ", en: "Al Shati" },
    { ar: "الكورنيش", en: "Corniche" },
    { ar: "الروضة", en: "Al Rawdah" },
    { ar: "الحمراء", en: "Al Hamra" },
    { ar: "أبحر الشمالية", en: "Obhur" },
  ],
  "مكة المكرمة": [
    { ar: "العزيزية", en: "Al Aziziyah" },
    { ar: "الشوقية", en: "Al Shawqiyyah" },
    { ar: "النسيم", en: "Al Naseem" },
  ],
  "المدينة المنورة": [
    { ar: "الحرم", en: "Al Haram" },
    { ar: "قباء", en: "Quba" },
    { ar: "العنابس", en: "Al Anabis" },
  ],
  "الخبر": [
    { ar: "الكورنيش", en: "Corniche" },
    { ar: "الراكة", en: "Al Rakah" },
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

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateProperties() {
  const properties = [];
  let idx = 0;

  for (const city of CITIES) {
    const districts = DISTRICTS[city.ar];
    const countPerCity = city.ar === "الرياض" || city.ar === "جدة" ? 8 : city.ar === "مكة المكرمة" ? 6 : 4;

    for (let i = 0; i < countPerCity; i++) {
      idx++;
      const district = districts[i % districts.length];
      const type = TYPES[idx % TYPES.length];
      const managerId = MANAGERS[idx % 3].id;

      const beds = type.key === "studio" ? 1 : type.key === "apartment" ? (1 + (idx % 3)) : type.key === "villa" ? (3 + (idx % 3)) : (1 + (idx % 2));
      const baths = Math.max(1, Math.floor(beds * 0.7));
      const area = type.key === "studio" ? 30 + (idx % 20) : type.key === "apartment" ? 80 + (idx % 120) : type.key === "villa" ? 250 + (idx % 200) : 40 + (idx % 40);
      const monthlyPrice = type.key === "studio" ? 3000 + (idx * 200) : type.key === "apartment" ? 5000 + (idx * 500) : type.key === "villa" ? 15000 + (idx * 1000) : 8000 + (idx * 300);
      const dailyPrice = Math.round(monthlyPrice / 25);

      const titleAr = `${type.ar} ${i % 2 === 0 ? "فاخر" : "مميز"} - ${district.ar}`;
      const titleEn = `${i % 2 === 0 ? "Luxury" : "Premium"} ${type.en} - ${district.en}`;
      const descAr = `${type.ar} ${i % 2 === 0 ? "فاخر" : "مميز"} في ${district.ar}، ${city.ar}. مفروش بالكامل مع جميع الخدمات. مناسب للعائلات والأفراد. عقد شهري مرن.`;
      const descEn = `${i % 2 === 0 ? "Luxury" : "Premium"} ${type.en.toLowerCase()} in ${district.en}, ${city.en}. Fully furnished with all services. Suitable for families and individuals. Flexible monthly contract.`;

      const photoCount = 5 + (idx % 6); // 5–10 photos

      properties.push({
        id: seedUUID(`property-${idx}`),
        title: titleEn,
        titleAr,
        description: descEn,
        descriptionAr: descAr,
        city: city.ar,
        zone: district.ar,
        address: `${district.ar}، ${city.ar}`,
        bedrooms: beds,
        bathrooms: baths,
        maxGuests: beds * 2,
        areaSqm: area,
        amenities: pick(AMENITIES_POOL, 4 + (idx % 5)),
        channelsEnabled: ["MONTHLYKEY"],
        status: "ACTIVE",
        monthlyPrice,
        dailyPrice,
        currency: "SAR",
        managerId,
        propertyType: type.key,
        photos: getPhotos(type.key, photoCount),
        district,
        cityObj: city,
        type,
      });
    }
  }

  return properties;
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  console.log("🌱 Starting seed...");

  try {
    await client.query("BEGIN");

    // 1. Ensure enum values exist
    // (property_type is varchar, no enum needed)

    // 2. Add columns if they don't exist (safe migration)
    const migrations = [
      `ALTER TABLE units ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id)`,
      `ALTER TABLE units ADD COLUMN IF NOT EXISTS property_type VARCHAR(50) NOT NULL DEFAULT 'apartment'`,
      `CREATE TABLE IF NOT EXISTS property_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        alt_text_en VARCHAR(500),
        alt_text_ar VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS photos_property_idx ON property_photos(property_id)`,
      `CREATE INDEX IF NOT EXISTS photos_sort_idx ON property_photos(property_id, sort_order)`,
      `CREATE INDEX IF NOT EXISTS units_manager_idx ON units(manager_id)`,
    ];

    for (const sql of migrations) {
      await client.query(sql);
    }
    console.log("  ✅ Schema migrations applied");

    // 3. Insert managers
    const passwordHash = await bcrypt.hash("SeedPass123!", 10);

    for (const m of MANAGERS) {
      await client.query(
        `INSERT INTO users (id, name, full_name_ar, full_name_en, email, phone, phone_e164, password_hash, role, preferred_locale, verification_state, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, 'ar', 'VERIFIED', true)
         ON CONFLICT (id) DO NOTHING`,
        [m.id, m.name, m.fullNameAr, m.fullNameEn, m.email, m.phone, passwordHash, m.role]
      );
    }
    console.log("  ✅ 3 manager accounts created");

    // 4. Insert properties
    const properties = generateProperties();

    // Delete existing seed photos first (idempotent)
    const seedPropertyIds = properties.map((p) => p.id);
    await client.query(
      `DELETE FROM property_photos WHERE property_id = ANY($1::uuid[])`,
      [seedPropertyIds]
    );

    // Delete existing seed bookings
    await client.query(
      `DELETE FROM bookings WHERE unit_id = ANY($1::uuid[])`,
      [seedPropertyIds]
    );

    for (const p of properties) {
      // Upsert unit
      await client.query(
        `INSERT INTO units (id, title, title_ar, description, description_ar, city, zone, address,
          bedrooms, bathrooms, max_guests, area_sqm, amenities, channels_enabled, status,
          monthly_price, daily_price, currency, manager_id, property_type, images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           title_ar = EXCLUDED.title_ar,
           description = EXCLUDED.description,
           description_ar = EXCLUDED.description_ar,
           city = EXCLUDED.city,
           zone = EXCLUDED.zone,
           monthly_price = EXCLUDED.monthly_price,
           daily_price = EXCLUDED.daily_price,
           manager_id = EXCLUDED.manager_id,
           property_type = EXCLUDED.property_type,
           images = EXCLUDED.images,
           updated_at = NOW()`,
        [
          p.id, p.title, p.titleAr, p.description, p.descriptionAr,
          p.city, p.zone, p.address, p.bedrooms, p.bathrooms, p.maxGuests,
          p.areaSqm, JSON.stringify(p.amenities), JSON.stringify(p.channelsEnabled),
          p.status, p.monthlyPrice, p.dailyPrice, p.currency, p.managerId, p.propertyType,
          JSON.stringify(p.photos),
        ]
      );

      // Insert photos
      for (let i = 0; i < p.photos.length; i++) {
        await client.query(
          `INSERT INTO property_photos (property_id, url, sort_order, alt_text_en, alt_text_ar)
           VALUES ($1, $2, $3, $4, $5)`,
          [p.id, p.photos[i], i, `${p.title} - Photo ${i + 1}`, `${p.titleAr} - صورة ${i + 1}`]
        );
      }
    }
    console.log(`  ✅ ${properties.length} properties with photos inserted`);

    // 5. Insert sample bookings (10)
    const guestNames = [
      { ar: "أحمد الشمري", en: "Ahmed Al-Shamri" },
      { ar: "نورة القحطاني", en: "Noura Al-Qahtani" },
      { ar: "خالد العنزي", en: "Khalid Al-Anzi" },
      { ar: "فاطمة الحربي", en: "Fatima Al-Harbi" },
      { ar: "عبدالرحمن السبيعي", en: "Abdulrahman Al-Subaie" },
      { ar: "ريم الغامدي", en: "Reem Al-Ghamdi" },
      { ar: "سلطان الدوسري", en: "Sultan Al-Dosari" },
      { ar: "هند المطيري", en: "Hind Al-Mutairi" },
      { ar: "ياسر العمري", en: "Yaser Al-Omari" },
      { ar: "لمى الزهراني", en: "Lama Al-Zahrani" },
    ];

    const statuses = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"];

    for (let i = 0; i < 10; i++) {
      const prop = properties[i % properties.length];
      const guest = guestNames[i];
      const checkIn = new Date(2026, 2 + Math.floor(i / 3), 1 + (i * 3));
      const checkOut = new Date(checkIn.getTime() + 30 * 24 * 60 * 60 * 1000);
      const bookingId = seedUUID(`booking-${i}`);

      await client.query(
        `INSERT INTO bookings (id, brand, unit_id, guest_name, guest_email, guest_phone,
          check_in, check_out, nights, total, currency, status, payment_status, payment_method,
          idempotency_key, notes)
         VALUES ($1, 'MONTHLYKEY', $2, $3, $4, $5, $6, $7, 30, $8, 'SAR', $9, 'PAID', 'CARD', $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          bookingId, prop.id, guest.ar, `guest${i}@example.com`, `+96650100${String(i).padStart(4, "0")}`,
          checkIn.toISOString(), checkOut.toISOString(), prop.monthlyPrice,
          statuses[i % statuses.length], `seed-booking-${i}`,
          `حجز تجريبي رقم ${i + 1}`,
        ]
      );
    }
    console.log("  ✅ 10 sample bookings inserted");

    await client.query("COMMIT");
    console.log("\n🎉 Seed complete!");

    // Summary
    console.log("\n📊 Summary:");
    console.log(`   Properties: ${properties.length}`);
    console.log(`   Photos: ${properties.reduce((sum, p) => sum + p.photos.length, 0)}`);
    console.log(`   Managers: ${MANAGERS.length}`);
    console.log(`   Bookings: 10`);
    console.log("\n👤 Manager Accounts (password: SeedPass123!):");
    for (const m of MANAGERS) {
      console.log(`   ${m.fullNameAr} (${m.fullNameEn}) — ${m.email}`);
    }

    // Print property distribution
    console.log("\n🏙  Properties by city:");
    const byCityCount = {};
    for (const p of properties) {
      byCityCount[p.city] = (byCityCount[p.city] || 0) + 1;
    }
    for (const [city, count] of Object.entries(byCityCount)) {
      console.log(`   ${city}: ${count}`);
    }

    console.log("\n🏠 Properties by type:");
    const byTypeCount = {};
    for (const p of properties) {
      const label = p.type.ar;
      byTypeCount[label] = (byTypeCount[label] || 0) + 1;
    }
    for (const [type, count] of Object.entries(byTypeCount)) {
      console.log(`   ${type}: ${count}`);
    }

    console.log("\n👤 Properties by manager:");
    for (const m of MANAGERS) {
      const count = properties.filter((p) => p.managerId === m.id).length;
      console.log(`   ${m.fullNameAr}: ${count} properties`);
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
