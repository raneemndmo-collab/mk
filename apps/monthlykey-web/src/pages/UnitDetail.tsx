import { useParams, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, MapPin, Wifi, Car, Wind, Tv, Building2, Dumbbell, Waves, UtensilsCrossed, WashingMachine, MonitorSmartphone, Fence, ShieldCheck, ArrowUpFromLine } from "lucide-react";
import MobileHeader from "../components/MobileHeader";
import HelpFAB from "../components/HelpFAB";
import PhotoGallery from "../components/PhotoGallery";
import { useLocale } from "../contexts/LocaleContext";
import { getSeedListing } from "../data/seed-listings";

/** Map amenity keys to icons and labels */
const AMENITY_MAP: Record<string, { icon: React.ElementType; ar: string; en: string }> = {
  wifi: { icon: Wifi, ar: "واي فاي مجاني", en: "Free WiFi" },
  parking: { icon: Car, ar: "موقف سيارات", en: "Parking" },
  pool: { icon: Waves, ar: "مسبح", en: "Swimming Pool" },
  gym: { icon: Dumbbell, ar: "صالة رياضية", en: "Gym" },
  ac: { icon: Wind, ar: "تكييف مركزي", en: "Central AC" },
  kitchen: { icon: UtensilsCrossed, ar: "مطبخ مجهز", en: "Equipped Kitchen" },
  washer: { icon: WashingMachine, ar: "غسالة", en: "Washer" },
  tv: { icon: Tv, ar: "تلفزيون ذكي", en: "Smart TV" },
  balcony: { icon: Fence, ar: "شرفة", en: "Balcony" },
  security: { icon: ShieldCheck, ar: "أمن 24/7", en: "24/7 Security" },
  elevator: { icon: ArrowUpFromLine, ar: "مصعد", en: "Elevator" },
  furnished: { icon: MonitorSmartphone, ar: "مفروش بالكامل", en: "Fully Furnished" },
};

export default function UnitDetail() {
  const { id } = useParams();
  const { locale, t } = useLocale();
  const listing = getSeedListing(id ?? "");
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-mk-light">
      <MobileHeader />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <Link
          to="/search"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-mk-navy mb-4 transition-colors"
        >
          <BackArrow size={16} />
          {t("العودة للبحث", "Back to Search")}
        </Link>

        {listing ? (
          <>
            {/* Photo Gallery */}
            <PhotoGallery
              photos={listing.photos}
              locale={locale}
              propertyTitle={locale === "ar" ? listing.title_ar : listing.title_en}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Main content */}
              <div className="md:col-span-2 space-y-6">
                {/* Title + type + location */}
                <div>
                  <span className="text-xs font-medium text-mk-teal bg-mk-teal/10 px-2.5 py-1 rounded-full">
                    {locale === "ar" ? listing.type_ar : listing.type_en}
                  </span>
                  <h1 className="text-xl md:text-2xl font-bold text-mk-navy mt-2">
                    {locale === "ar" ? listing.title_ar : listing.title_en}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-1.5">
                    <MapPin size={14} />
                    <span>
                      {locale === "ar"
                        ? `${listing.district_ar}، ${listing.city_ar}`
                        : `${listing.district_en}, ${listing.city_en}`}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 py-4 border-y border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-mk-navy">
                      <Building2 size={16} />
                      <span className="font-bold">{listing.beds}</span>
                    </div>
                    <span className="text-xs text-gray-500">{t("غرف", "Beds")}</span>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-mk-navy">{listing.baths}</div>
                    <span className="text-xs text-gray-500">{t("حمامات", "Baths")}</span>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-mk-navy">{listing.area}</div>
                    <span className="text-xs text-gray-500">{t("م²", "m²")}</span>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-mk-navy">{listing.max_guests}</div>
                    <span className="text-xs text-gray-500">{t("ضيوف", "Guests")}</span>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="font-semibold text-mk-navy mb-3">{t("المرافق والخدمات", "Amenities & Services")}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    {listing.amenities.map((key) => {
                      const amenity = AMENITY_MAP[key];
                      if (!amenity) return null;
                      const Icon = amenity.icon;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <Icon size={16} className="text-mk-teal" />
                          {locale === "ar" ? amenity.ar : amenity.en}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Manager info */}
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <h3 className="font-semibold text-mk-navy mb-3">{t("مدير العقار", "Property Manager")}</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-mk-teal text-white text-sm font-bold flex items-center justify-center">
                      {listing.manager.initials}
                    </div>
                    <div>
                      <p className="font-medium text-mk-navy text-sm">
                        {locale === "ar" ? listing.manager.name_ar : listing.manager.name_en}
                      </p>
                      <p className="text-xs text-gray-500">{t("مدير عقارات معتمد", "Verified Property Manager")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm h-fit sticky top-6">
                <div className="text-center mb-4">
                  <span className="text-2xl font-bold text-mk-navy">
                    {listing.price.toLocaleString()}
                  </span>
                  <span className="text-gray-500 text-sm"> {t("ر.س / شهر", "SAR / mo")}</span>
                </div>
                <div className="text-center text-xs text-gray-400 mb-4">
                  {t(
                    `يومي: ${listing.daily_price.toLocaleString()} ر.س`,
                    `Daily: ${listing.daily_price.toLocaleString()} SAR`
                  )}
                </div>
                <button className="w-full bg-mk-teal text-white py-3 rounded-xl font-medium hover:bg-mk-teal/90 transition-colors">
                  {t("تحقق من التوفر", "Check Availability")}
                </button>
                <button className="w-full mt-2 border border-mk-navy text-mk-navy py-3 rounded-xl font-medium hover:bg-mk-navy/5 transition-colors">
                  {t("تواصل مع المدير", "Contact Manager")}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  {t("لا يلزم تسجيل الدخول للتصفح", "No login required to browse")}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-mk-navy font-medium">{t("الوحدة غير موجودة", "Unit not found")}</p>
            <Link to="/search" className="text-mk-teal text-sm mt-2 inline-block hover:underline">
              {t("العودة للبحث", "Back to Search")}
            </Link>
          </div>
        )}
      </div>

      <HelpFAB locale={locale} />
    </div>
  );
}
