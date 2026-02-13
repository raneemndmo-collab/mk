import { useI18n } from "@/lib/i18n";
import { Building2 } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const { t, lang } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-deep-charcoal text-white/90 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg gradient-saudi flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-heading">
                {lang === "ar" ? "إيجار" : "Ijar"}
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              {t("footer.aboutText")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/search" className="hover:text-white transition-colors">{t("nav.search")}</Link></li>
              <li><Link href="/list-property" className="hover:text-white transition-colors">{t("nav.listProperty")}</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">{t("nav.home")}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading font-semibold mb-4">{t("footer.support")}</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><span className="hover:text-white transition-colors cursor-pointer">{t("footer.faq")}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{t("footer.contact")}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{t("footer.terms")}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{t("footer.privacy")}</span></li>
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="font-heading font-semibold mb-4">
              {lang === "ar" ? "المدن" : "Cities"}
            </h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/search?city=riyadh" className="hover:text-white transition-colors">{t("city.riyadh")}</Link></li>
              <li><Link href="/search?city=jeddah" className="hover:text-white transition-colors">{t("city.jeddah")}</Link></li>
              <li><Link href="/search?city=dammam" className="hover:text-white transition-colors">{t("city.dammam")}</Link></li>
              <li><Link href="/search?city=makkah" className="hover:text-white transition-colors">{t("city.makkah")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/40">
          <p>&copy; {year} {lang === "ar" ? "إيجار" : "Ijar"}. {t("footer.rights")}.</p>
        </div>
      </div>
    </footer>
  );
}
