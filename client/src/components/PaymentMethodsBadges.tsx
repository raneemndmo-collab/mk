import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Shield } from "lucide-react";

interface PaymentMethodsBadgesProps {
  variant: "footer" | "property";
}

/**
 * Shared component that displays enabled payment method logos/badges.
 * Single source of truth: uses finance.moyasarPayment.getEnabledBadges tRPC endpoint.
 * Shows logos ONLY if the method is enabled AND configured (keys present).
 * Hides entirely if no online payment methods are enabled.
 */
export default function PaymentMethodsBadges({ variant }: PaymentMethodsBadgesProps) {
  const { lang } = useI18n();
  const { data: methods, isLoading } = trpc.finance.moyasarPayment.getEnabledBadges.useQuery(
    undefined,
    { staleTime: 60_000, refetchOnWindowFocus: false }
  );

  // Hide entirely if loading, error, or no methods
  if (isLoading || !methods || methods.length === 0) return null;

  if (variant === "footer") {
    return (
      <div className="border-t border-white/10 pt-6 mt-6">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-white/50 uppercase tracking-wider font-medium">
            {lang === "ar" ? "طرق الدفع المقبولة" : "Accepted Payment Methods"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {methods.map((m) => (
              <div
                key={m.key}
                className="bg-white/10 backdrop-blur-sm rounded-md px-3 py-1.5 flex items-center gap-2 hover:bg-white/15 transition-colors"
                title={lang === "ar" ? m.labelAr : m.label}
              >
                <img
                  src={m.logoPath}
                  alt={lang === "ar" ? m.labelAr : m.label}
                  className="h-6 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // variant === "property"
  return (
    <div className="border border-border/50 rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-[#3ECFC0]" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {lang === "ar" ? "ادفع بأمان عبر" : "Pay securely with"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {methods.map((m) => (
          <div
            key={m.key}
            className="bg-background border border-border/60 rounded-md px-3 py-1.5 flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
            title={lang === "ar" ? m.labelAr : m.label}
          >
            <img
              src={m.logoPath}
              alt={lang === "ar" ? m.labelAr : m.label}
              className="h-6 w-auto object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
