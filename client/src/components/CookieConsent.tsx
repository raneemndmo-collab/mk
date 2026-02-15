import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Cookie, X, Shield } from "lucide-react";
import { Link } from "wouter";

const COOKIE_CONSENT_KEY = "monthlykey_cookie_consent";

type ConsentStatus = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const { lang, dir } = useI18n();
  const [status, setStatus] = useState<ConsentStatus>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") {
      setStatus(stored);
    } else {
      // Show after a short delay for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setStatus("accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setStatus("rejected");
    setVisible(false);
  };

  const handleClose = () => {
    setVisible(false);
  };

  // Don't render if already consented
  if (status) return null;
  if (!visible) return null;

  return (
    <div
      dir={dir}
      className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500"
    >
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-xl bg-[#3ECFC0]/10 items-center justify-center">
            <Cookie className="h-6 w-6 text-[#3ECFC0]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-[#C9A96E] sm:hidden" />
              <h3 className="font-heading font-bold text-sm sm:text-base">
                {lang === "ar" ? "سياسة ملفات تعريف الارتباط" : "Cookie Policy"}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
              {lang === "ar"
                ? "نستخدم ملفات تعريف الارتباط (الكوكيز) لتحسين تجربتك على منصتنا وتقديم محتوى مخصص وتحليل حركة المرور. وفقاً لنظام حماية البيانات الشخصية (PDPL) في المملكة العربية السعودية، نحتاج موافقتك قبل استخدام ملفات تعريف الارتباط غير الضرورية."
                : "We use cookies to enhance your experience, personalize content, and analyze traffic. In accordance with Saudi Arabia's Personal Data Protection Law (PDPL), we require your consent before using non-essential cookies."}
              {" "}
              <Link href="/privacy" className="text-[#3ECFC0] hover:underline font-medium">
                {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
              </Link>
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleAccept}
                className="bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] font-semibold text-xs sm:text-sm px-5"
              >
                {lang === "ar" ? "قبول الكل" : "Accept All"}
              </Button>
              <Button
                onClick={handleReject}
                variant="outline"
                className="text-xs sm:text-sm px-5"
              >
                {lang === "ar" ? "الضروري فقط" : "Essential Only"}
              </Button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
