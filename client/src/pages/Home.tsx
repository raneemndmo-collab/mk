import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Building2, Key, Home as HomeIcon, Shield, MapPin,
  ArrowLeft, ArrowRight, Star, Users, CheckCircle
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const featured = trpc.property.featured.useQuery();

  const handleSearch = () => {
    setLocation(`/search?city=${encodeURIComponent(searchQuery)}`);
  };

  const cities = [
    { key: "riyadh", nameAr: "الرياض", nameEn: "Riyadh", img: "https://images.unsplash.com/photo-1586724237569-9c5e0e4d7b25?w=400&h=300&fit=crop" },
    { key: "jeddah", nameAr: "جدة", nameEn: "Jeddah", img: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=400&h=300&fit=crop" },
    { key: "dammam", nameAr: "الدمام", nameEn: "Dammam", img: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&h=300&fit=crop" },
    { key: "makkah", nameAr: "مكة المكرمة", nameEn: "Makkah", img: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&h=300&fit=crop" },
    { key: "madinah", nameAr: "المدينة المنورة", nameEn: "Madinah", img: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=300&fit=crop" },
    { key: "khobar", nameAr: "الخبر", nameEn: "Khobar", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop" },
  ];

  const steps = [
    { icon: Search, titleKey: "howItWorks.step1Title" as const, descKey: "howItWorks.step1Desc" as const },
    { icon: Key, titleKey: "howItWorks.step2Title" as const, descKey: "howItWorks.step2Desc" as const },
    { icon: HomeIcon, titleKey: "howItWorks.step3Title" as const, descKey: "howItWorks.step3Desc" as const },
  ];

  const stats = [
    { value: "500+", labelAr: "عقار متاح", labelEn: "Properties Available" },
    { value: "1000+", labelAr: "مستأجر سعيد", labelEn: "Happy Tenants" },
    { value: "50+", labelAr: "مدينة", labelEn: "Cities" },
    { value: "98%", labelAr: "رضا العملاء", labelEn: "Satisfaction Rate" },
  ];

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative gradient-saudi text-white overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-30" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* Search bar */}
            <div className="bg-white rounded-xl p-2 flex gap-2 shadow-2xl max-w-lg mx-auto">
              <Input
                placeholder={t("hero.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border-0 bg-transparent text-foreground placeholder:text-muted-foreground h-12 text-base"
              />
              <Button onClick={handleSearch} size="lg" className="gradient-saudi text-white border-0 px-6 shrink-0">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="text-center border-border/50">
              <CardContent className="py-5">
                <div className="text-2xl md:text-3xl font-bold text-primary font-heading">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {lang === "ar" ? stat.labelAr : stat.labelEn}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold">
              {lang === "ar" ? "عقارات مميزة" : "Featured Properties"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {lang === "ar" ? "اكتشف أفضل العقارات المتاحة للإيجار الشهري" : "Discover the best properties available for monthly rent"}
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/search")} className="hidden md:flex">
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
              {lang === "ar" ? "لا توجد عقارات متاحة حالياً. كن أول من يضيف عقاراً!" : "No properties available yet. Be the first to list!"}
            </p>
            <Button className="mt-4 gradient-saudi text-white border-0" onClick={() => setLocation("/list-property")}>
              {t("nav.listProperty")}
            </Button>
          </Card>
        )}

        <div className="text-center mt-6 md:hidden">
          <Button variant="outline" onClick={() => setLocation("/search")}>
            {t("common.viewAll")}
            <ArrowIcon className="h-4 w-4 ms-1.5" />
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 pattern-bg py-16">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-12">
            {t("howItWorks.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl gradient-saudi flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">
                  {lang === "ar" ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{t(step.titleKey)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by City */}
      <section className="container py-16">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-3">
          {lang === "ar" ? "تصفح حسب المدينة" : "Browse by City"}
        </h2>
        <p className="text-muted-foreground text-center mb-10">
          {lang === "ar" ? "اكتشف العقارات المتاحة في أبرز المدن السعودية" : "Discover properties in Saudi Arabia's top cities"}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cities.map((city) => (
            <div
              key={city.key}
              onClick={() => setLocation(`/search?city=${city.key}`)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                <img
                  src={city.img}
                  alt={lang === "ar" ? city.nameAr : city.nameEn}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 start-3">
                  <h3 className="text-white font-heading font-semibold text-sm">
                    {lang === "ar" ? city.nameAr : city.nameEn}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-saudi text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-20" />
        <div className="container relative text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
            {lang === "ar" ? "هل لديك عقار للإيجار؟" : "Have a Property to Rent?"}
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            {lang === "ar"
              ? "انضم إلى منصة إيجار وابدأ بتأجير عقارك لآلاف المستأجرين الباحثين عن سكن شهري"
              : "Join Ijar and start renting your property to thousands of tenants looking for monthly housing"}
          </p>
          <Button
            size="lg"
            variant="outline"
            className="bg-white text-primary hover:bg-white/90 border-white font-semibold"
            onClick={() => setLocation("/list-property")}
          >
            {t("nav.listProperty")}
            <ArrowIcon className="h-4 w-4 ms-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
