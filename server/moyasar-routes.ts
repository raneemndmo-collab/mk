/**
 * Moyasar Payment Routes — Server-side payment processing
 * 
 * Handles:
 * - POST /api/payments/create — Create a new payment (wallet top-up or booking)
 * - POST /api/payments/callback — Moyasar callback after payment completion
 * - POST /api/payments/webhook — Moyasar webhook for async payment status updates
 * - GET  /api/payments/verify/:id — Verify payment status from Moyasar
 * - GET  /api/wallet/balance — Get user's wallet balance
 * - GET  /api/wallet/transactions — Get user's wallet transaction history
 * 
 * Environment variables required:
 * - MOYASAR_SECRET_KEY — Moyasar secret API key (sk_test_... or sk_live_...)
 * - MOYASAR_PUBLISHABLE_KEY — Moyasar publishable API key (pk_test_... or pk_live_...)
 * - SUPABASE_URL — Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY — Supabase service role key for admin operations
 */

import type { Express, Request, Response } from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// ─── Configuration ───
const MOYASAR_API_BASE = "https://api.moyasar.com/v1";

function getMoyasarSecretKey(): string {
  return process.env.MOYASAR_SECRET_KEY || "";
}

function getMoyasarPublishableKey(): string {
  return process.env.MOYASAR_PUBLISHABLE_KEY || "";
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || "https://wspwewmnucqihnhcaqxk.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key) {
    console.warn("[Moyasar] SUPABASE_SERVICE_ROLE_KEY not set — wallet operations will use anon key");
    // Fallback to anon key for development
    const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcHdld21udWNxaWhuaGNhcXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTQ1MzEsImV4cCI6MjA4ODQ3MDUzMX0.JYy3sOXfWtcqB8uNz9dAiqHJBXfHblhoQEfVUvoeDL4";
    return createClient(url, anonKey);
  }
  return createClient(url, key);
}

// ─── Moyasar API Helpers ───

interface MoyasarPaymentSource {
  type: "creditcard" | "mada" | "applepay" | "stcpay";
  name?: string;
  number?: string;
  cvc?: string;
  month?: string;
  year?: string;
  token?: string;
}

interface CreatePaymentParams {
  amount: number; // in halalas (smallest unit, e.g., 10000 = 100 SAR)
  currency?: string;
  description: string;
  callback_url: string;
  source: MoyasarPaymentSource;
  metadata?: Record<string, string>;
}

async function createMoyasarPayment(params: CreatePaymentParams) {
  const secretKey = getMoyasarSecretKey();
  if (!secretKey) {
    throw new Error("MOYASAR_SECRET_KEY not configured. Please add your Moyasar API key.");
  }

  const response = await axios.post(
    `${MOYASAR_API_BASE}/payments`,
    params,
    {
      auth: { username: secretKey, password: "" },
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    }
  );
  return response.data;
}

async function fetchMoyasarPayment(paymentId: string) {
  const secretKey = getMoyasarSecretKey();
  if (!secretKey) {
    throw new Error("MOYASAR_SECRET_KEY not configured");
  }

  const response = await axios.get(
    `${MOYASAR_API_BASE}/payments/${paymentId}`,
    {
      auth: { username: secretKey, password: "" },
      timeout: 15000,
    }
  );
  return response.data;
}

// ─── Supabase Wallet Helpers ───

async function getWalletBalance(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("type, amount, status")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) {
    console.error("[Wallet] Error fetching balance:", error.message);
    return 0;
  }

  let balance = 0;
  for (const tx of data || []) {
    const amount = parseFloat(tx.amount);
    if (tx.type === "topup" || tx.type === "refund") {
      balance += amount;
    } else if (tx.type === "payment") {
      balance -= amount;
    }
  }
  return Math.max(0, balance);
}

async function getWalletTransactions(userId: string, limit = 50, offset = 0) {
  const supabase = getSupabaseAdmin();
  const { data, error, count } = await supabase
    .from("wallet_transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[Wallet] Error fetching transactions:", error.message);
    return { transactions: [], total: 0 };
  }

  return { transactions: data || [], total: count || 0 };
}

async function createWalletTransaction(params: {
  userId: string;
  type: "topup" | "payment" | "refund";
  amount: number;
  status?: string;
  moyasarPaymentId?: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: params.userId,
      type: params.type,
      amount: params.amount,
      status: params.status || "pending",
      moyasar_payment_id: params.moyasarPaymentId || null,
      description: params.description || null,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("[Wallet] Error creating transaction:", error.message);
    throw error;
  }
  return data;
}

async function updateWalletTransaction(transactionId: string, updates: {
  status?: string;
  moyasarPaymentId?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .update({
      ...updates,
      moyasar_payment_id: updates.moyasarPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .select()
    .single();

  if (error) {
    console.error("[Wallet] Error updating transaction:", error.message);
    throw error;
  }
  return data;
}

// ─── Payment Record Helpers ───

async function createPaymentRecord(params: {
  userId: string;
  propertyId: number;
  bookingId?: string;
  amount: number;
  paymentMethod?: string;
  moyasarPaymentId?: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: params.userId,
      property_id: params.propertyId,
      booking_id: params.bookingId || null,
      amount: params.amount,
      payment_method: params.paymentMethod || null,
      moyasar_payment_id: params.moyasarPaymentId || null,
      description: params.description || null,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("[Payments] Error creating payment record:", error.message);
    throw error;
  }
  return data;
}

async function updatePaymentRecord(paymentId: string, updates: {
  status?: string;
  moyasarPaymentId?: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = getSupabaseAdmin();
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.status) updateData.status = updates.status;
  if (updates.moyasarPaymentId) updateData.moyasar_payment_id = updates.moyasarPaymentId;
  if (updates.paymentMethod) updateData.payment_method = updates.paymentMethod;
  if (updates.metadata) updateData.metadata = updates.metadata;

  const { data, error } = await supabase
    .from("payments")
    .update(updateData)
    .eq("id", paymentId)
    .select()
    .single();

  if (error) {
    console.error("[Payments] Error updating payment record:", error.message);
    throw error;
  }
  return data;
}

// ─── Auth Middleware (extract user from Supabase JWT) ───

async function extractUser(req: Request): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return { id: user.id, email: user.email || "" };
}

// ─── Route Registration ───

export function registerMoyasarRoutes(app: Express) {
  // GET /api/payments/config — Return publishable key for frontend
  app.get("/api/payments/config", (_req: Request, res: Response) => {
    const publishableKey = getMoyasarPublishableKey();
    const isConfigured = !!publishableKey && !!getMoyasarSecretKey();
    res.json({
      publishable_key: publishableKey,
      is_configured: isConfigured,
      supported_methods: ["creditcard", "mada", "applepay", "stcpay"],
      currency: "SAR",
    });
  });

  // POST /api/payments/create — Create a payment (wallet top-up or booking)
  app.post("/api/payments/create", async (req: Request, res: Response) => {
    try {
      const user = await extractUser(req);
      if (!user) {
        return res.status(401).json({ error: "غير مصرح. يرجى تسجيل الدخول." });
      }

      const { type, amount, propertyId, bookingId, paymentMethod, callbackUrl } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "المبلغ غير صالح" });
      }

      if (!type || !["topup", "booking"].includes(type)) {
        return res.status(400).json({ error: "نوع الدفع غير صالح" });
      }

      // Check if Moyasar is configured
      if (!getMoyasarSecretKey()) {
        // Create pending record without Moyasar (for when keys aren't set yet)
        if (type === "topup") {
          const tx = await createWalletTransaction({
            userId: user.id,
            type: "topup",
            amount,
            status: "pending",
            description: `شحن المحفظة - ${amount} ر.س`,
            metadata: { payment_method: paymentMethod || "pending" },
          });
          return res.json({
            success: true,
            pending_configuration: true,
            transaction_id: tx.id,
            message: "تم إنشاء طلب الشحن. بوابة الدفع Moyasar غير مفعلة بعد.",
          });
        } else {
          const payment = await createPaymentRecord({
            userId: user.id,
            propertyId: propertyId || 0,
            bookingId,
            amount,
            paymentMethod,
            description: `دفع حجز - ${amount} ر.س`,
          });
          return res.json({
            success: true,
            pending_configuration: true,
            payment_id: payment.id,
            message: "تم إنشاء طلب الدفع. بوابة الدفع Moyasar غير مفعلة بعد.",
          });
        }
      }

      // Create Moyasar payment
      const amountInHalalas = Math.round(amount * 100);
      const description = type === "topup"
        ? `شحن محفظة المفتاح الشهري - ${amount} ر.س`
        : `دفع حجز عقار #${propertyId} - ${amount} ر.س`;

      const origin = req.headers.origin || req.headers.referer || "";
      const callback = callbackUrl || `${origin}/payment/callback`;

      // Create a pending record first
      let recordId: string;
      if (type === "topup") {
        const tx = await createWalletTransaction({
          userId: user.id,
          type: "topup",
          amount,
          status: "pending",
          description,
        });
        recordId = tx.id;
      } else {
        const payment = await createPaymentRecord({
          userId: user.id,
          propertyId: propertyId || 0,
          bookingId,
          amount,
          paymentMethod,
          description,
        });
        recordId = payment.id;
      }

      // Return payment form data for frontend to render Moyasar form
      res.json({
        success: true,
        payment_data: {
          amount: amountInHalalas,
          currency: "SAR",
          description,
          publishable_key: getMoyasarPublishableKey(),
          callback_url: callback,
          metadata: {
            type,
            record_id: recordId,
            user_id: user.id,
            property_id: propertyId?.toString() || "",
            booking_id: bookingId || "",
          },
        },
        record_id: recordId,
      });
    } catch (error: any) {
      console.error("[Payments] Create error:", error?.message);
      res.status(500).json({ error: "فشل في إنشاء عملية الدفع", details: error?.message });
    }
  });

  // POST /api/payments/callback — Handle Moyasar payment callback
  app.post("/api/payments/callback", async (req: Request, res: Response) => {
    try {
      const { id: moyasarPaymentId, status, metadata } = req.body;

      if (!moyasarPaymentId) {
        return res.status(400).json({ error: "Missing payment ID" });
      }

      // Verify payment with Moyasar
      const moyasarPayment = await fetchMoyasarPayment(moyasarPaymentId);
      const paymentStatus = moyasarPayment.status;
      const type = metadata?.type || moyasarPayment.metadata?.type;
      const recordId = metadata?.record_id || moyasarPayment.metadata?.record_id;

      if (!recordId) {
        return res.status(400).json({ error: "Missing record ID in metadata" });
      }

      const dbStatus = paymentStatus === "paid" ? "completed" : "failed";

      if (type === "topup") {
        await updateWalletTransaction(recordId, {
          status: dbStatus,
          moyasarPaymentId: moyasarPaymentId,
          metadata: { moyasar_status: paymentStatus, ...moyasarPayment },
        });
      } else {
        await updatePaymentRecord(recordId, {
          status: paymentStatus === "paid" ? "paid" : "failed",
          moyasarPaymentId: moyasarPaymentId,
          paymentMethod: moyasarPayment.source?.type,
          metadata: { moyasar_status: paymentStatus, ...moyasarPayment },
        });

        // If booking payment succeeded, also create a wallet deduction record
        if (paymentStatus === "paid") {
          const amountSAR = moyasarPayment.amount / 100;
          await createWalletTransaction({
            userId: metadata?.user_id || moyasarPayment.metadata?.user_id,
            type: "payment",
            amount: amountSAR,
            status: "completed",
            moyasarPaymentId,
            description: `دفع حجز - ${amountSAR} ر.س`,
            metadata: { payment_record_id: recordId },
          });
        }
      }

      res.json({ success: true, status: dbStatus });
    } catch (error: any) {
      console.error("[Payments] Callback error:", error?.message);
      res.status(500).json({ error: "Callback processing failed", details: error?.message });
    }
  });

  // POST /api/payments/webhook — Moyasar webhook for async status updates
  app.post("/api/payments/webhook", async (req: Request, res: Response) => {
    try {
      const { id: moyasarPaymentId, type: eventType, data: paymentData } = req.body;

      console.log(`[Webhook] Received event: ${eventType} for payment ${moyasarPaymentId}`);

      if (!paymentData?.id) {
        return res.status(200).json({ received: true }); // Acknowledge but skip
      }

      // Verify payment with Moyasar
      const moyasarPayment = await fetchMoyasarPayment(paymentData.id);
      const recordType = moyasarPayment.metadata?.type;
      const recordId = moyasarPayment.metadata?.record_id;

      if (!recordId) {
        return res.status(200).json({ received: true });
      }

      const paymentStatus = moyasarPayment.status;
      const dbStatus = paymentStatus === "paid" ? "completed" : paymentStatus === "failed" ? "failed" : "pending";

      if (recordType === "topup") {
        await updateWalletTransaction(recordId, {
          status: dbStatus,
          moyasarPaymentId: paymentData.id,
          metadata: { webhook_event: eventType, moyasar_status: paymentStatus },
        });
      } else {
        await updatePaymentRecord(recordId, {
          status: paymentStatus === "paid" ? "paid" : paymentStatus === "failed" ? "failed" : "pending",
          moyasarPaymentId: paymentData.id,
          paymentMethod: moyasarPayment.source?.type,
          metadata: { webhook_event: eventType, moyasar_status: paymentStatus },
        });
      }

      res.status(200).json({ received: true, status: dbStatus });
    } catch (error: any) {
      console.error("[Webhook] Error:", error?.message);
      // Always return 200 to prevent Moyasar from retrying
      res.status(200).json({ received: true, error: error?.message });
    }
  });

  // GET /api/payments/verify/:moyasarId — Verify a specific payment
  app.get("/api/payments/verify/:moyasarId", async (req: Request, res: Response) => {
    try {
      const user = await extractUser(req);
      if (!user) {
        return res.status(401).json({ error: "غير مصرح" });
      }

      const { moyasarId } = req.params;
      if (!getMoyasarSecretKey()) {
        return res.json({ status: "pending", message: "Moyasar not configured" });
      }

      const payment = await fetchMoyasarPayment(moyasarId);
      res.json({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        source_type: payment.source?.type,
        created_at: payment.created_at,
      });
    } catch (error: any) {
      console.error("[Payments] Verify error:", error?.message);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // GET /api/wallet/balance — Get wallet balance
  app.get("/api/wallet/balance", async (req: Request, res: Response) => {
    try {
      const user = await extractUser(req);
      if (!user) {
        return res.status(401).json({ error: "غير مصرح" });
      }

      const balance = await getWalletBalance(user.id);
      res.json({ balance, currency: "SAR" });
    } catch (error: any) {
      console.error("[Wallet] Balance error:", error?.message);
      res.status(500).json({ error: "Failed to get wallet balance" });
    }
  });

  // GET /api/wallet/transactions — Get wallet transaction history
  app.get("/api/wallet/transactions", async (req: Request, res: Response) => {
    try {
      const user = await extractUser(req);
      if (!user) {
        return res.status(401).json({ error: "غير مصرح" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { transactions, total } = await getWalletTransactions(user.id, limit, offset);
      res.json({ transactions, total, currency: "SAR" });
    } catch (error: any) {
      console.error("[Wallet] Transactions error:", error?.message);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // GET /api/payments/history — Get payment history for bookings
  app.get("/api/payments/history", async (req: Request, res: Response) => {
    try {
      const user = await extractUser(req);
      if (!user) {
        return res.status(401).json({ error: "غير مصرح" });
      }

      const supabase = getSupabaseAdmin();
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { data, error, count } = await supabase
        .from("payments")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.json({ payments: data || [], total: count || 0 });
    } catch (error: any) {
      console.error("[Payments] History error:", error?.message);
      res.status(500).json({ error: "Failed to get payment history" });
    }
  });

  console.log("[Moyasar] Payment routes registered: /api/payments/*, /api/wallet/*");
}
