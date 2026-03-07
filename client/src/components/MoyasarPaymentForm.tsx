/**
 * MoyasarPaymentForm — Reusable Moyasar payment form component
 * 
 * Renders the Moyasar payment form with support for:
 * - Credit Card (Visa/Mastercard)
 * - mada (Saudi debit cards)
 * - Apple Pay
 * - STC Pay
 * 
 * When Moyasar is not configured, shows a placeholder with instructions.
 */

import { useEffect, useRef, useState } from "react";
import { loadMoyasarScript } from "@/lib/payments";
import { CreditCard, Smartphone, AlertCircle, Loader2 } from "lucide-react";

interface MoyasarPaymentFormProps {
  amount: number; // in halalas (e.g., 10000 = 100 SAR)
  currency?: string;
  description: string;
  publishableKey: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
  onCompleted?: (payment: any) => void;
  onFailure?: (error: any) => void;
  isConfigured: boolean;
}

export default function MoyasarPaymentForm({
  amount,
  currency = "SAR",
  description,
  publishableKey,
  callbackUrl,
  metadata,
  onCompleted,
  onFailure,
  isConfigured,
}: MoyasarPaymentFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isConfigured || !publishableKey || initialized.current) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        await loadMoyasarScript();
        if (cancelled) return;

        const Moyasar = (window as any).Moyasar;
        if (!Moyasar) {
          setError("فشل في تحميل بوابة الدفع");
          setLoading(false);
          return;
        }

        Moyasar.init({
          element: formRef.current,
          amount,
          currency,
          description,
          publishable_api_key: publishableKey,
          callback_url: callbackUrl,
          methods: ["creditcard", "mada", "applepay", "stcpay"],
          metadata: metadata || {},
          on_completed: (payment: any) => {
            onCompleted?.(payment);
          },
          on_failure: (err: any) => {
            onFailure?.(err);
          },
        });

        initialized.current = true;
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "فشل في تحميل نموذج الدفع");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isConfigured, publishableKey, amount, currency, description, callbackUrl, metadata, onCompleted, onFailure]);

  // Not configured — show placeholder
  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.15))" }}>
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-base font-bold mb-2">بوابة الدفع غير مفعلة</h3>
          <p className="text-sm text-muted-foreground mb-4">
            يجب إضافة مفاتيح Moyasar API لتفعيل الدفع الإلكتروني
          </p>
          <div className="glass rounded-xl p-4 text-right space-y-2">
            <p className="text-xs text-muted-foreground font-medium">لتفعيل الدفع:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>أنشئ حساب في <span className="text-primary font-medium">moyasar.com</span></li>
              <li>احصل على Publishable Key و Secret Key</li>
              <li>أضف المفاتيح في إعدادات التطبيق</li>
            </ol>
          </div>
        </div>

        {/* Show available payment methods preview */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">طرق الدفع المدعومة:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "بطاقة ائتمان", icon: CreditCard, desc: "Visa / Mastercard" },
              { label: "مدى", icon: CreditCard, desc: "بطاقة مدى" },
              { label: "Apple Pay", icon: Smartphone, desc: "الدفع بأبل" },
              { label: "STC Pay", icon: Smartphone, desc: "الدفع بـ STC" },
            ].map((m) => (
              <div key={m.label} className="glass rounded-xl p-3 opacity-50">
                <div className="flex items-center gap-2 mb-1">
                  <m.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium">{m.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  // Moyasar form container
  return (
    <div className="moyasar-form-container">
      <div ref={formRef} id="moyasar-form" />
      <style>{`
        .moyasar-form-container .mysr-form {
          direction: ltr;
        }
        .moyasar-form-container .mysr-form .mysr-form-group label {
          color: var(--foreground);
          font-size: 0.875rem;
        }
        .moyasar-form-container .mysr-form .mysr-form-group input {
          background: hsl(var(--card));
          border-color: hsl(var(--border));
          color: var(--foreground);
          border-radius: 0.75rem;
        }
        .moyasar-form-container .mysr-form button[type="submit"] {
          background: linear-gradient(135deg, #2563EB, #7C3AED) !important;
          border-radius: 0.75rem !important;
          font-weight: bold !important;
        }
      `}</style>
    </div>
  );
}
