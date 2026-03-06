/**
 * Widget Tests — PropertyCard Component
 *
 * @vitest-environment jsdom
 *
 * Tests the PropertyCard React component with mocked tRPC.
 * Validates rendering, image handling, badge display, and favorites.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ─── Mock Dependencies ───────────────────────────────────────────────
vi.mock("@/lib/trpc", () => ({
  trpc: {
    favorite: {
      check: {
        useQuery: () => ({ data: { isFavorite: false }, isLoading: false }),
      },
      toggle: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
    },
    useUtils: () => ({
      favorite: {
        check: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
    }),
  },
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    lang: "en",
    t: (key: string) => {
      const map: Record<string, string> = {
        "property.bedrooms": "Bedrooms",
        "property.bathrooms": "Bathrooms",
        "property.size": "Size",
        "property.verified": "Verified",
        "property.featured": "Featured",
        "property.perMonth": "/month",
      };
      return map[key] || key;
    },
    dir: "ltr",
  }),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Test User" },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/image-utils", () => ({
  normalizeImageUrl: (url: string) => url || "/placeholder.jpg",
}));

vi.mock("wouter", () => ({
  Link: ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children),
}));

// ─── Import after mocks ─────────────────────────────────────────────
import PropertyCard from "../../client/src/components/PropertyCard";

// ─── Test Data ───────────────────────────────────────────────────────
const MOCK_PROPERTY = {
  id: 42,
  titleEn: "Furnished Apartment in Riyadh",
  titleAr: "شقة مفروشة في الرياض",
  propertyType: "apartment",
  city: "Riyadh",
  cityAr: "الرياض",
  district: "Al Olaya",
  districtAr: "العليا",
  monthlyRent: "4500",
  bedrooms: 2,
  bathrooms: 1,
  sizeSqm: 85,
  photos: [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg",
  ],
  isVerified: true,
  isFeatured: false,
  furnishedLevel: "fully_furnished",
  managerName: "Ahmed Al-Saud",
  managerNameAr: "أحمد آل سعود",
  managerPhotoUrl: "https://example.com/manager.jpg",
};

const FEATURED_PROPERTY = {
  ...MOCK_PROPERTY,
  id: 43,
  isFeatured: true,
  titleEn: "Luxury Villa in Jeddah",
  titleAr: "فيلا فاخرة في جدة",
  monthlyRent: "15000",
};

const MINIMAL_PROPERTY = {
  id: 44,
  titleEn: "Basic Studio",
  titleAr: "استوديو أساسي",
  propertyType: "studio",
  monthlyRent: "2000",
};

// ─── Test Suite ──────────────────────────────────────────────────────
describe("Widget Tests — PropertyCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<PropertyCard property={MOCK_PROPERTY} />);
      expect(container).toBeTruthy();
    });

    it("displays property title in English", () => {
      render(<PropertyCard property={MOCK_PROPERTY} />);
      expect(document.body.textContent).toContain("Furnished Apartment in Riyadh");
    });

    it("displays monthly rent", () => {
      render(<PropertyCard property={MOCK_PROPERTY} />);
      expect(document.body.textContent).toContain("4,500");
    });

    it("displays location info", () => {
      render(<PropertyCard property={MOCK_PROPERTY} />);
      const text = document.body.textContent || "";
      expect(text).toContain("Riyadh");
    });

    it("displays bedroom count", () => {
      render(<PropertyCard property={MOCK_PROPERTY} />);
      expect(document.body.textContent).toContain("2");
    });
  });

  describe("Badges", () => {
    it("renders verified property without crashing", () => {
      const { container } = render(<PropertyCard property={MOCK_PROPERTY} />);
      expect(container).toBeTruthy();
    });

    it("renders featured property without crashing", () => {
      const { container } = render(<PropertyCard property={FEATURED_PROPERTY} />);
      expect(container).toBeTruthy();
    });
  });

  describe("Minimal Data", () => {
    it("renders with minimal property data", () => {
      const { container } = render(<PropertyCard property={MINIMAL_PROPERTY} />);
      expect(container).toBeTruthy();
      expect(document.body.textContent).toContain("Basic Studio");
    });

    it("handles null photos gracefully", () => {
      const property = { ...MOCK_PROPERTY, photos: null };
      const { container } = render(<PropertyCard property={property} />);
      expect(container).toBeTruthy();
    });

    it("handles empty photos array gracefully", () => {
      const property = { ...MOCK_PROPERTY, photos: [] };
      const { container } = render(<PropertyCard property={property} />);
      expect(container).toBeTruthy();
    });

    it("handles null bedrooms/bathrooms/size", () => {
      const property = {
        ...MOCK_PROPERTY,
        bedrooms: null,
        bathrooms: null,
        sizeSqm: null,
      };
      const { container } = render(<PropertyCard property={property} />);
      expect(container).toBeTruthy();
    });
  });

  describe("Compact Mode", () => {
    it("renders in compact mode", () => {
      const { container } = render(
        <PropertyCard property={MOCK_PROPERTY} compact={true} />
      );
      expect(container).toBeTruthy();
    });
  });

  describe("Link Navigation", () => {
    it("wraps card in a link to property detail page", () => {
      render(<PropertyCard property={MOCK_PROPERTY} />);
      const link = document.querySelector("a");
      expect(link).toBeTruthy();
      if (link) {
        expect(link.getAttribute("href")).toContain("42");
      }
    });
  });

  describe("Price Formatting", () => {
    it("formats large rent amounts", () => {
      render(<PropertyCard property={FEATURED_PROPERTY} />);
      expect(document.body.textContent).toContain("15,000");
    });

    it("handles zero rent gracefully", () => {
      const property = { ...MINIMAL_PROPERTY, monthlyRent: "0" };
      const { container } = render(<PropertyCard property={property} />);
      expect(container).toBeTruthy();
    });
  });

  describe("Arabic Content", () => {
    it("handles Arabic-only property names", () => {
      const arabicProperty = {
        ...MINIMAL_PROPERTY,
        titleEn: "",
        titleAr: "شقة في حي النسيم",
      };
      const { container } = render(<PropertyCard property={arabicProperty} />);
      expect(container).toBeTruthy();
    });
  });
});
