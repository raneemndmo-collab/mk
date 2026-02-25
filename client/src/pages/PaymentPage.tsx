import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, CheckCircle, ArrowLeft, ArrowRight,
  Loader2, Shield, Smartphone, Wallet, Clock
} from "lucide-react";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import SEOHead from "@/components/SEOHead";

type PaymentMethod = "paypal" | "apple_pay" | "google_pay" | "cash";

const paymentMethods: { key: PaymentMethod; labelAr: string; labelEn: string; icon: any; color: string; bgColor: string; description: string; descriptionAr: string }[] = [
  {
    key: "paypal",
    labelAr: "PayPal",
    labelEn: "PayPal",
    icon: Wallet,
    color: "text-[#003087]",
    bgColor: "bg-[#003087]/10 border-[#003087]/20 hover:border-[#003087]/50",
    description: "Pay securely with your PayPal account",
    descriptionAr: "ادفع بأمان عبر حسابك في PayPal",
  },
  {
    key: "apple_pay",
    labelAr: "Apple Pay",
    labelEn: "Apple Pay",
    icon: Smartphone,
    color: "text-black dark:text-white",
    bgColor: "bg-black/5 dark:bg-white/10 border-black/20 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50",
    description: "Quick and secure payment with Apple Pay",
    descriptionAr: "دفع سريع وآمن عبر Apple Pay",
  },
  {
    key: "google_pay",
    labelAr: "Google Pay",
    labelEn: "Google Pay",
    icon: CreditCard,
    color: "text-[#4285F4]",
    bgColor: "bg-[#4285F4]/10 border-[#4285F4]/20 hover:border-[#4285F4]/50",
    description: "Pay with Google Pay for a seamless experience",
    descriptionAr: "ادفع عبر Google Pay لتجربة سلسة",
  },
  {
    key: "cash",
    labelAr: "الدفع عند الاستلام",
    labelEn: "Cash on Delivery",
    icon: Wallet,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-400",
    description: "Pay in cash when you receive the keys",
    descriptionAr: "ادفع نقداً عند استلام المفاتيح",
  },
];

export default function PaymentPage() {
  const { t, lang, dir } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const [, params] = useRoute("/pay/:id");
  const [, setLocation] = useLocation();
  const bookingId = Number(params?.id);
  const { get: setting } = useSiteSettings();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  const booking = trpc.booking.getById.useQuery({ id: bookingId }, { enabled: !!bookingId });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const b = booking.data;

  if (booking.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8 max-w-2xl">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!b) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">{lang === "ar" ? "الحجز غير موجود" : "Booking not found"}</p>
          <Button className="mt-4" onClick={() => setLocation("/dashboard")}>{t("dashboard.tenant")}</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (b.status !== "approved") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-20 text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {lang === "ar" ? "الحجز غير جاهز للدفع" : "Booking Not Ready for Payment"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {b.status === "pending"
              ? (lang === "ar" ? "طلب الحجز قيد المراجعة. سيتم إخطارك عند الموافقة." : "Booking request is under review. You'll be notified once approved.")
              : (lang === "ar" ? "حالة الحجز الحالية لا تسمح بالدفع." : "Current booking status does not allow payment.")}
          </p>
          <Button onClick={() => setLocation("/dashboard")} className="bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] border-0 font-semibold">
            {t("dashboard.tenant")}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const monthlyRent = Number(b.monthlyRent);
  const totalAmount = Number(b.totalAmount);

  const handlePay = () => {
    if (!selectedMethod) {
      toast.error(lang === "ar" ? "يرجى اختيار طريقة الدفع" : "Please select a payment method");
      return;
    }
    setProcessing(true);
    // Simulate payment processing - will be connected later
    setTimeout(() => {
      setProcessing(false);
      toast.info(
        lang === "ar"
          ? "سيتم ربط بوابة الدفع قريباً. تواصل مع الإدارة لإتمام الدفع."
          : "Payment gateway will be connected soon. Contact admin to complete payment."
      );
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <SEOHead title="Payment" titleAr="الدفع" path="/pay" noindex={true} />
      <Navbar />
      <div className="container py-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="mb-4 hover:bg-muted/80">
          <BackArrow className="h-4 w-4 me-1.5" />
          {t("common.back")}
        </Button>

        <h1 className="text-2xl font-heading font-bold mb-2">
          {lang === "ar" ? "إتمام الدفع" : "Complete Payment"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {lang === "ar" ? "تم الموافقة على حجزك — اختر طريقة الدفع لإتمام العملية" : "Your booking is approved — select a payment method to proceed"}
        </p>

        {/* Booking Summary */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{lang === "ar" ? "ملخص الحجز" : "Booking Summary"}</CardTitle>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                <CheckCircle className="h-3 w-3 me-1" />
                {lang === "ar" ? "تمت الموافقة" : "Approved"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === "ar" ? "رقم الحجز" : "Booking #"}</span>
                <span className="font-medium">#{b.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.moveIn")}</span>
                <span className="font-medium">{format(new Date(b.moveInDate), "dd MMM yyyy", { locale: lang === "ar" ? ar : enUS })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.moveOut")}</span>
                <span className="font-medium">{format(new Date(b.moveOutDate), "dd MMM yyyy", { locale: lang === "ar" ? ar : enUS })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.duration")}</span>
                <span className="font-medium">
                  {b.durationMonths === 1 ? (lang === "ar" ? "شهر واحد" : "1 Month") : (lang === "ar" ? "شهرين" : "2 Months")}
                </span>
              </div>
            </div>

            <Separator />

            {(() => {
              const hideIns = setting("calculator.hideInsuranceFromTenant", "false") === "true";
              const rentTotal = monthlyRent * b.durationMonths;
              const deposit = b.securityDeposit ? Number(b.securityDeposit) : 0;
              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("property.monthlyRent")} x {b.durationMonths}</span>
                    <span className="font-medium">{(hideIns ? rentTotal + deposit : rentTotal).toLocaleString()} {t("payment.sar")}</span>
                  </div>
                  {!hideIns && deposit > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("property.securityDeposit")}</span>
                      <span className="font-medium">{deposit.toLocaleString()} {t("payment.sar")}</span>
                    </div>
                  )}
                </>
              );
            })()}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>{t("common.total")}</span>
              <span className="text-primary">{totalAmount.toLocaleString()} {t("payment.sar")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {lang === "ar" ? "اختر طريقة الدفع" : "Select Payment Method"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map(method => (
              <button
                key={method.key}
                onClick={() => setSelectedMethod(method.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-start ${
                  selectedMethod === method.key
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/15 ring-1 ring-primary/20"
                    : method.bgColor
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedMethod === method.key ? "bg-primary/10" : "bg-muted/50"
                }`}>
                  <method.icon className={`h-6 w-6 ${selectedMethod === method.key ? "text-primary" : method.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base">
                    {lang === "ar" ? method.labelAr : method.labelEn}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lang === "ar" ? method.descriptionAr : method.description}
                  </div>
                </div>
                {selectedMethod === method.key && (
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Security notice */}
        <Card className="mb-6 border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              {lang === "ar"
                ? "جميع المعاملات مشفرة ومحمية. لن يتم مشاركة بياناتك المالية مع أي طرف ثالث."
                : "All transactions are encrypted and secure. Your financial data will not be shared with third parties."}
            </p>
          </CardContent>
        </Card>

        {/* Pay Button */}
        <Button
          className="w-full h-14 bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] btn-animate border-0 font-bold text-lg shadow-lg shadow-[#3ECFC0]/25 mb-6"
          onClick={handlePay}
          disabled={!selectedMethod || processing}
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 me-2 animate-spin" />
              {lang === "ar" ? "جاري المعالجة..." : "Processing..."}
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 me-2" />
              {lang === "ar" ? `ادفع ${totalAmount.toLocaleString()} ر.س` : `Pay ${totalAmount.toLocaleString()} SAR`}
            </>
          )}
        </Button>
      </div>
      <Footer />
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}
