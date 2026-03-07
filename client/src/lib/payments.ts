/**
 * Frontend Payment Service — Moyasar Integration
 * 
 * Handles:
 * - Payment configuration check
 * - Wallet top-up requests
 * - Booking payment requests
 * - Wallet balance and transaction history
 * - Moyasar payment form initialization
 */

import { supabase } from "./supabase";

const API_BASE = "/api";

// ─── Auth Helper ───
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("غير مصرح. يرجى تسجيل الدخول.");
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  };
}

// ─── Payment Config ───
export interface PaymentConfig {
  publishable_key: string;
  is_configured: boolean;
  supported_methods: string[];
  currency: string;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const res = await fetch(`${API_BASE}/payments/config`);
  if (!res.ok) throw new Error("Failed to get payment config");
  return res.json();
}

// ─── Wallet ───
export interface WalletBalance {
  balance: number;
  currency: string;
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/wallet/balance`, { headers });
  if (!res.ok) {
    if (res.status === 401) throw new Error("غير مصرح");
    throw new Error("فشل في تحميل رصيد المحفظة");
  }
  return res.json();
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: "topup" | "payment" | "refund";
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  moyasar_payment_id: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
  currency: string;
}

export async function getWalletTransactions(limit = 50, offset = 0): Promise<WalletTransactionsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/wallet/transactions?limit=${limit}&offset=${offset}`, { headers });
  if (!res.ok) throw new Error("فشل في تحميل سجل المعاملات");
  return res.json();
}

// ─── Payment Creation ───
export interface CreatePaymentRequest {
  type: "topup" | "booking";
  amount: number;
  propertyId?: number;
  bookingId?: string;
  paymentMethod?: string;
  callbackUrl?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  pending_configuration?: boolean;
  transaction_id?: string;
  payment_id?: string;
  record_id?: string;
  message?: string;
  payment_data?: {
    amount: number;
    currency: string;
    description: string;
    publishable_key: string;
    callback_url: string;
    metadata: Record<string, string>;
  };
}

export async function createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/payments/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "فشل في إنشاء عملية الدفع" }));
    throw new Error(error.error || "فشل في إنشاء عملية الدفع");
  }
  return res.json();
}

// ─── Payment Verification ───
export async function verifyPayment(moyasarId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/payments/verify/${moyasarId}`, { headers });
  if (!res.ok) throw new Error("فشل في التحقق من الدفع");
  return res.json();
}

// ─── Payment History ───
export interface PaymentRecord {
  id: string;
  user_id: string;
  property_id: number;
  booking_id: string | null;
  amount: string;
  currency: string;
  status: string;
  payment_method: string | null;
  moyasar_payment_id: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function getPaymentHistory(limit = 50, offset = 0) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/payments/history?limit=${limit}&offset=${offset}`, { headers });
  if (!res.ok) throw new Error("فشل في تحميل سجل المدفوعات");
  return res.json();
}

// ─── Moyasar Form Helper ───

/**
 * Initialize Moyasar payment form
 * This loads the Moyasar JS SDK and renders the payment form
 * 
 * Usage:
 * 1. Add <div id="moyasar-form"></div> to your component
 * 2. Call initMoyasarForm(paymentData) with the data from createPayment()
 * 3. Moyasar handles the rest (3D Secure, Apple Pay, etc.)
 */
export function loadMoyasarScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).Moyasar) {
      resolve();
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Moyasar SDK"));
    document.head.appendChild(script);
  });
}

export interface MoyasarFormConfig {
  element: string; // CSS selector for the form container
  amount: number; // in halalas
  currency: string;
  description: string;
  publishable_api_key: string;
  callback_url: string;
  methods: string[];
  metadata?: Record<string, string>;
  on_completed?: (payment: any) => void;
  on_failure?: (error: any) => void;
}

export async function initMoyasarForm(config: MoyasarFormConfig): Promise<any> {
  await loadMoyasarScript();

  const Moyasar = (window as any).Moyasar;
  if (!Moyasar) {
    throw new Error("Moyasar SDK not loaded");
  }

  return Moyasar.init({
    element: config.element,
    amount: config.amount,
    currency: config.currency || "SAR",
    description: config.description,
    publishable_api_key: config.publishable_api_key,
    callback_url: config.callback_url,
    methods: config.methods || ["creditcard", "mada", "applepay", "stcpay"],
    metadata: config.metadata || {},
    on_completed: config.on_completed,
    on_failure: config.on_failure,
  });
}

// ─── Wallet Top-up with Moyasar ───

export async function initiateWalletTopup(amount: number): Promise<CreatePaymentResponse> {
  const callbackUrl = `${window.location.origin}/payment/callback`;
  return createPayment({
    type: "topup",
    amount,
    callbackUrl,
  });
}

// ─── Booking Payment with Moyasar ───

export async function initiateBookingPayment(
  amount: number,
  propertyId: number,
  bookingId?: string
): Promise<CreatePaymentResponse> {
  const callbackUrl = `${window.location.origin}/payment/callback`;
  return createPayment({
    type: "booking",
    amount,
    propertyId,
    bookingId,
    callbackUrl,
  });
}
