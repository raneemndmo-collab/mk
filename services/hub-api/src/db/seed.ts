import { db } from "./connection.js";
import { units, users, featureFlags } from "./schema.js";
import bcrypt from "bcryptjs";
import { FEATURE_FLAG_KEYS } from "@mk/shared";

async function seed() {
  console.log("Seeding database...");

  // Seed admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    name: "مدير النظام",
    email: "admin@mk-platform.sa",
    phone: "+966500000000",
    passwordHash,
    role: "ADMIN",
    zones: ["الرياض", "جدة"],
  }).onConflictDoNothing();

  // Seed ops manager
  await db.insert(users).values({
    name: "مدير العمليات",
    email: "ops@mk-platform.sa",
    phone: "+966500000001",
    passwordHash: await bcrypt.hash("ops123", 10),
    role: "OPS_MANAGER",
    zones: ["الرياض"],
  }).onConflictDoNothing();

  // Seed cleaner
  await db.insert(users).values({
    name: "فريق التنظيف",
    email: "cleaner@mk-platform.sa",
    phone: "+966500000002",
    passwordHash: await bcrypt.hash("clean123", 10),
    role: "CLEANER",
    zones: ["الرياض"],
  }).onConflictDoNothing();

  // Seed feature flags (all OFF by default)
  for (const key of FEATURE_FLAG_KEYS) {
    await db.insert(featureFlags).values({
      key,
      enabled: false,
      scope: "GLOBAL",
      description: `Feature flag: ${key}`,
    }).onConflictDoNothing();
  }

  // Seed sample units
  const sampleUnits = [
    {
      title: "Luxury Studio in Riyadh",
      titleAr: "استوديو فاخر في الرياض",
      description: "Modern furnished studio in Al Olaya district",
      descriptionAr: "استوديو مفروش حديث في حي العليا",
      city: "الرياض",
      zone: "العليا",
      bedrooms: 0,
      bathrooms: 1,
      maxGuests: 2,
      areaSqm: 45,
      amenities: ["wifi", "ac", "kitchen", "parking", "gym"],
      channelsEnabled: ["COBNB", "MONTHLYKEY"],
      monthlyPrice: 5500,
      dailyPrice: 350,
    },
    {
      title: "2BR Apartment in Jeddah",
      titleAr: "شقة غرفتين في جدة",
      description: "Spacious 2-bedroom apartment near the Corniche",
      descriptionAr: "شقة واسعة بغرفتين قرب الكورنيش",
      city: "جدة",
      zone: "الكورنيش",
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      areaSqm: 95,
      amenities: ["wifi", "ac", "kitchen", "parking", "pool", "sea_view"],
      channelsEnabled: ["COBNB", "MONTHLYKEY"],
      monthlyPrice: 8500,
      dailyPrice: 550,
    },
    {
      title: "Family Villa in Dammam",
      titleAr: "فيلا عائلية في الدمام",
      description: "3-bedroom villa with private garden",
      descriptionAr: "فيلا 3 غرف مع حديقة خاصة",
      city: "الدمام",
      zone: "الشاطئ",
      bedrooms: 3,
      bathrooms: 3,
      maxGuests: 8,
      areaSqm: 200,
      amenities: ["wifi", "ac", "kitchen", "parking", "garden", "bbq"],
      channelsEnabled: ["MONTHLYKEY"],
      monthlyPrice: 12000,
      dailyPrice: 800,
    },
  ];

  for (const unit of sampleUnits) {
    await db.insert(units).values(unit).onConflictDoNothing();
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
