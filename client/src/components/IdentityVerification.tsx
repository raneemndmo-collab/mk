import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, ShieldCheck, ChevronDown, X, Search } from "lucide-react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════
   Hijri Calendar Utilities
   ═══════════════════════════════════════════════════════════════ */

const HIJRI_MONTHS_EN = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
];
const HIJRI_MONTHS_AR = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

const GREGORIAN_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const GREGORIAN_MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

/** Approximate Gregorian → Hijri conversion */
function gregorianToHijri(gYear: number, gMonth: number, gDay: number) {
  const jd = Math.floor((1461 * (gYear + 4800 + Math.floor((gMonth - 14) / 12))) / 4) +
    Math.floor((367 * (gMonth - 2 - 12 * Math.floor((gMonth - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((gYear + 4900 + Math.floor((gMonth - 14) / 12)) / 100)) / 4) +
    gDay - 32075;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * l3) / 709);
  const hDay = l3 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;
  return { year: hYear, month: hMonth, day: hDay };
}

/** Approximate Hijri → Gregorian conversion */
function hijriToGregorian(hYear: number, hMonth: number, hDay: number) {
  const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth -
    Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;
  const l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const gDay = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const gMonth = j + 2 - 12 * l4;
  const gYear = 100 * (n - 49) + i + l4;
  return { year: gYear, month: gMonth, day: gDay };
}

/* ═══════════════════════════════════════════════════════════════
   Nationality List
   ═══════════════════════════════════════════════════════════════ */

const NATIONALITIES = [
  { en: "Afghanistan", ar: "أفغانستان" },
  { en: "Albania", ar: "ألبانيا" },
  { en: "Algeria", ar: "الجزائر" },
  { en: "Argentina", ar: "الأرجنتين" },
  { en: "Australia", ar: "أستراليا" },
  { en: "Austria", ar: "النمسا" },
  { en: "Azerbaijan", ar: "أذربيجان" },
  { en: "Bahrain", ar: "البحرين" },
  { en: "Bangladesh", ar: "بنغلاديش" },
  { en: "Belgium", ar: "بلجيكا" },
  { en: "Bosnia and Herzegovina", ar: "البوسنة والهرسك" },
  { en: "Brazil", ar: "البرازيل" },
  { en: "Brunei", ar: "بروناي" },
  { en: "Bulgaria", ar: "بلغاريا" },
  { en: "Cameroon", ar: "الكاميرون" },
  { en: "Canada", ar: "كندا" },
  { en: "Chad", ar: "تشاد" },
  { en: "Chile", ar: "تشيلي" },
  { en: "China", ar: "الصين" },
  { en: "Colombia", ar: "كولومبيا" },
  { en: "Comoros", ar: "جزر القمر" },
  { en: "Côte d'Ivoire", ar: "ساحل العاج" },
  { en: "Cuba", ar: "كوبا" },
  { en: "Czech Republic", ar: "التشيك" },
  { en: "Denmark", ar: "الدنمارك" },
  { en: "Djibouti", ar: "جيبوتي" },
  { en: "Egypt", ar: "مصر" },
  { en: "Eritrea", ar: "إريتريا" },
  { en: "Ethiopia", ar: "إثيوبيا" },
  { en: "Finland", ar: "فنلندا" },
  { en: "France", ar: "فرنسا" },
  { en: "Gambia", ar: "غامبيا" },
  { en: "Germany", ar: "ألمانيا" },
  { en: "Ghana", ar: "غانا" },
  { en: "Greece", ar: "اليونان" },
  { en: "Guinea", ar: "غينيا" },
  { en: "Hungary", ar: "المجر" },
  { en: "India", ar: "الهند" },
  { en: "Indonesia", ar: "إندونيسيا" },
  { en: "Iran", ar: "إيران" },
  { en: "Iraq", ar: "العراق" },
  { en: "Ireland", ar: "أيرلندا" },
  { en: "Italy", ar: "إيطاليا" },
  { en: "Japan", ar: "اليابان" },
  { en: "Jordan", ar: "الأردن" },
  { en: "Kazakhstan", ar: "كازاخستان" },
  { en: "Kenya", ar: "كينيا" },
  { en: "Kuwait", ar: "الكويت" },
  { en: "Kyrgyzstan", ar: "قيرغيزستان" },
  { en: "Lebanon", ar: "لبنان" },
  { en: "Libya", ar: "ليبيا" },
  { en: "Malaysia", ar: "ماليزيا" },
  { en: "Mali", ar: "مالي" },
  { en: "Mauritania", ar: "موريتانيا" },
  { en: "Mexico", ar: "المكسيك" },
  { en: "Morocco", ar: "المغرب" },
  { en: "Myanmar", ar: "ميانمار" },
  { en: "Nepal", ar: "نيبال" },
  { en: "Netherlands", ar: "هولندا" },
  { en: "New Zealand", ar: "نيوزيلندا" },
  { en: "Niger", ar: "النيجر" },
  { en: "Nigeria", ar: "نيجيريا" },
  { en: "North Korea", ar: "كوريا الشمالية" },
  { en: "Norway", ar: "النرويج" },
  { en: "Oman", ar: "عُمان" },
  { en: "Pakistan", ar: "باكستان" },
  { en: "Palestine", ar: "فلسطين" },
  { en: "Philippines", ar: "الفلبين" },
  { en: "Poland", ar: "بولندا" },
  { en: "Portugal", ar: "البرتغال" },
  { en: "Qatar", ar: "قطر" },
  { en: "Romania", ar: "رومانيا" },
  { en: "Russia", ar: "روسيا" },
  { en: "Senegal", ar: "السنغال" },
  { en: "Serbia", ar: "صربيا" },
  { en: "Sierra Leone", ar: "سيراليون" },
  { en: "Singapore", ar: "سنغافورة" },
  { en: "Somalia", ar: "الصومال" },
  { en: "South Africa", ar: "جنوب أفريقيا" },
  { en: "South Korea", ar: "كوريا الجنوبية" },
  { en: "Spain", ar: "إسبانيا" },
  { en: "Sri Lanka", ar: "سريلانكا" },
  { en: "Sudan", ar: "السودان" },
  { en: "Sweden", ar: "السويد" },
  { en: "Switzerland", ar: "سويسرا" },
  { en: "Syria", ar: "سوريا" },
  { en: "Tajikistan", ar: "طاجيكستان" },
  { en: "Tanzania", ar: "تنزانيا" },
  { en: "Thailand", ar: "تايلاند" },
  { en: "Tunisia", ar: "تونس" },
  { en: "Turkey", ar: "تركيا" },
  { en: "Turkmenistan", ar: "تركمانستان" },
  { en: "Uganda", ar: "أوغندا" },
  { en: "Ukraine", ar: "أوكرانيا" },
  { en: "United Arab Emirates", ar: "الإمارات" },
  { en: "United Kingdom", ar: "المملكة المتحدة" },
  { en: "United States", ar: "الولايات المتحدة" },
  { en: "Uzbekistan", ar: "أوزبكستان" },
  { en: "Venezuela", ar: "فنزويلا" },
  { en: "Vietnam", ar: "فيتنام" },
  { en: "Yemen", ar: "اليمن" },
];

/* ═══════════════════════════════════════════════════════════════
   Date Picker Modal (Hijri/Gregorian)
   ═══════════════════════════════════════════════════════════════ */

interface DatePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (dateStr: string, calendarType: "hijri" | "gregorian") => void;
  initialDate?: string;
  initialCalendar?: "hijri" | "gregorian";
  isAr: boolean;
}

function DatePickerModal({ open, onClose, onSelect, initialDate, initialCalendar, isAr }: DatePickerModalProps) {
  const { t } = useI18n();
  const [calendarType, setCalendarType] = useState<"hijri" | "gregorian">(initialCalendar || "hijri");

  // Initialize with a reasonable date (e.g., 1990-01-01)
  const [gYear, setGYear] = useState(1990);
  const [gMonth, setGMonth] = useState(1);
  const [gDay, setGDay] = useState(1);

  const [hYear, setHYear] = useState(1410);
  const [hMonth, setHMonth] = useState(1);
  const [hDay, setHDay] = useState(1);

  // Sync Hijri ↔ Gregorian when one changes
  const syncFromGregorian = useCallback((y: number, m: number, d: number) => {
    const h = gregorianToHijri(y, m, d);
    setHYear(h.year);
    setHMonth(h.month);
    setHDay(h.day);
  }, []);

  const syncFromHijri = useCallback((y: number, m: number, d: number) => {
    const g = hijriToGregorian(y, m, d);
    setGYear(g.year);
    setGMonth(g.month);
    setGDay(g.day);
  }, []);

  // Initialize from initialDate
  useEffect(() => {
    if (initialDate) {
      const parts = initialDate.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (initialCalendar === "hijri") {
          setHYear(y); setHMonth(m); setHDay(d);
          const g = hijriToGregorian(y, m, d);
          setGYear(g.year); setGMonth(g.month); setGDay(g.day);
        } else {
          setGYear(y); setGMonth(m); setGDay(d);
          const h = gregorianToHijri(y, m, d);
          setHYear(h.year); setHMonth(h.month); setHDay(h.day);
        }
      }
    }
  }, [initialDate, initialCalendar]);

  if (!open) return null;

  const hijriMonths = isAr ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN;
  const gregMonths = isAr ? GREGORIAN_MONTHS_AR : GREGORIAN_MONTHS_EN;

  const currentMonthName = calendarType === "hijri"
    ? hijriMonths[hMonth - 1] || ""
    : gregMonths[gMonth - 1] || "";

  const currentDay = calendarType === "hijri" ? hDay : gDay;
  const currentYear = calendarType === "hijri" ? hYear : gYear;

  // Display both dates at top
  const hijriDisplay = `${hDay} ${(isAr ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN)[hMonth - 1] || ""} ${hYear}`;
  const gregDisplay = `${String(gDay).padStart(2, "0")} ${(isAr ? GREGORIAN_MONTHS_AR : GREGORIAN_MONTHS_EN)[gMonth - 1] || ""} ${gYear}`;

  // Generate year range
  const yearRange = calendarType === "hijri"
    ? Array.from({ length: 80 }, (_, i) => 1380 + i) // 1380-1459 AH
    : Array.from({ length: 80 }, (_, i) => 1960 + i - 40); // 1920-1999

  const monthNames = calendarType === "hijri" ? hijriMonths : gregMonths;
  const maxDay = calendarType === "hijri" ? 30 : new Date(gYear, gMonth, 0).getDate();

  const handleMonthChange = (m: number) => {
    if (calendarType === "hijri") {
      setHMonth(m);
      syncFromHijri(hYear, m, hDay);
    } else {
      setGMonth(m);
      syncFromGregorian(gYear, m, gDay);
    }
  };

  const handleDayChange = (d: number) => {
    if (calendarType === "hijri") {
      setHDay(d);
      syncFromHijri(hYear, hMonth, d);
    } else {
      setGDay(d);
      syncFromGregorian(gYear, gMonth, d);
    }
  };

  const handleYearChange = (y: number) => {
    if (calendarType === "hijri") {
      setHYear(y);
      syncFromHijri(y, hMonth, hDay);
    } else {
      setGYear(y);
      syncFromGregorian(y, gMonth, gDay);
    }
  };

  const handleOk = () => {
    if (calendarType === "hijri") {
      onSelect(`${hYear}-${String(hMonth).padStart(2, "0")}-${String(hDay).padStart(2, "0")}`, "hijri");
    } else {
      onSelect(`${gYear}-${String(gMonth).padStart(2, "0")}-${String(gDay).padStart(2, "0")}`, "gregorian");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header: Both dates */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 text-sm font-medium">
          <span className="text-foreground">{hijriDisplay}</span>
          <span className="text-muted-foreground">{gregDisplay}</span>
        </div>

        {/* Calendar type toggle */}
        <div className="flex mx-5 mb-4 rounded-xl border overflow-hidden">
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${calendarType === "hijri" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            onClick={() => {
              setCalendarType("hijri");
              syncFromGregorian(gYear, gMonth, gDay);
            }}
          >
            {t("verify.hijri" as any)}
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${calendarType === "gregorian" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            onClick={() => {
              setCalendarType("gregorian");
              syncFromHijri(hYear, hMonth, hDay);
            }}
          >
            {t("verify.gregorian" as any)}
          </button>
        </div>

        {/* Scroll wheel picker */}
        <div className="flex gap-0 px-5 pb-4 h-[220px] relative">
          {/* Highlight bar for selected row */}
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-[44px] bg-muted/60 rounded-lg pointer-events-none z-0" />

          {/* Month column */}
          <ScrollColumn
            items={monthNames.map((name, i) => ({ value: i + 1, label: name }))}
            selected={calendarType === "hijri" ? hMonth : gMonth}
            onChange={handleMonthChange}
          />

          {/* Day column */}
          <ScrollColumn
            items={Array.from({ length: maxDay }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
            selected={currentDay}
            onChange={handleDayChange}
          />

          {/* Year column */}
          <ScrollColumn
            items={yearRange.map(y => ({ value: y, label: calendarType === "hijri" ? `${y} AH` : String(y) }))}
            selected={currentYear}
            onChange={handleYearChange}
          />
        </div>

        {/* OK / Cancel buttons */}
        <div className="flex gap-3 px-5 pb-5">
          <Button
            className="flex-1 bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] font-semibold rounded-xl"
            onClick={handleOk}
          >
            {t("verify.ok" as any)}
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl font-semibold"
            onClick={onClose}
          >
            {t("verify.cancel" as any)}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Scroll Column for Date Picker ─── */
interface ScrollColumnProps {
  items: { value: number; label: string }[];
  selected: number;
  onChange: (value: number) => void;
}

function ScrollColumn({ items, selected, onChange }: ScrollColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44;
  const visibleItems = 5;
  const centerOffset = Math.floor(visibleItems / 2);

  useEffect(() => {
    const idx = items.findIndex(i => i.value === selected);
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTop = idx * itemHeight;
    }
  }, [selected, items]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const idx = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] && items[clamped].value !== selected) {
      onChange(items[clamped].value);
    }
  }, [items, selected, onChange]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-hide relative z-10 snap-y snap-mandatory"
      style={{
        height: visibleItems * itemHeight,
        scrollSnapType: "y mandatory",
        paddingTop: centerOffset * itemHeight,
        paddingBottom: centerOffset * itemHeight,
      }}
      onScroll={handleScroll}
    >
      {items.map((item) => (
        <div
          key={item.value}
          className={`h-[44px] flex items-center justify-center text-sm cursor-pointer snap-center transition-all select-none ${
            item.value === selected
              ? "font-bold text-foreground text-base"
              : "text-muted-foreground/50 text-sm"
          }`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Nationality Picker (Bottom Sheet Style)
   ═══════════════════════════════════════════════════════════════ */

interface NationalityPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (nationality: string) => void;
  isAr: boolean;
}

function NationalityPicker({ open, onClose, onSelect, isAr }: NationalityPickerProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return NATIONALITIES;
    const q = search.toLowerCase();
    return NATIONALITIES.filter(n =>
      n.en.toLowerCase().includes(q) || n.ar.includes(q)
    );
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b shrink-0">
          <h3 className="text-lg font-bold text-[#3ECFC0]">{t("verify.selectNationality" as any)}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={isAr ? "ابحث عن الجنسية..." : "Search nationality..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {filtered.map((n) => (
            <button
              key={n.en}
              type="button"
              className="w-full text-start px-5 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/30 text-sm"
              onClick={() => { onSelect(isAr ? n.ar : n.en); onClose(); }}
            >
              {isAr ? n.ar : n.en}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">
              {isAr ? "لا توجد نتائج" : "No results"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Identity Verification Component
   ═══════════════════════════════════════════════════════════════ */

type UserType = "saudi" | "resident" | "visitor" | "";

interface IdentityVerificationProps {
  user: any;
}

export default function IdentityVerification({ user }: IdentityVerificationProps) {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  const [userType, setUserType] = useState<UserType>((user?.userType as UserType) || "");
  const [nationalId, setNationalId] = useState((user?.nationalId as string) || "");
  const [residentNo, setResidentNo] = useState((user?.residentNo as string) || "");
  const [passportNo, setPassportNo] = useState((user?.passportNo as string) || "");
  const [nationality, setNationality] = useState((user?.nationality as string) || "");
  const [dateOfBirth, setDateOfBirth] = useState((user?.dateOfBirth as string) || "");
  const [calendarType, setCalendarType] = useState<"hijri" | "gregorian">("hijri");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("verify.saved" as any));
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Sync from user data when it loads
  useEffect(() => {
    if (user) {
      if (user.userType) setUserType(user.userType);
      if (user.nationalId) setNationalId(user.nationalId);
      if (user.residentNo) setResidentNo(user.residentNo);
      if (user.passportNo) setPassportNo(user.passportNo);
      if (user.nationality) setNationality(user.nationality);
      if (user.dateOfBirth) {
        // Format date for display
        const d = new Date(user.dateOfBirth);
        if (!isNaN(d.getTime())) {
          setDateOfBirth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
        }
      }
    }
  }, [user]);

  const isVerified = user?.userType && (
    (user.userType === "saudi" && user.nationalId) ||
    (user.userType === "resident" && user.residentNo) ||
    (user.userType === "visitor" && user.passportNo && user.nationality)
  );

  const canVerify = userType && (
    (userType === "saudi" && nationalId.trim().length >= 10 && dateOfBirth) ||
    (userType === "resident" && residentNo.trim().length >= 10 && dateOfBirth) ||
    (userType === "visitor" && passportNo.trim().length >= 5 && nationality)
  );

  const handleVerify = () => {
    const data: any = { userType };
    if (userType === "saudi") {
      data.nationalId = nationalId.trim();
      data.dateOfBirth = dateOfBirth;
    } else if (userType === "resident") {
      data.residentNo = residentNo.trim();
      data.dateOfBirth = dateOfBirth;
    } else if (userType === "visitor") {
      data.passportNo = passportNo.trim();
      data.nationality = nationality;
    }
    updateProfile.mutate(data);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const d = parseInt(parts[2]);
    if (calendarType === "hijri") {
      const months = isAr ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN;
      return `${d} ${months[m - 1] || ""} ${y}`;
    } else {
      const months = isAr ? GREGORIAN_MONTHS_AR : GREGORIAN_MONTHS_EN;
      return `${d} ${months[m - 1] || ""} ${y}`;
    }
  };

  const userTypeOptions: { value: UserType; labelKey: string }[] = [
    { value: "saudi", labelKey: "verify.saudiNational" },
    { value: "resident", labelKey: "verify.resident" },
    { value: "visitor", labelKey: "verify.visitor" },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#3ECFC0]/10">
          <ShieldCheck className="h-5 w-5 text-[#3ECFC0]" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg">{t("verify.title" as any)}</h3>
          <p className="text-sm text-muted-foreground">{t("verify.subtitle" as any)}</p>
        </div>
        {isVerified && (
          <Badge className="ms-auto bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            {t("verify.verified" as any)}
          </Badge>
        )}
      </div>

      {/* User Type Selection - Radio Style */}
      <div className="space-y-2">
        {userTypeOptions.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-start ${
              userType === value
                ? "border-[#3ECFC0] bg-[#3ECFC0]/5"
                : "border-border hover:border-[#3ECFC0]/40 hover:bg-muted/30"
            }`}
            onClick={() => setUserType(value)}
          >
            {/* Radio circle */}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              userType === value
                ? "border-[#3ECFC0] bg-[#3ECFC0]"
                : "border-muted-foreground/30"
            }`}>
              {userType === value && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`font-medium ${userType === value ? "text-foreground" : "text-muted-foreground"}`}>
              {t(labelKey as any)}
            </span>
          </button>
        ))}
      </div>

      {/* Conditional Fields */}
      {userType && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Saudi National: National ID + Date of Birth */}
          {userType === "saudi" && (
            <>
              <div className="space-y-2">
                <Label className="font-semibold">{t("verify.nationalId" as any)}</Label>
                <Input
                  dir="ltr"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder={t("verify.nationalIdPlaceholder" as any)}
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value.replace(/\D/g, ""))}
                  className="rounded-xl h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t("verify.dateOfBirth" as any)}</Label>
                <button
                  type="button"
                  className="w-full h-12 px-4 rounded-xl border bg-background text-start flex items-center justify-between hover:border-[#3ECFC0]/50 transition-colors"
                  onClick={() => setShowDatePicker(true)}
                >
                  <span className={dateOfBirth ? "text-foreground" : "text-muted-foreground"}>
                    {dateOfBirth ? formatDateDisplay(dateOfBirth) : t("verify.dateOfBirth" as any)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </>
          )}

          {/* Resident: Resident No + Date of Birth */}
          {userType === "resident" && (
            <>
              <div className="space-y-2">
                <Label className="font-semibold">{t("verify.residentNo" as any)}</Label>
                <Input
                  dir="ltr"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder={t("verify.residentNoPlaceholder" as any)}
                  value={residentNo}
                  onChange={e => setResidentNo(e.target.value.replace(/\D/g, ""))}
                  className="rounded-xl h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t("verify.dateOfBirth" as any)}</Label>
                <button
                  type="button"
                  className="w-full h-12 px-4 rounded-xl border bg-background text-start flex items-center justify-between hover:border-[#3ECFC0]/50 transition-colors"
                  onClick={() => setShowDatePicker(true)}
                >
                  <span className={dateOfBirth ? "text-foreground" : "text-muted-foreground"}>
                    {dateOfBirth ? formatDateDisplay(dateOfBirth) : t("verify.dateOfBirth" as any)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </>
          )}

          {/* Visitor: Passport + Nationality */}
          {userType === "visitor" && (
            <>
              <div className="space-y-2">
                <Label className="font-semibold">{t("verify.passportNo" as any)}</Label>
                <Input
                  dir="ltr"
                  type="text"
                  maxLength={20}
                  placeholder={t("verify.passportNoPlaceholder" as any)}
                  value={passportNo}
                  onChange={e => setPassportNo(e.target.value)}
                  className="rounded-xl h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t("verify.nationality" as any)}</Label>
                <button
                  type="button"
                  className="w-full h-12 px-4 rounded-xl border bg-background text-start flex items-center justify-between hover:border-[#3ECFC0]/50 transition-colors"
                  onClick={() => setShowNationalityPicker(true)}
                >
                  <span className={nationality ? "text-foreground" : "text-muted-foreground"}>
                    {nationality || t("verify.selectNationality" as any)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </>
          )}

          {/* Verify Button */}
          <Button
            className="w-full h-12 rounded-xl bg-[#0B1E2D] hover:bg-[#0B1E2D]/90 text-white font-bold text-base mt-2 dark:bg-[#3ECFC0] dark:text-[#0B1E2D] dark:hover:bg-[#2ab5a6]"
            disabled={!canVerify || updateProfile.isPending}
            onClick={handleVerify}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="h-5 w-5 me-2 animate-spin" />
                {t("verify.verifying" as any)}
              </>
            ) : (
              t("verify.verify" as any)
            )}
          </Button>
        </div>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(dateStr, cal) => {
          setDateOfBirth(dateStr);
          setCalendarType(cal);
          setShowDatePicker(false);
        }}
        initialDate={dateOfBirth}
        initialCalendar={calendarType}
        isAr={isAr}
      />

      {/* Nationality Picker */}
      <NationalityPicker
        open={showNationalityPicker}
        onClose={() => setShowNationalityPicker(false)}
        onSelect={setNationality}
        isAr={isAr}
      />
    </div>
  );
}
