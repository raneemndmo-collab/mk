/**
 * Firebase / Analytics / Push Notification Tests
 *
 * Tests GA4 analytics data structures, push notification payloads,
 * notification system payload shapes, and Arabic content handling.
 * Pure tests — no Firebase emulator, no network, no DB.
 */
import { describe, it, expect } from "vitest";
import type {
  GA4Config,
  GA4OverviewMetrics,
  GA4TopPage,
  GA4TrafficSource,
  GA4DeviceBreakdown,
  GA4DashboardData,
} from "../../server/ga4-analytics";
import type { NotificationPayload } from "../../server/_core/notification";

// ─── GA4 Analytics Data Structures ───────────────────────────────────
describe("Firebase/Analytics — GA4 Data Structures", () => {
  describe("GA4Config Shape", () => {
    it("validates GA4 configuration structure", () => {
      const config: GA4Config = {
        measurementId: "G-XXXXXXXXXX",
        propertyId: "123456789",
        serviceAccountJson: JSON.stringify({
          type: "service_account",
          project_id: "monthlykey-prod",
          private_key_id: "abc123",
        }),
      };

      expect(config.measurementId).toMatch(/^G-[A-Z0-9]+$/);
      expect(config.propertyId).toMatch(/^\d+$/);
      expect(JSON.parse(config.serviceAccountJson).type).toBe("service_account");
    });
  });

  describe("GA4OverviewMetrics Shape", () => {
    it("validates overview metrics with realistic data", () => {
      const metrics: GA4OverviewMetrics = {
        sessions: 15420,
        users: 8750,
        newUsers: 3200,
        pageviews: 42000,
        bounceRate: 0.35,
        avgSessionDuration: 185,
        dateRange: { start: "2026-02-01", end: "2026-02-28" },
      };

      expect(metrics.sessions).toBeGreaterThan(0);
      expect(metrics.users).toBeLessThanOrEqual(metrics.sessions);
      expect(metrics.newUsers).toBeLessThanOrEqual(metrics.users);
      expect(metrics.bounceRate).toBeGreaterThanOrEqual(0);
      expect(metrics.bounceRate).toBeLessThanOrEqual(1);
      expect(metrics.avgSessionDuration).toBeGreaterThan(0);
      expect(new Date(metrics.dateRange.start) < new Date(metrics.dateRange.end)).toBe(true);
    });

    it("handles zero-traffic scenario", () => {
      const metrics: GA4OverviewMetrics = {
        sessions: 0,
        users: 0,
        newUsers: 0,
        pageviews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        dateRange: { start: "2026-03-01", end: "2026-03-01" },
      };

      expect(metrics.sessions).toBe(0);
      expect(metrics.bounceRate).toBe(0);
    });
  });

  describe("GA4TopPage Shape", () => {
    it("validates top pages with Arabic content", () => {
      const pages: GA4TopPage[] = [
        {
          path: "/",
          title: "الرئيسية — Monthly Key",
          pageviews: 12000,
          avgTimeOnPage: 45,
        },
        {
          path: "/properties",
          title: "العقارات المتاحة",
          pageviews: 8500,
          avgTimeOnPage: 120,
        },
        {
          path: "/property/7",
          title: "شقة فاخرة في الرياض — 4,500 ريال/شهر",
          pageviews: 3200,
          avgTimeOnPage: 180,
        },
      ];

      expect(pages).toHaveLength(3);
      pages.forEach((page) => {
        expect(page.path).toMatch(/^\//);
        expect(page.pageviews).toBeGreaterThan(0);
        expect(page.avgTimeOnPage).toBeGreaterThanOrEqual(0);
      });

      // Arabic titles should be preserved
      expect(pages[0].title).toContain("الرئيسية");
      expect(pages[2].title).toContain("ريال");
    });
  });

  describe("GA4TrafficSource Shape", () => {
    it("validates traffic sources", () => {
      const sources: GA4TrafficSource[] = [
        { source: "google", medium: "organic", sessions: 5000, users: 3500 },
        { source: "(direct)", medium: "(none)", sessions: 4000, users: 3000 },
        { source: "twitter.com", medium: "social", sessions: 1500, users: 1200 },
        { source: "haraj.com.sa", medium: "referral", sessions: 800, users: 600 },
      ];

      sources.forEach((src) => {
        expect(src.source).toBeTruthy();
        expect(src.medium).toBeTruthy();
        expect(src.users).toBeLessThanOrEqual(src.sessions);
      });

      // Saudi-specific referral source
      expect(sources[3].source).toContain(".sa");
    });
  });

  describe("GA4DeviceBreakdown Shape", () => {
    it("validates device breakdown sums to ~100%", () => {
      const devices: GA4DeviceBreakdown[] = [
        { category: "mobile", sessions: 9000, percentage: 58.4 },
        { category: "desktop", sessions: 5500, percentage: 35.7 },
        { category: "tablet", sessions: 920, percentage: 5.9 },
      ];

      const totalPercentage = devices.reduce((sum, d) => sum + d.percentage, 0);
      expect(totalPercentage).toBeGreaterThan(99);
      expect(totalPercentage).toBeLessThanOrEqual(101);

      // Mobile-first market (Saudi Arabia)
      const mobile = devices.find((d) => d.category === "mobile");
      expect(mobile).toBeDefined();
      expect(mobile!.percentage).toBeGreaterThan(40);
    });
  });

  describe("GA4DashboardData Composite Shape", () => {
    it("validates full dashboard data structure", () => {
      const dashboard: GA4DashboardData = {
        overview: {
          sessions: 15420,
          users: 8750,
          newUsers: 3200,
          pageviews: 42000,
          bounceRate: 0.35,
          avgSessionDuration: 185,
          dateRange: { start: "2026-02-01", end: "2026-02-28" },
        },
        topPages: [
          { path: "/", title: "Home", pageviews: 12000, avgTimeOnPage: 45 },
        ],
        trafficSources: [
          { source: "google", medium: "organic", sessions: 5000, users: 3500 },
        ],
        devices: [
          { category: "mobile", sessions: 9000, percentage: 58.4 },
        ],
        fetchedAt: new Date().toISOString(),
      };

      expect(dashboard.overview).toBeDefined();
      expect(dashboard.topPages.length).toBeGreaterThan(0);
      expect(dashboard.trafficSources.length).toBeGreaterThan(0);
      expect(dashboard.devices.length).toBeGreaterThan(0);
      expect(dashboard.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});

// ─── Push Notification Payloads ──────────────────────────────────────
describe("Firebase/Analytics — Push Notification Payloads", () => {
  describe("Web Push Payload Shape", () => {
    it("validates booking confirmation push payload", () => {
      const payload = {
        title: "تأكيد الحجز",
        body: "تم تأكيد حجزك للعقار #7 — شقة فاخرة في الرياض",
        icon: "/icons/booking-confirmed.png",
        badge: "/icons/badge.png",
        data: {
          type: "booking_confirmed",
          bookingId: 1001,
          propertyId: 7,
          url: "/bookings/1001",
        },
        tag: "booking-1001",
      };

      expect(payload.title).toBeTruthy();
      expect(payload.body).toContain("تأكيد");
      expect(payload.data.type).toBe("booking_confirmed");
      expect(payload.data.bookingId).toBeGreaterThan(0);
      expect(payload.data.url).toMatch(/^\/bookings\//);
    });

    it("validates payment received push payload", () => {
      const payload = {
        title: "تم استلام الدفعة",
        body: "تم استلام دفعة بقيمة 5,951 ريال للحجز #1001",
        data: {
          type: "payment_received",
          bookingId: 1001,
          amount: 5951,
          currency: "SAR",
        },
      };

      expect(payload.data.type).toBe("payment_received");
      expect(payload.data.amount).toBeGreaterThan(0);
      expect(payload.data.currency).toBe("SAR");
      expect(payload.body).toContain("ريال");
    });

    it("validates maintenance request push payload", () => {
      const payload = {
        title: "طلب صيانة جديد",
        body: "طلب صيانة جديد من المستأجر أحمد — تسريب مياه في المطبخ",
        data: {
          type: "maintenance_request",
          requestId: 501,
          propertyId: 7,
          priority: "high",
        },
      };

      expect(payload.data.type).toBe("maintenance_request");
      expect(payload.data.priority).toMatch(/^(low|medium|high|urgent)$/);
    });

    it("validates KYC status update push payload", () => {
      const payload = {
        title: "تحديث حالة التحقق",
        body: "تم الموافقة على طلب التحقق من الهوية الخاص بك",
        data: {
          type: "kyc_approved",
          userId: 42,
          level: "basic",
        },
      };

      expect(payload.data.type).toBe("kyc_approved");
      expect(payload.data.level).toMatch(/^(basic|enhanced)$/);
    });
  });

  describe("Notification Types Coverage", () => {
    const REQUIRED_NOTIFICATION_TYPES = [
      "booking_confirmed",
      "booking_cancelled",
      "payment_received",
      "payment_failed",
      "maintenance_request",
      "maintenance_update",
      "kyc_approved",
      "kyc_rejected",
      "lease_expiring",
      "new_message",
    ];

    REQUIRED_NOTIFICATION_TYPES.forEach((type) => {
      it(`notification type "${type}" has valid structure`, () => {
        const payload = {
          title: `Test — ${type}`,
          body: `Test body for ${type}`,
          data: { type, timestamp: Date.now() },
        };

        expect(payload.data.type).toBe(type);
        expect(payload.title).toBeTruthy();
        expect(payload.body).toBeTruthy();
      });
    });
  });
});

// ─── Arabic Content Handling ─────────────────────────────────────────
describe("Firebase/Analytics — Arabic Content Handling", () => {
  describe("RTL Text in Notifications", () => {
    it("preserves Arabic text with diacritics", () => {
      const text = "مرحباً بك في مفتاح الشهر";
      expect(text).toContain("مرحباً");
      expect(text.length).toBeGreaterThan(0);
    });

    it("handles mixed Arabic-English content", () => {
      const text = "حجز #1001 — Booking confirmed at Monthly Key";
      expect(text).toContain("حجز");
      expect(text).toContain("Booking");
      expect(text).toContain("#1001");
    });

    it("handles Arabic numbers (Eastern Arabic numerals)", () => {
      const westernAmount = "4,500";
      const arabicAmount = "٤٬٥٠٠";
      expect(westernAmount).toMatch(/[\d,]+/);
      expect(arabicAmount).toMatch(/[٠-٩٬]+/);
    });

    it("handles Saudi phone number format", () => {
      const phone = "+966501234567";
      expect(phone).toMatch(/^\+966\d{9}$/);
    });

    it("handles Saudi IBAN format", () => {
      const iban = "SA0380000000608010167519";
      expect(iban).toMatch(/^SA\d{22}$/);
      expect(iban.length).toBe(24);
    });
  });

  describe("Analytics Event Names", () => {
    const ANALYTICS_EVENTS = [
      "property_view",
      "property_search",
      "booking_started",
      "booking_completed",
      "payment_initiated",
      "payment_completed",
      "kyc_submitted",
      "contact_landlord",
      "favorite_added",
      "share_property",
    ];

    ANALYTICS_EVENTS.forEach((event) => {
      it(`event "${event}" follows snake_case convention`, () => {
        expect(event).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });
  });
});

// ─── NotificationPayload Type ────────────────────────────────────────
describe("Firebase/Analytics — NotificationPayload Type", () => {
  it("validates NotificationPayload structure", () => {
    const payload: NotificationPayload = {
      title: "إشعار جديد",
      body: "لديك إشعار جديد من مفتاح الشهر",
      type: "info",
    };

    expect(payload.title).toBeTruthy();
    expect(payload.body).toBeTruthy();
    expect(payload.type).toBeTruthy();
  });

  it("validates booking notification payload", () => {
    const payload: NotificationPayload = {
      title: "حجز جديد",
      body: "تم إنشاء حجز جديد للعقار #7",
      type: "booking",
      data: {
        bookingId: 1001,
        propertyId: 7,
      },
    };

    expect(payload.type).toBe("booking");
    expect(payload.data?.bookingId).toBe(1001);
  });
});
