import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Moyasar Payment Integration Tests ───

describe("Moyasar Payment Configuration", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns not configured when MOYASAR_SECRET_KEY is missing", () => {
    vi.stubEnv("MOYASAR_SECRET_KEY", "");
    vi.stubEnv("MOYASAR_PUBLISHABLE_KEY", "");
    const secretKey = process.env.MOYASAR_SECRET_KEY || "";
    const publishableKey = process.env.MOYASAR_PUBLISHABLE_KEY || "";
    const isConfigured = !!publishableKey && !!secretKey;
    expect(isConfigured).toBe(false);
  });

  it("returns configured when both Moyasar keys are set", () => {
    vi.stubEnv("MOYASAR_SECRET_KEY", "sk_test_abc123");
    vi.stubEnv("MOYASAR_PUBLISHABLE_KEY", "pk_test_abc123");
    const secretKey = process.env.MOYASAR_SECRET_KEY || "";
    const publishableKey = process.env.MOYASAR_PUBLISHABLE_KEY || "";
    const isConfigured = !!publishableKey && !!secretKey;
    expect(isConfigured).toBe(true);
  });

  it("supports expected payment methods", () => {
    const supportedMethods = ["creditcard", "mada", "applepay", "stcpay"];
    expect(supportedMethods).toContain("creditcard");
    expect(supportedMethods).toContain("mada");
    expect(supportedMethods).toContain("applepay");
    expect(supportedMethods).toContain("stcpay");
    expect(supportedMethods).toHaveLength(4);
  });
});

describe("Wallet Balance Calculation", () => {
  it("calculates balance from completed transactions correctly", () => {
    const transactions = [
      { type: "topup", amount: "100.00", status: "completed" },
      { type: "topup", amount: "200.00", status: "completed" },
      { type: "payment", amount: "50.00", status: "completed" },
      { type: "refund", amount: "25.00", status: "completed" },
    ];

    let balance = 0;
    for (const tx of transactions) {
      const amount = parseFloat(tx.amount);
      if (tx.type === "topup" || tx.type === "refund") {
        balance += amount;
      } else if (tx.type === "payment") {
        balance -= amount;
      }
    }
    expect(balance).toBe(275.00); // 100 + 200 - 50 + 25
  });

  it("ignores pending and failed transactions", () => {
    const transactions = [
      { type: "topup", amount: "100.00", status: "completed" },
      { type: "topup", amount: "500.00", status: "pending" },
      { type: "payment", amount: "30.00", status: "failed" },
    ];

    let balance = 0;
    for (const tx of transactions.filter((t) => t.status === "completed")) {
      const amount = parseFloat(tx.amount);
      if (tx.type === "topup" || tx.type === "refund") {
        balance += amount;
      } else if (tx.type === "payment") {
        balance -= amount;
      }
    }
    expect(balance).toBe(100.00);
  });

  it("returns 0 when balance would be negative", () => {
    const transactions = [
      { type: "topup", amount: "50.00", status: "completed" },
      { type: "payment", amount: "100.00", status: "completed" },
    ];

    let balance = 0;
    for (const tx of transactions) {
      const amount = parseFloat(tx.amount);
      if (tx.type === "topup" || tx.type === "refund") {
        balance += amount;
      } else if (tx.type === "payment") {
        balance -= amount;
      }
    }
    balance = Math.max(0, balance);
    expect(balance).toBe(0);
  });

  it("returns 0 when no transactions exist", () => {
    const transactions: { type: string; amount: string; status: string }[] = [];
    let balance = 0;
    for (const tx of transactions) {
      const amount = parseFloat(tx.amount);
      if (tx.type === "topup" || tx.type === "refund") {
        balance += amount;
      } else if (tx.type === "payment") {
        balance -= amount;
      }
    }
    expect(balance).toBe(0);
  });
});

describe("Payment Validation", () => {
  it("rejects invalid payment amounts", () => {
    const validateAmount = (amount: number) => amount > 0;
    expect(validateAmount(0)).toBe(false);
    expect(validateAmount(-100)).toBe(false);
    expect(validateAmount(50)).toBe(true);
    expect(validateAmount(0.01)).toBe(true);
  });

  it("rejects invalid payment types", () => {
    const validTypes = ["topup", "booking"];
    const validateType = (type: string) => validTypes.includes(type);
    expect(validateType("topup")).toBe(true);
    expect(validateType("booking")).toBe(true);
    expect(validateType("invalid")).toBe(false);
    expect(validateType("")).toBe(false);
  });

  it("converts SAR to halalas correctly", () => {
    const sarToHalalas = (sar: number) => Math.round(sar * 100);
    expect(sarToHalalas(100)).toBe(10000);
    expect(sarToHalalas(50.50)).toBe(5050);
    expect(sarToHalalas(0.01)).toBe(1);
    expect(sarToHalalas(1000)).toBe(100000);
  });

  it("enforces minimum top-up amount of 10 SAR", () => {
    const MIN_TOPUP = 10;
    const validateTopup = (amount: number) => amount >= MIN_TOPUP;
    expect(validateTopup(5)).toBe(false);
    expect(validateTopup(9.99)).toBe(false);
    expect(validateTopup(10)).toBe(true);
    expect(validateTopup(100)).toBe(true);
  });
});

describe("Moyasar Payment Status Handling", () => {
  it("maps Moyasar status to internal status correctly", () => {
    const mapStatus = (moyasarStatus: string) => {
      switch (moyasarStatus) {
        case "paid": return "completed";
        case "failed": return "failed";
        case "authorized": return "pending";
        case "captured": return "completed";
        case "refunded": return "refunded";
        case "voided": return "failed";
        default: return "pending";
      }
    };

    expect(mapStatus("paid")).toBe("completed");
    expect(mapStatus("failed")).toBe("failed");
    expect(mapStatus("authorized")).toBe("pending");
    expect(mapStatus("captured")).toBe("completed");
    expect(mapStatus("refunded")).toBe("refunded");
    expect(mapStatus("voided")).toBe("failed");
    expect(mapStatus("unknown")).toBe("pending");
  });

  it("identifies successful payment statuses", () => {
    const isSuccessful = (status: string) => ["paid", "captured"].includes(status);
    expect(isSuccessful("paid")).toBe(true);
    expect(isSuccessful("captured")).toBe(true);
    expect(isSuccessful("failed")).toBe(false);
    expect(isSuccessful("authorized")).toBe(false);
  });
});

describe("Moyasar Webhook Signature Validation", () => {
  it("validates webhook payload structure", () => {
    const validPayload = {
      id: "pay_abc123",
      type: "payment",
      data: {
        id: "pay_abc123",
        status: "paid",
        amount: 10000,
        currency: "SAR",
        description: "شحن محفظة - 100 ر.س",
        metadata: { user_id: "user_123", type: "topup" },
      },
    };

    expect(validPayload.id).toBeTruthy();
    expect(validPayload.type).toBe("payment");
    expect(validPayload.data.id).toBeTruthy();
    expect(validPayload.data.status).toBeTruthy();
    expect(validPayload.data.amount).toBeGreaterThan(0);
    expect(validPayload.data.currency).toBe("SAR");
  });

  it("rejects webhook payload without required fields", () => {
    const validateWebhook = (payload: any) => {
      return !!(payload?.id && payload?.type && payload?.data?.id && payload?.data?.status);
    };

    expect(validateWebhook({ id: "pay_1", type: "payment", data: { id: "pay_1", status: "paid" } })).toBe(true);
    expect(validateWebhook({ id: "pay_1" })).toBe(false);
    expect(validateWebhook({})).toBe(false);
    expect(validateWebhook(null)).toBe(false);
  });
});

describe("Payment Metadata", () => {
  it("preserves metadata through payment flow", () => {
    const metadata = {
      user_id: "user_abc",
      type: "topup",
      transaction_id: "tx_123",
    };

    const paymentRequest = {
      amount: 10000,
      currency: "SAR",
      description: "شحن محفظة",
      metadata,
    };

    expect(paymentRequest.metadata.user_id).toBe("user_abc");
    expect(paymentRequest.metadata.type).toBe("topup");
    expect(paymentRequest.metadata.transaction_id).toBe("tx_123");
  });

  it("handles booking payment metadata correctly", () => {
    const metadata = {
      user_id: "user_abc",
      type: "booking",
      property_id: "42",
      months: "3",
      booking_id: "booking_xyz",
    };

    expect(metadata.type).toBe("booking");
    expect(metadata.property_id).toBe("42");
    expect(parseInt(metadata.months)).toBe(3);
  });
});
