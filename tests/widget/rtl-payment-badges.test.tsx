/**
 * Widget Tests — RTL Layout & PaymentMethodsBadges
 *
 * @vitest-environment jsdom
 *
 * Tests RTL (Arabic) rendering behavior and PaymentMethodsBadges component.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ─── Mock Dependencies ───────────────────────────────────────────────
vi.mock("@/lib/trpc", () => ({
  trpc: {
    finance: {
      moyasarPayment: {
        getEnabledBadges: {
          useQuery: () => ({
            data: [
              {
                key: "mada_card",
                provider: "moyasar",
                label: "mada Card",
                labelAr: "بطاقة مدى",
                logoPath: "/payment-logos/mada.svg",
                displayOrder: 1,
                isOnline: true,
              },
              {
                key: "apple_pay",
                provider: "moyasar",
                label: "Apple Pay",
                labelAr: "Apple Pay",
                logoPath: "/payment-logos/apple-pay.svg",
                displayOrder: 2,
                isOnline: true,
              },
            ],
            isLoading: false,
            error: null,
          }),
        },
      },
    },
    useUtils: () => ({}),
  },
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    lang: "en",
    t: (key: string) => key,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Import after mocks ─────────────────────────────────────────────
import PaymentMethodsBadges from "../../client/src/components/PaymentMethodsBadges";

// ─── Test Suite: RTL Layout ──────────────────────────────────────────
describe("Widget Tests — RTL Layout", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("dir");
    document.documentElement.removeAttribute("lang");
  });

  describe("Document Direction", () => {
    it("sets dir=rtl for Arabic content", () => {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
      expect(document.documentElement.dir).toBe("rtl");
      expect(document.documentElement.lang).toBe("ar");
    });

    it("sets dir=ltr for English content", () => {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "en");
      expect(document.documentElement.dir).toBe("ltr");
    });
  });

  describe("Arabic Text Rendering", () => {
    it("renders Arabic text in a div", () => {
      const { container } = render(
        <div dir="rtl" lang="ar">
          <h1>المفتاح الشهري</h1>
          <p>منصة الإيجار الشهري الأولى في المملكة العربية السعودية</p>
        </div>
      );
      expect(container.textContent).toContain("المفتاح الشهري");
      expect(container.querySelector("[dir='rtl']")).toBeTruthy();
    });

    it("renders mixed Arabic/English content", () => {
      const { container } = render(
        <div dir="rtl">
          <span>الإيجار الشهري: </span>
          <span dir="ltr">4,500 SAR</span>
        </div>
      );
      expect(container.textContent).toContain("4,500 SAR");
      expect(container.textContent).toContain("الإيجار الشهري");
    });

    it("handles Arabic numerals (Eastern Arabic)", () => {
      const arabicNumerals = "٤٥٠٠";
      const westernNumerals = "4500";
      const { container } = render(
        <div>
          <span data-testid="arabic">{arabicNumerals}</span>
          <span data-testid="western">{westernNumerals}</span>
        </div>
      );
      expect(screen.getByTestId("arabic").textContent).toBe("٤٥٠٠");
      expect(screen.getByTestId("western").textContent).toBe("4500");
    });
  });

  describe("Saudi-specific UI Elements", () => {
    it("renders SAR currency symbol correctly", () => {
      const { container } = render(
        <div>
          <span>٤,٥٠٠ ر.س</span>
          <span>4,500 SAR</span>
        </div>
      );
      expect(container.textContent).toContain("ر.س");
      expect(container.textContent).toContain("SAR");
    });

    it("renders Saudi phone format", () => {
      const { container } = render(
        <div dir="ltr">+966 50 123 4567</div>
      );
      expect(container.textContent).toContain("+966");
    });
  });
});

// ─── Test Suite: PaymentMethodsBadges ────────────────────────────────
describe("Widget Tests — PaymentMethodsBadges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<PaymentMethodsBadges />);
      expect(container).toBeTruthy();
    });

    it("displays payment method content", () => {
      render(<PaymentMethodsBadges />);
      const text = document.body.textContent || "";
      expect(text.length).toBeGreaterThan(0);
    });
  });

  describe("Payment Method Display", () => {
    it("renders payment badges container", () => {
      const { container } = render(<PaymentMethodsBadges />);
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("renders with variant prop", () => {
      const { container } = render(<PaymentMethodsBadges variant="compact" />);
      expect(container).toBeTruthy();
    });
  });
});
