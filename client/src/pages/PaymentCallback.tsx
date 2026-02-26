import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle, XCircle, Loader2, Clock, ArrowLeft, ArrowRight
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import SEOHead from "@/components/SEOHead";

/**
 * Payment Callback Page
 * 
 * IMPORTANT: This page does NOT finalize the payment.
 * Payment finalization happens ONLY via Moyasar webhook.
 * This page simply shows the user a status message based on the URL params
 * and polls the booking status to reflect webhook updates.
 */
export default function PaymentCallback() {
  const { t, lang, dir } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const [, params] = useRoute("/payment-callback/:id");
  const [, setLocation] = useLocation();
  const bookingId = Number(params?.id);

  // Read Moyasar callback params from URL
  const urlParams = new URLSearchParams(window.location.search);
  const moyasarId = urlParams.get("id");
  const moyasarStatus = urlParams.get("status");
  const moyasarMessage = urlParams.get("message");

  // Poll booking status to detect webhook finalization
  const booking = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: !!bookingId, refetchInterval: 3000 } // Poll every 3s
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const b = booking.data;
  // Check if booking status indicates payment was made
  // The actual payment status is tracked in payment_ledger via webhook
  const isPaid = b?.status === "active";

  // Determine display status
  let status: "success" | "pending" | "failed" = "pending";
  if (isPaid) {
    status = "success";
  } else if (moyasarStatus === "paid" || moyasarStatus === "captured") {
    status = "pending"; // Moyasar says paid but webhook hasn't processed yet
  } else if (moyasarStatus === "failed" || moyasarStatus === "expired") {
    status = "failed";
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <SEOHead title="Payment Status" titleAr="حالة الدفع" path="/payment-callback" noindex={true} />
      <Navbar />
      <div className="container py-12 max-w-md mx-auto">
        {status === "success" && (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-green-700 dark:text-green-400">
                {lang === "ar" ? "تم الدفع بنجاح!" : "Payment Successful!"}
              </h2>
              <p className="text-muted-foreground">
                {lang === "ar"
                  ? "تم تأكيد الدفع وتحديث حجزك. شكراً لك!"
                  : "Payment confirmed and your booking has been updated. Thank you!"}
              </p>
              {moyasarId && (
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? "مرجع الدفع:" : "Payment ref:"} {moyasarId}
                </p>
              )}
              <Button
                className="w-full mt-4 bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] border-0 font-semibold"
                onClick={() => setLocation("/dashboard")}
              >
                {lang === "ar" ? "العودة للوحة التحكم" : "Back to Dashboard"}
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "pending" && (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-amber-700 dark:text-amber-400">
                {lang === "ar" ? "جاري التأكيد..." : "Confirming Payment..."}
              </h2>
              <p className="text-muted-foreground">
                {lang === "ar"
                  ? "تم استلام الدفع وجاري التحقق منه. سيتم تحديث الحالة تلقائياً خلال لحظات."
                  : "Payment received and being verified. Status will update automatically in a moment."}
              </p>
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-amber-600" />
              <p className="text-xs text-muted-foreground">
                {lang === "ar" ? "لا تغلق هذه الصفحة" : "Please don't close this page"}
              </p>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setLocation("/dashboard")}
              >
                <BackArrow className="h-4 w-4 me-1.5" />
                {lang === "ar" ? "العودة للوحة التحكم" : "Back to Dashboard"}
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "failed" && (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-red-700 dark:text-red-400">
                {lang === "ar" ? "فشل الدفع" : "Payment Failed"}
              </h2>
              <p className="text-muted-foreground">
                {moyasarMessage || (lang === "ar"
                  ? "لم تتم عملية الدفع. يمكنك المحاولة مرة أخرى."
                  : "Payment was not completed. You can try again.")}
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  className="w-full bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] border-0 font-semibold"
                  onClick={() => setLocation(`/pay/${bookingId}`)}
                >
                  {lang === "ar" ? "حاول مرة أخرى" : "Try Again"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/dashboard")}
                >
                  {lang === "ar" ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
