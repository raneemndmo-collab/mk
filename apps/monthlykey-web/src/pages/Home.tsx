import { Search, MapPin, Calendar, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [budget, setBudget] = useState("");
  const [moveIn, setMoveIn] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (district) params.set("district", district);
    if (budget) params.set("maxPrice", budget);
    if (moveIn) params.set("moveIn", moveIn);
    navigate(`/search?${params}`);
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-mk-navy text-white px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img
            src="/mark-header-gold.png"
            alt="MonthlyKey"
            className="shrink-0 h-[26px] md:h-[34px] w-auto"
          />
          <span className="font-bold">المفتاح الشهري</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            تسجيل الدخول
          </button>
          <button className="bg-mk-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mk-teal/90 transition-colors">
            أضف عقارك
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-mk-navy to-mk-dark py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(46,196,182,0.1),transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            سكنك الشهري{" "}
            <span className="text-mk-gold">بمفتاح واحد</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            شقق مفروشة بعقود شهرية مرنة في أفضل أحياء المملكة
          </p>

          {/* Search Module: المدينة + الحي + الميزانية + تاريخ الانتقال */}
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-2xl shadow-xl p-3 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl hover:bg-gray-50">
              <MapPin size={18} className="text-mk-teal shrink-0" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-gray-700"
              >
                <option value="">المدينة</option>
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="الدمام">الدمام</option>
                <option value="مكة">مكة المكرمة</option>
                <option value="المدينة">المدينة المنورة</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl hover:bg-gray-50">
              <MapPin size={18} className="text-mk-teal shrink-0" />
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="الحي"
                className="w-full bg-transparent text-sm focus:outline-none text-gray-700"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl hover:bg-gray-50">
              <DollarSign size={18} className="text-mk-teal shrink-0" />
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-gray-700"
              >
                <option value="">الميزانية</option>
                <option value="3000">حتى 3,000 ر.س</option>
                <option value="5000">حتى 5,000 ر.س</option>
                <option value="8000">حتى 8,000 ر.س</option>
                <option value="12000">حتى 12,000 ر.س</option>
                <option value="999999">أكثر من 12,000 ر.س</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl hover:bg-gray-50">
              <Calendar size={18} className="text-mk-teal shrink-0" />
              <input
                type="date"
                value={moveIn}
                onChange={(e) => setMoveIn(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-gray-700"
              />
            </div>
            <button
              type="submit"
              className="bg-mk-teal text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-mk-teal/90 transition-colors"
            >
              <Search size={18} />
              ابحث
            </button>
          </form>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-mk-navy mb-6">مدننا</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "الرياض", count: "120+ وحدة" },
            { name: "جدة", count: "85+ وحدة" },
            { name: "الدمام", count: "45+ وحدة" },
            { name: "مكة", count: "60+ وحدة" },
          ].map((c) => (
            <div
              key={c.name}
              onClick={() => navigate(`/search?city=${c.name}`)}
              className="bg-white rounded-xl border border-gray-100 p-6 cursor-pointer hover:shadow-md hover:border-mk-teal/30 transition-all"
            >
              <MapPin size={24} className="text-mk-teal mb-3" />
              <h3 className="font-semibold text-mk-navy">{c.name}</h3>
              <p className="text-sm text-gray-500">{c.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-mk-navy text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/mark-header-gold.png"
                alt="MonthlyKey"
                className="shrink-0 h-[34px] w-auto"
              />
              <span className="font-bold text-lg">المفتاح الشهري</span>
            </div>
            <p className="text-gray-400 text-sm">منصة التأجير الشهري في السعودية</p>
          </div>
          <div className="text-sm text-gray-400">
            <p>&copy; 2026 المفتاح الشهري. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
