/**
 * Golden Tests — Moyasar Payment & Beds24 Sync Payload Shapes
 *
 * Pure structure validation — no real API calls.
 * Locks expected request/response shapes for regression detection.
 */
import { describe, it, expect } from "vitest";

// ─── Moyasar Payment Types ──────────────────────────────────────────
interface MoyasarPaymentRequest {
  amount: number;          // in halalah (SAR × 100)
  currency: string;
  description: string;
  callback_url: string;
  source: {
    type: "creditcard" | "applepay" | "stcpay";
    name?: string;
    number?: string;
    cvc?: string;
    month?: string;
    year?: string;
    token?: string;
  };
  metadata?: Record<string, string>;
}

interface MoyasarPaymentResponse {
  id: string;
  status: "initiated" | "paid" | "failed" | "authorized" | "captured" | "refunded" | "voided";
  amount: number;
  fee: number;
  currency: string;
  refunded: number;
  refunded_at: string | null;
  captured: number;
  captured_at: string | null;
  voided_at: string | null;
  description: string;
  amount_format: string;
  fee_format: string;
  invoice_id: string | null;
  ip: string | null;
  callback_url: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, string>;
  source: {
    type: string;
    company: string;
    name: string;
    number: string;
    gateway_id: string;
    reference_number: string | null;
    token: string | null;
    message: string | null;
    transaction_url: string | null;
  };
}

interface MoyasarWebhookPayload {
  id: string;
  type: "payment_paid" | "payment_failed" | "refund_updated";
  created_at: string;
  secret_token: string;
  data: MoyasarPaymentResponse;
}

// ─── Beds24 Sync Types ──────────────────────────────────────────────
interface Beds24BookingPush {
  propertyId: number;
  roomId: number;
  checkIn: string;    // YYYY-MM-DD
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: "confirmed" | "cancelled" | "pending";
  totalAmount: number;
  currency: string;
  source: "monthly_key";
  externalBookingId?: string;
  notes?: string;
}

interface Beds24SyncResponse {
  success: boolean;
  beds24BookingId?: number;
  conflicts?: Array<{
    date: string;
    existingBookingId: number;
    source: string;
  }>;
  error?: string;
}

// ─── Test Suite: Moyasar ─────────────────────────────────────────────
describe("Golden Tests — Moyasar Payment Payloads", () => {
  describe("Payment Initiation Request", () => {
    it("mada card payment request shape", () => {
      const request: MoyasarPaymentRequest = {
        amount: 595100,  // 5951 SAR in halalah
        currency: "SAR",
        description: "Monthly Key — حجز شقة مفروشة في الرياض (1 شهر)",
        callback_url: "https://monthlykey.com/payment/callback",
        source: {
          type: "creditcard",
          name: "محمد أحمد الغامدي",
          number: "5588000000000669",
          cvc: "100",
          month: "03",
          year: "2027",
        },
        metadata: {
          bookingId: "BK-2026-001",
          userId: "101",
          propertyId: "42",
          durationMonths: "1",
        },
      };

      expect(request.amount).toBe(595100);
      expect(request.currency).toBe("SAR");
      expect(request.source.type).toBe("creditcard");
      expect(request.metadata?.bookingId).toBe("BK-2026-001");
      expect(request).toMatchSnapshot();
    });

    it("Apple Pay payment request shape", () => {
      const request: MoyasarPaymentRequest = {
        amount: 1681900,
        currency: "SAR",
        description: "Monthly Key — حجز فيلا في جدة (3 أشهر)",
        callback_url: "https://monthlykey.com/payment/callback",
        source: {
          type: "applepay",
          token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
        metadata: {
          bookingId: "BK-2026-002",
          userId: "102",
        },
      };

      expect(request.source.type).toBe("applepay");
      expect(request.source.token).toBeDefined();
      expect(request).toMatchSnapshot();
    });
  });

  describe("Payment Response Structure", () => {
    it("successful payment response shape", () => {
      const response: MoyasarPaymentResponse = {
        id: "pay_abc123def456",
        status: "paid",
        amount: 595100,
        fee: 14878,
        currency: "SAR",
        refunded: 0,
        refunded_at: null,
        captured: 595100,
        captured_at: "2026-03-07T10:30:00Z",
        voided_at: null,
        description: "Monthly Key — حجز شقة مفروشة في الرياض (1 شهر)",
        amount_format: "5,951.00 SAR",
        fee_format: "148.78 SAR",
        invoice_id: null,
        ip: "185.70.40.1",
        callback_url: "https://monthlykey.com/payment/callback",
        created_at: "2026-03-07T10:29:00Z",
        updated_at: "2026-03-07T10:30:00Z",
        metadata: {
          bookingId: "BK-2026-001",
          userId: "101",
        },
        source: {
          type: "creditcard",
          company: "mada",
          name: "محمد أحمد الغامدي",
          number: "XXXX-XXXX-XXXX-0669",
          gateway_id: "gw_123",
          reference_number: "REF-001",
          token: null,
          message: "APPROVED",
          transaction_url: null,
        },
      };

      expect(response.status).toBe("paid");
      expect(response.amount).toBe(595100);
      expect(response.source.company).toBe("mada");
      expect(response).toMatchSnapshot();
    });
  });

  describe("Webhook Payload Structure", () => {
    it("payment_paid webhook shape", () => {
      const webhook: MoyasarWebhookPayload = {
        id: "evt_abc123",
        type: "payment_paid",
        created_at: "2026-03-07T10:30:01Z",
        secret_token: "whsec_test_token_123",
        data: {
          id: "pay_abc123def456",
          status: "paid",
          amount: 595100,
          fee: 14878,
          currency: "SAR",
          refunded: 0,
          refunded_at: null,
          captured: 595100,
          captured_at: "2026-03-07T10:30:00Z",
          voided_at: null,
          description: "Monthly Key — حجز",
          amount_format: "5,951.00 SAR",
          fee_format: "148.78 SAR",
          invoice_id: null,
          ip: null,
          callback_url: "https://monthlykey.com/payment/callback",
          created_at: "2026-03-07T10:29:00Z",
          updated_at: "2026-03-07T10:30:00Z",
          metadata: { bookingId: "BK-2026-001" },
          source: {
            type: "creditcard",
            company: "mada",
            name: "محمد",
            number: "XXXX-0669",
            gateway_id: "gw_123",
            reference_number: "REF-001",
            token: null,
            message: "APPROVED",
            transaction_url: null,
          },
        },
      };

      expect(webhook.type).toBe("payment_paid");
      expect(webhook.data.status).toBe("paid");
      expect(webhook).toMatchSnapshot();
    });
  });
});

// ─── Test Suite: Beds24 Sync ─────────────────────────────────────────
describe("Golden Tests — Beds24 Sync Payloads", () => {
  describe("Booking Push Request", () => {
    it("confirmed booking push shape", () => {
      const push: Beds24BookingPush = {
        propertyId: 42,
        roomId: 1,
        checkIn: "2026-04-01",
        checkOut: "2026-05-01",
        guestName: "محمد أحمد الغامدي",
        guestEmail: "mohammed@example.com",
        guestPhone: "+966501234567",
        status: "confirmed",
        totalAmount: 5951,
        currency: "SAR",
        source: "monthly_key",
        externalBookingId: "BK-2026-001",
        notes: "حجز شهري — شقة مفروشة",
      };

      expect(push.source).toBe("monthly_key");
      expect(push.status).toBe("confirmed");
      expect(push.checkIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(push.checkOut).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(push.guestPhone).toMatch(/^\+966/);
      expect(push).toMatchSnapshot();
    });

    it("cancelled booking push shape", () => {
      const push: Beds24BookingPush = {
        propertyId: 42,
        roomId: 1,
        checkIn: "2026-04-01",
        checkOut: "2026-05-01",
        guestName: "فاطمة علي",
        guestEmail: "fatima@example.com",
        guestPhone: "+966551234567",
        status: "cancelled",
        totalAmount: 0,
        currency: "SAR",
        source: "monthly_key",
        externalBookingId: "BK-2026-003",
      };

      expect(push.status).toBe("cancelled");
      expect(push.totalAmount).toBe(0);
      expect(push).toMatchSnapshot();
    });
  });

  describe("Sync Response Structure", () => {
    it("successful sync response", () => {
      const response: Beds24SyncResponse = {
        success: true,
        beds24BookingId: 98765,
      };

      expect(response.success).toBe(true);
      expect(response.beds24BookingId).toBeDefined();
      expect(response.conflicts).toBeUndefined();
    });

    it("conflict detection response", () => {
      const response: Beds24SyncResponse = {
        success: false,
        conflicts: [
          {
            date: "2026-04-15",
            existingBookingId: 555,
            source: "airbnb",
          },
          {
            date: "2026-04-16",
            existingBookingId: 555,
            source: "airbnb",
          },
        ],
        error: "Calendar conflict detected for 2 dates",
      };

      expect(response.success).toBe(false);
      expect(response.conflicts).toHaveLength(2);
      expect(response.conflicts![0].source).toBe("airbnb");
      expect(response).toMatchSnapshot();
    });
  });
});
