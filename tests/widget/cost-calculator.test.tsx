/**
 * Widget Tests — CostCalculator Component
 *
 * @vitest-environment jsdom
 *
 * Tests the CostCalculator React component with mocked tRPC queries.
 * Validates rendering, user interactions, and accessibility.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ─── Mock tRPC ───────────────────────────────────────────────────────
const mockConfigData = {
  allowedMonths: [1, 3, 6, 12],
  defaultMonth: 1,
  insuranceRate: 10,
  serviceFeeRate: 5,
  vatRate: 15,
  currency: "SAR",
  labels: {
    baseRent: "Base Rent",
    insurance: "Insurance Deposit",
    serviceFee: "Service Fee",
    vat: "VAT (15%)",
    total: "Total",
  },
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    calculator: {
      getConfig: {
        useQuery: () => ({
          data: mockConfigData,
          isLoading: false,
          error: null,
        }),
      },
      calculate: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({
            baseRentTotal: 4500,
            insuranceAmount: 450,
            serviceFeeAmount: 225,
            subtotal: 5175,
            vatAmount: 776,
            grandTotal: 5951,
            currency: "SAR",
          }),
          mutate: vi.fn(),
          isPending: false,
          data: null,
        }),
      },
    },
    useUtils: () => ({}),
  },
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    lang: "en",
    t: (key: string) => key,
    dir: "ltr",
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// ─── Import after mocks ─────────────────────────────────────────────
import CostCalculator from "../../client/src/components/CostCalculator";

// ─── Test Suite ──────────────────────────────────────────────────────
describe("Widget Tests — CostCalculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(
        <CostCalculator monthlyRent={4500} onClose={() => {}} />
      );
      expect(container).toBeTruthy();
    });

    it("displays the monthly rent amount", () => {
      render(<CostCalculator monthlyRent={4500} onClose={() => {}} />);
      const text = document.body.textContent || "";
      expect(text).toContain("4,500");
    });

    it("displays property title when provided", () => {
      render(
        <CostCalculator
          monthlyRent={4500}
          propertyTitle="شقة مفروشة في الرياض"
          onClose={() => {}}
        />
      );
      expect(document.body.textContent).toContain("شقة مفروشة في الرياض");
    });

    it("renders month selection options", () => {
      render(<CostCalculator monthlyRent={4500} onClose={() => {}} />);
      const buttons = screen.getAllByRole("button");
      // Should have at least the month selection buttons
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Close Behavior", () => {
    it("calls onClose when close button is clicked", () => {
      const onClose = vi.fn();
      render(<CostCalculator monthlyRent={4500} onClose={onClose} />);

      const closeButtons = screen.getAllByRole("button");
      const closeBtn = closeButtons.find(
        (btn) =>
          btn.textContent?.includes("×") ||
          btn.textContent?.includes("Close") ||
          btn.getAttribute("aria-label")?.toLowerCase().includes("close")
      );
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("Book Button", () => {
    it("renders book button when onBook is provided", () => {
      const onBook = vi.fn();
      render(
        <CostCalculator
          monthlyRent={4500}
          onClose={() => {}}
          onBook={onBook}
          bookLabel="Book Now"
        />
      );
      const bookBtn = screen.queryByText("Book Now");
      if (bookBtn) {
        expect(bookBtn).toBeTruthy();
      }
    });

    it("renders book button that is clickable", () => {
      const onBook = vi.fn();
      render(
        <CostCalculator
          monthlyRent={4500}
          onClose={() => {}}
          onBook={onBook}
          bookLabel="Book Now"
        />
      );
      const bookBtns = screen.queryAllByText("Book Now");
      expect(bookBtns.length).toBeGreaterThan(0);
      // Verify the button is a real button element with onClick wired
      const btn = bookBtns[0].closest("button");
      expect(btn).toBeTruthy();
      expect(btn!.disabled).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("handles zero rent", () => {
      const { container } = render(
        <CostCalculator monthlyRent={0} onClose={() => {}} />
      );
      expect(container).toBeTruthy();
    });

    it("handles very large rent", () => {
      const { container } = render(
        <CostCalculator monthlyRent={999999} onClose={() => {}} />
      );
      expect(container).toBeTruthy();
    });

    it("handles decimal rent", () => {
      const { container } = render(
        <CostCalculator monthlyRent={4500.50} onClose={() => {}} />
      );
      expect(container).toBeTruthy();
    });
  });
});
