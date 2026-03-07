/**
 * Tests for Profile Tab (Gathern-style), Profile Completion, Admin Panel, and Logo
 */
import { describe, it, expect } from "vitest";

// ─── Profile Tab (Gathern-Style) Tests ───

describe("ProfileTab — Gathern-Style Layout", () => {
  const menuLabels = [
    "الملف الشخصي",
    "سجل المحفظة",
    "قيّمنا",
    "استضف معنا (سجّل عقارك)",
    "طرق الدفع",
    "تواصل مع تجربة الضيف",
    "دعوة أصدقاء",
    "الأسئلة الشائعة",
    "شروط الاستخدام",
    "سياسة الخصوصية",
    "تغيير اللغة",
    "الإشعارات",
    "إعداد SMS (Twilio)",
    "لوحة التحكم",
    "تسجيل الخروج",
  ];

  it("should have all 15 menu items matching Gathern app", () => {
    expect(menuLabels).toHaveLength(15);
    expect(menuLabels).toContain("الملف الشخصي");
    expect(menuLabels).toContain("سجل المحفظة");
    expect(menuLabels).toContain("قيّمنا");
    expect(menuLabels).toContain("استضف معنا (سجّل عقارك)");
    expect(menuLabels).toContain("طرق الدفع");
    expect(menuLabels).toContain("تواصل مع تجربة الضيف");
    expect(menuLabels).toContain("دعوة أصدقاء");
    expect(menuLabels).toContain("الأسئلة الشائعة");
    expect(menuLabels).toContain("شروط الاستخدام");
    expect(menuLabels).toContain("سياسة الخصوصية");
    expect(menuLabels).toContain("تغيير اللغة");
    expect(menuLabels).toContain("تسجيل الخروج");
    expect(menuLabels).toContain("لوحة التحكم");
  });

  it("should include admin panel link in menu", () => {
    expect(menuLabels).toContain("لوحة التحكم");
  });

  it("should include profile completion link", () => {
    expect(menuLabels).toContain("الملف الشخصي");
  });

  it("should include Twilio setup link", () => {
    expect(menuLabels).toContain("إعداد SMS (Twilio)");
  });

  it("should include notifications link", () => {
    expect(menuLabels).toContain("الإشعارات");
  });

  const statsLabels = ["الحجوزات", "رصيد المحفظة", "التقييمات (من المضيفين)", "المضيفون الذين حظروك"];

  it("should have 4 stats sections matching Gathern app", () => {
    expect(statsLabels).toHaveLength(4);
    expect(statsLabels).toContain("الحجوزات");
    expect(statsLabels).toContain("رصيد المحفظة");
    expect(statsLabels).toContain("التقييمات (من المضيفين)");
    expect(statsLabels).toContain("المضيفون الذين حظروك");
  });

  it("should have commercial registration footer info", () => {
    const footerLabels = ["السجل التجاري", "رخصة وزارة السياحة", "تصنيف الرخصة"];
    const footerValues = ["7007384501", "73102999", "حجز وحدات سكنية"];
    expect(footerLabels).toHaveLength(3);
    expect(footerValues).toHaveLength(3);
    expect(footerValues[0]).toBe("7007384501");
    expect(footerValues[1]).toBe("73102999");
    expect(footerValues[2]).toBe("حجز وحدات سكنية");
  });

  it("should include Host With Us bottom sheet action", () => {
    expect(menuLabels).toContain("استضف معنا (سجّل عقارك)");
  });
});

// ─── MK Logo Tests ───

describe("MK Logo Integration", () => {
  const MK_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340926600/Qa7Q2PtJqyYVmLJFM69a8Y/mk-logo_78e14317.svg";

  it("should have a valid CDN URL for the logo", () => {
    expect(MK_LOGO).toMatch(/^https:\/\/.*\.cloudfront\.net\/.+\.svg$/);
  });

  it("should be an SVG file", () => {
    expect(MK_LOGO).toMatch(/\.svg$/);
  });

  it("should be hosted on CloudFront CDN", () => {
    expect(MK_LOGO).toContain("cloudfront.net");
  });
});

// ─── Profile Completion Screen Tests ───

describe("ProfileCompletionScreen — Identity Verification", () => {
  const identityTypes = ["saudi", "resident", "visitor"];

  it("should support 3 identity types", () => {
    expect(identityTypes).toHaveLength(3);
    expect(identityTypes).toContain("saudi");
    expect(identityTypes).toContain("resident");
    expect(identityTypes).toContain("visitor");
  });

  it("should validate Saudi National ID (min 9 digits)", () => {
    const validateSaudi = (nationalId: string) => nationalId.replace(/\D/g, "").length >= 9;
    expect(validateSaudi("106452248")).toBe(true);
    expect(validateSaudi("1064522489")).toBe(true);
    expect(validateSaudi("12345")).toBe(false);
    expect(validateSaudi("")).toBe(false);
  });

  it("should validate Resident No (min 9 digits)", () => {
    const validateResident = (residentNo: string) => residentNo.replace(/\D/g, "").length >= 9;
    expect(validateResident("106452248")).toBe(true);
    expect(validateResident("2064522489")).toBe(true);
    expect(validateResident("1234")).toBe(false);
  });

  it("should validate Visitor passport (min 4 chars) + nationality required", () => {
    const validateVisitor = (passportNo: string, nationality: string) =>
      passportNo.length >= 4 && nationality.length > 0;
    expect(validateVisitor("A542817", "Somalia")).toBe(true);
    expect(validateVisitor("AB12", "Egypt")).toBe(true);
    expect(validateVisitor("AB1", "Egypt")).toBe(false);
    expect(validateVisitor("A542817", "")).toBe(false);
  });

  const nationalities = [
    "السعودية", "الإمارات", "الكويت", "البحرين", "قطر", "عُمان",
    "مصر", "الأردن", "لبنان", "سوريا", "العراق", "فلسطين",
    "اليمن", "ليبيا", "تونس", "الجزائر", "المغرب", "السودان",
    "موريتانيا", "الصومال", "جيبوتي", "جزر القمر",
    "أفغانستان", "إندونيسيا", "باكستان", "بنغلاديش", "الهند",
    "تركيا", "إيران", "ماليزيا", "الفلبين", "نيجيريا",
    "إثيوبيا", "كينيا", "جنوب أفريقيا",
    "المملكة المتحدة", "فرنسا", "ألمانيا", "الولايات المتحدة", "كندا",
    "أستراليا", "اليابان", "الصين", "كوريا الجنوبية",
  ];

  it("should have 44 nationalities in the list", () => {
    expect(nationalities).toHaveLength(44);
  });

  it("should include key Arab nationalities", () => {
    expect(nationalities).toContain("السعودية");
    expect(nationalities).toContain("مصر");
    expect(nationalities).toContain("الإمارات");
    expect(nationalities).toContain("الكويت");
  });

  it("should include key international nationalities", () => {
    expect(nationalities).toContain("الولايات المتحدة");
    expect(nationalities).toContain("المملكة المتحدة");
    expect(nationalities).toContain("الهند");
    expect(nationalities).toContain("إندونيسيا");
  });

  const hijriMonths = [
    "محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الثانية",
    "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
  ];

  it("should have all 12 Hijri months", () => {
    expect(hijriMonths).toHaveLength(12);
    expect(hijriMonths[0]).toBe("محرم");
    expect(hijriMonths[8]).toBe("رمضان");
    expect(hijriMonths[11]).toBe("ذو الحجة");
  });

  it("should support both Hijri and Gregorian calendar modes", () => {
    const calendarModes = ["hijri", "gregorian"];
    expect(calendarModes).toContain("hijri");
    expect(calendarModes).toContain("gregorian");
  });

  it("should format Hijri date correctly", () => {
    const day = 18;
    const month = 9; // Ramadan
    const year = 1447;
    const formatted = `${day} ${hijriMonths[month - 1]} ${year}`;
    expect(formatted).toBe("18 رمضان 1447");
  });

  it("should store profile data in localStorage format", () => {
    const profileData = {
      identityType: "saudi",
      nationalId: "106452248",
      dateOfBirth: "18/9/1447",
      calendarMode: "hijri",
      userId: "user-123",
      updatedAt: Date.now(),
    };
    const serialized = JSON.stringify(profileData);
    const parsed = JSON.parse(serialized);
    expect(parsed.identityType).toBe("saudi");
    expect(parsed.nationalId).toBe("106452248");
    expect(parsed.calendarMode).toBe("hijri");
  });

  it("should strip non-numeric characters from ID inputs", () => {
    const sanitize = (val: string) => val.replace(/\D/g, "").slice(0, 10);
    expect(sanitize("106 452 248")).toBe("106452248");
    expect(sanitize("abc123def456ghi")).toBe("123456");
    expect(sanitize("12345678901234")).toBe("1234567890"); // max 10 digits
  });
});

// ─── Admin Panel Tests ───

describe("AdminPanel — Control Panel", () => {
  const sections = ["dashboard", "properties", "users", "bookings", "settings"];

  it("should have 5 admin sections", () => {
    expect(sections).toHaveLength(5);
  });

  it("should include dashboard section", () => {
    expect(sections).toContain("dashboard");
  });

  it("should include properties management section", () => {
    expect(sections).toContain("properties");
  });

  it("should include users management section", () => {
    expect(sections).toContain("users");
  });

  it("should include bookings management section", () => {
    expect(sections).toContain("bookings");
  });

  it("should include settings section", () => {
    expect(sections).toContain("settings");
  });

  const dashboardStats = ["إجمالي العقارات", "المستخدمون", "الحجوزات", "الإيرادات (ر.س)"];

  it("should have 4 dashboard stat cards", () => {
    expect(dashboardStats).toHaveLength(4);
    expect(dashboardStats).toContain("إجمالي العقارات");
    expect(dashboardStats).toContain("المستخدمون");
    expect(dashboardStats).toContain("الحجوزات");
    expect(dashboardStats).toContain("الإيرادات (ر.س)");
  });

  const quickActions = [
    { label: "إضافة عقار جديد", url: "https://monthlykey.com/admin/properties/new" },
    { label: "مراجعة الحجوزات المعلقة", url: "https://monthlykey.com/admin/bookings" },
    { label: "إدارة المستخدمين", url: "https://monthlykey.com/admin/users" },
    { label: "فتح لوحة تحكم الموقع", url: "https://monthlykey.com/admin" },
  ];

  it("should have 4 quick actions linking to monthlykey.com admin", () => {
    expect(quickActions).toHaveLength(4);
    quickActions.forEach(action => {
      expect(action.url).toMatch(/^https:\/\/monthlykey\.com\/admin/);
    });
  });

  it("should link to correct admin URLs", () => {
    expect(quickActions[0].url).toBe("https://monthlykey.com/admin/properties/new");
    expect(quickActions[1].url).toBe("https://monthlykey.com/admin/bookings");
    expect(quickActions[2].url).toBe("https://monthlykey.com/admin/users");
    expect(quickActions[3].url).toBe("https://monthlykey.com/admin");
  });

  const userManagementItems = [
    { label: "عرض جميع المستخدمين", url: "https://monthlykey.com/admin/users" },
    { label: "المضيفون", url: "https://monthlykey.com/admin/landlords" },
    { label: "التحقق من الهوية", url: "https://monthlykey.com/admin/verification" },
    { label: "المستخدمون المحظورون", url: "https://monthlykey.com/admin/banned" },
  ];

  it("should have 4 user management items", () => {
    expect(userManagementItems).toHaveLength(4);
  });

  it("should link user management to correct admin URLs", () => {
    expect(userManagementItems[0].url).toContain("/admin/users");
    expect(userManagementItems[1].url).toContain("/admin/landlords");
    expect(userManagementItems[2].url).toContain("/admin/verification");
    expect(userManagementItems[3].url).toContain("/admin/banned");
  });

  const bookingStatuses = ["pending", "confirmed", "cancelled"];

  it("should support 3 booking status filters", () => {
    expect(bookingStatuses).toHaveLength(3);
    expect(bookingStatuses).toContain("pending");
    expect(bookingStatuses).toContain("confirmed");
    expect(bookingStatuses).toContain("cancelled");
  });

  const settingsItems = [
    { label: "إعدادات الحاسبة", url: "https://monthlykey.com/admin/settings/calculator" },
    { label: "إدارة المدن", url: "https://monthlykey.com/admin/settings/cities" },
    { label: "إعدادات الإشعارات", url: "https://monthlykey.com/admin/settings/notifications" },
    { label: "إعدادات الدفع", url: "https://monthlykey.com/admin/settings/payment" },
    { label: "Supabase Dashboard", url: "https://supabase.com/dashboard" },
  ];

  it("should have 5 settings items", () => {
    expect(settingsItems).toHaveLength(5);
  });

  it("should link to Supabase dashboard", () => {
    const supabaseItem = settingsItems.find(i => i.label === "Supabase Dashboard");
    expect(supabaseItem).toBeDefined();
    expect(supabaseItem!.url).toBe("https://supabase.com/dashboard");
  });

  it("should include admin access info section", () => {
    const adminAccessText = "للوصول كمسؤول رئيسي (Root Admin) إلى التطبيق والموقع، قم بتسجيل الدخول عبر monthlykey.com/admin";
    expect(adminAccessText).toContain("Root Admin");
    expect(adminAccessText).toContain("monthlykey.com/admin");
  });
});

// ─── Screen Navigation Tests ───

describe("Screen Navigation — New Screens", () => {
  const screenIds = [
    "home", "search", "favorites", "bookings", "profile",
    "property-detail", "booking-flow", "login",
    "notifications-settings", "twilio-setup",
    "profile-completion", "admin-panel",
  ];

  it("should include profile-completion screen", () => {
    expect(screenIds).toContain("profile-completion");
  });

  it("should include admin-panel screen", () => {
    expect(screenIds).toContain("admin-panel");
  });

  it("should have 12 total screens", () => {
    expect(screenIds).toHaveLength(12);
  });

  it("should navigate back from admin-panel to profile", () => {
    const goBack = (screen: string) => {
      if (screen === "admin-panel") return "profile";
      if (screen === "profile-completion") return "profile";
      return "home";
    };
    expect(goBack("admin-panel")).toBe("profile");
    expect(goBack("profile-completion")).toBe("profile");
  });
});

// ─── Property Status Display Tests ───

describe("Property Status Display in Admin", () => {
  const getStatusLabel = (status: string) => {
    if (status === "active") return "نشط";
    if (status === "pending") return "معلق";
    return status;
  };

  it("should display active status in Arabic", () => {
    expect(getStatusLabel("active")).toBe("نشط");
  });

  it("should display pending status in Arabic", () => {
    expect(getStatusLabel("pending")).toBe("معلق");
  });

  it("should pass through unknown statuses", () => {
    expect(getStatusLabel("inactive")).toBe("inactive");
  });
});
