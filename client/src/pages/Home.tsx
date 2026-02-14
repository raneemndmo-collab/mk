import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Building2, Key, Home as HomeIcon, Shield, MapPin,
  ArrowLeft, ArrowRight, Star, Users, CheckCircle, Headphones,
  TrendingUp, Paintbrush, UserCheck, BarChart3, Quote
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  const numericTarget = parseInt(target.replace(/[^0-9]/g, "")) || 0;
  const hasPlus = target.includes("+");
  const hasPercent = target.includes("%");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = numericTarget / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericTarget) {
        setCount(numericTarget);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, numericTarget]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-bold text-[#3ECFC0] font-heading">
      {count.toLocaleString()}{hasPercent ? "%" : ""}{hasPlus ? "+" : ""}{suffix}
    </div>
  );
}

export default function Home() {
  const { t, lang, dir } = useI18n();
  const { get: s, getByLang: sl } = useSiteSettings();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const featured = trpc.property.featured.useQuery();
  const citiesQuery = trpc.cities.all.useQuery({ activeOnly: true });

  const handleSearch = () => {
    setLocation(`/search?city=${encodeURIComponent(searchQuery)}`);
  };

  const stats = [
    { value: s("stats.properties", "500+"), labelAr: s("stats.propertiesLabelAr", "عقار متاح"), labelEn: s("stats.propertiesLabelEn", "Properties Available") },
    { value: s("stats.tenants", "1000+"), labelAr: s("stats.tenantsLabelAr", "مستأجر سعيد"), labelEn: s("stats.tenantsLabelEn", "Happy Tenants") },
    { value: s("stats.cities", "50+"), labelAr: s("stats.citiesLabelAr", "مدينة"), labelEn: s("stats.citiesLabelEn", "Cities") },
    { value: s("stats.satisfaction", "98%"), labelAr: s("stats.satisfactionLabelAr", "رضا العملاء"), labelEn: s("stats.satisfactionLabelEn", "Satisfaction Rate") },
  ];

  const services = [
    { icon: Building2, titleAr: "إدارة العقارات", titleEn: "Property Management", descAr: "إدارة شاملة لعقارك الشهري", descEn: "Complete monthly property management" },
    { icon: Key, titleAr: "الإيجار الشهري", titleEn: "Monthly Rentals", descAr: "تأجير مرن من شهر إلى شهرين", descEn: "Flexible 1-2 month rentals" },
    { icon: TrendingUp, titleAr: "إدارة الإيرادات", titleEn: "Revenue Management", descAr: "تسعير ذكي وتحسين العوائد", descEn: "Smart pricing and yield optimization" },
    { icon: Paintbrush, titleAr: "العناية بالعقار", titleEn: "Property Care", descAr: "صيانة وتجديد وتصميم داخلي", descEn: "Maintenance, renovation & interior design" },
    { icon: Headphones, titleAr: "تجربة المستأجر", titleEn: "Tenant Experience", descAr: "دعم المستأجرين على مدار الساعة", descEn: "24/7 tenant support" },
    { icon: UserCheck, titleAr: "التحقق والأمان", titleEn: "Verification & Security", descAr: "تحقق من الهوية وعقود رقمية", descEn: "Identity verification & digital contracts" },
  ];

  const steps = [
    { num: "01", titleAr: "ابحث عن عقارك", titleEn: "Search Properties", descAr: "تصفح مئات العقارات المتاحة للإيجار الشهري في مدينتك", descEn: "Browse hundreds of monthly rental properties in your city" },
    { num: "02", titleAr: "احجز إقامتك", titleEn: "Book Your Stay", descAr: "اختر المدة المناسبة واحجز بسهولة مع عقد رقمي", descEn: "Choose your duration and book easily with a digital contract" },
    { num: "03", titleAr: "استمتع بسكنك", titleEn: "Enjoy Your Home", descAr: "انتقل واستمتع بإقامة مريحة مع دعم متواصل", descEn: "Move in and enjoy a comfortable stay with ongoing support" },
  ];

  const testimonials = [
    { textAr: "منصة إيجار سهّلت علي البحث عن شقة شهرية في الرياض. الخدمة ممتازة والعقود واضحة.", textEn: "Ijar made it easy to find a monthly apartment in Riyadh. Excellent service and clear contracts.", nameAr: "أحمد المطيري", nameEn: "Ahmed Al-Mutairi", roleAr: "مستأجر - الرياض", roleEn: "Tenant - Riyadh" },
    { textAr: "سعيدة جداً باختياري لمنصة إيجار. من البحث وحتى التوقيع، كل شيء كان سلس واحترافي.", textEn: "Very happy with Ijar. From search to signing, everything was smooth and professional.", nameAr: "سارة الحربي", nameEn: "Sara Al-Harbi", roleAr: "مستأجرة - جدة", roleEn: "Tenant - Jeddah" },
    { textAr: "كمالك عقار، إيجار وفّرت لي إدارة كاملة لشقتي. العوائد ممتازة والتواصل مع المستأجرين سهل.", textEn: "As a property owner, Ijar provided complete management. Great returns and easy tenant communication.", nameAr: "خالد العتيبي", nameEn: "Khaled Al-Otaibi", roleAr: "مالك عقار - المدينة", roleEn: "Property Owner - Madinah" },
  ];

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section - Dark Navy */}
      <section className="relative bg-[#0B1E2D] text-white overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-30" />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B1E2D]/50" />
        
        <div className="container relative py-24 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-[#3ECFC0]/30 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#3ECFC0] animate-pulse" />
              <span className="text-sm text-[#3ECFC0]">
                {lang === "ar" ? "الآن في المملكة العربية السعودية" : "Now in Saudi Arabia"}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-heading font-extrabold mb-6 leading-tight">
              {sl("hero.title", lang) || (lang === "ar" 
                ? "خبير الإيجار الشهري — الآن في السعودية" 
                : "Monthly Rental Expert — Now in Saudi Arabia")}
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
              {sl("hero.subtitle", lang) || (lang === "ar"
                ? "إدارة إيجارات شهرية متميزة | الرياض • جدة • المدينة المنورة"
                : "Premium monthly rental management | Riyadh • Jeddah • Madinah")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] border-0 font-bold text-base px-8 h-12"
                onClick={() => setLocation("/list-property")}
              >
                {lang === "ar" ? "أدرج عقارك" : "List Your Property"}
                <ArrowIcon className="h-4 w-4 ms-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#3ECFC0]/40 text-[#3ECFC0] hover:bg-[#3ECFC0]/10 hover:text-[#3ECFC0] font-bold text-base px-8 h-12"
                onClick={() => setLocation("/search")}
              >
                {lang === "ar" ? "احجز إقامتك" : "Book Your Stay"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-border/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <AnimatedCounter target={stat.value} />
                <div className="text-sm text-muted-foreground mt-2 font-medium">
                  {lang === "ar" ? stat.labelAr : stat.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-[#f5f7fa] py-20">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-3">
            {lang === "ar" ? "خدماتنا" : "Our Services"}
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {lang === "ar" ? "نقدم مجموعة متكاملة من الخدمات لتسهيل تجربة الإيجار الشهري" : "A complete suite of services for a seamless monthly rental experience"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-white">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-[#3ECFC0]/10 flex items-center justify-center mb-4 group-hover:bg-[#3ECFC0]/20 transition-colors">
                    <service.icon className="h-6 w-6 text-[#3ECFC0]" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    {lang === "ar" ? service.titleAr : service.titleEn}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {lang === "ar" ? service.descAr : service.descEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Dark Section */}
      <section className="bg-[#0B1E2D] text-white py-20">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-3">
            {lang === "ar" ? "كيف يعمل" : "How It Works"}
          </h2>
          <p className="text-white/60 text-center mb-14 max-w-xl mx-auto">
            {lang === "ar" ? "ثلاث خطوات بسيطة للحصول على سكنك الشهري المثالي" : "Three simple steps to find your perfect monthly home"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-heading font-extrabold text-[#3ECFC0]/20 mb-4">{step.num}</div>
                <h3 className="text-xl font-heading font-semibold mb-3">
                  {lang === "ar" ? step.titleAr : step.titleEn}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {lang === "ar" ? step.descAr : step.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">
                {lang === "ar" ? "عقارات مميزة" : "Featured Properties"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {lang === "ar" ? "اكتشف أفضل العقارات المتاحة للإيجار الشهري" : "Discover the best monthly rental properties"}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/search")} 
              className="hidden md:flex border-[#3ECFC0] text-[#3ECFC0] hover:bg-[#3ECFC0]/10"
            >
              {t("common.viewAll")}
              <ArrowIcon className="h-4 w-4 ms-1.5" />
            </Button>
          </div>

          {featured.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featured.data && featured.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.data.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {lang === "ar" ? "لا توجد عقارات متاحة حالياً" : "No properties available yet"}
              </p>
              <Button className="mt-4 bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] border-0" onClick={() => setLocation("/list-property")}>
                {t("nav.listProperty")}
              </Button>
            </Card>
          )}

          <div className="text-center mt-8 md:hidden">
            <Button variant="outline" onClick={() => setLocation("/search")} className="border-[#3ECFC0] text-[#3ECFC0] hover:bg-[#3ECFC0]/10">
              {t("common.viewAll")}
              <ArrowIcon className="h-4 w-4 ms-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="bg-[#f5f7fa] py-20">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-3">
            {lang === "ar" ? "مدننا" : "Our Cities"}
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            {lang === "ar" ? "اكتشف العقارات المتاحة في أبرز المدن السعودية" : "Discover properties in Saudi Arabia's top cities"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(citiesQuery.data || []).slice(0, 6).map((city) => (
              <Card
                key={city.id}
                onClick={() => setLocation(`/search?city=${city.nameEn?.toLowerCase()}`)}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden bg-white border-border/50"
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#3ECFC0]/10 flex items-center justify-center shrink-0 group-hover:bg-[#3ECFC0]/20 transition-colors">
                    <MapPin className="h-6 w-6 text-[#3ECFC0]" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">
                      {lang === "ar" ? city.nameAr : city.nameEn}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {lang === "ar" ? city.region || "" : city.region || ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-3">
            {lang === "ar" ? "آراء عملائنا" : "What Our Clients Say"}
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            {lang === "ar" ? "تجارب حقيقية من مستأجرين وملاك عقارات" : "Real experiences from tenants and property owners"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <Card key={i} className="border-border/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-[#3ECFC0]/30 mb-4" />
                  <p className="text-foreground/80 text-sm leading-relaxed mb-6 min-h-[80px]">
                    "{lang === "ar" ? item.textAr : item.textEn}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="w-10 h-10 rounded-full bg-[#0B1E2D] flex items-center justify-center text-white font-bold text-sm">
                      {(lang === "ar" ? item.nameAr : item.nameEn).charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{lang === "ar" ? item.nameAr : item.nameEn}</div>
                      <div className="text-xs text-muted-foreground">{lang === "ar" ? item.roleAr : item.roleEn}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0B1E2D] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-20" />
        <div className="container relative text-center">
          <h2 className="text-2xl md:text-4xl font-heading font-bold mb-4">
            {lang === "ar" ? "حقق أقصى استفادة من عقارك" : "Maximize Your Property's Potential"}
          </h2>
          <p className="text-white/60 mb-10 max-w-lg mx-auto text-lg">
            {lang === "ar"
              ? "احصل على تقييم إيجار مجاني واكتشف كم يمكن أن يحقق عقارك"
              : "Get a free rental assessment and discover your property's earning potential"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6] border-0 font-bold text-base px-8 h-12"
              onClick={() => setLocation("/list-property")}
            >
              {lang === "ar" ? "أدرج عقارك مجاناً" : "List Your Property Free"}
              <ArrowIcon className="h-4 w-4 ms-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 font-bold text-base px-8 h-12"
              onClick={() => setLocation("/search")}
            >
              {lang === "ar" ? "تصفح العقارات" : "Browse Properties"}
            </Button>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/966504466528"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 end-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
        title={lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
      >
        <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      <Footer />
    </div>
  );
}
