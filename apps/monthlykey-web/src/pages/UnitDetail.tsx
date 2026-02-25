import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Wifi, Car, Wind, Tv } from "lucide-react";

export default function UnitDetail() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-mk-navy text-white px-4 md:px-6 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/mark-header-gold.png" alt="MonthlyKey" className="shrink-0 h-[26px] md:h-[34px] w-auto" />
          <span className="font-bold text-sm">المفتاح الشهري</span>
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/search" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-mk-navy mb-4">
          العودة للبحث <ArrowRight size={16} />
        </Link>

        <div className="bg-gray-100 rounded-2xl h-64 md:h-96 flex items-center justify-center mb-6">
          <p className="text-gray-400">صور الوحدة ستُحمّل من Beds24</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-mk-navy">وحدة #{id}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                <MapPin size={14} />
                <span>الموقع سيُحمّل من قاعدة البيانات</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-mk-navy mb-3">المرافق</h3>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                {[
                  { icon: Wifi, label: "واي فاي مجاني" },
                  { icon: Car, label: "موقف سيارات" },
                  { icon: Wind, label: "تكييف مركزي" },
                  { icon: Tv, label: "تلفزيون ذكي" },
                ].map((a) => (
                  <div key={a.label} className="flex items-center gap-2">
                    <a.icon size={16} className="text-mk-teal" />
                    {a.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit sticky top-6">
            <div className="text-center mb-4">
              <span className="text-2xl font-bold text-mk-navy">—</span>
              <span className="text-gray-500 text-sm"> ر.س / شهر</span>
            </div>
            <button className="w-full bg-mk-teal text-white py-3 rounded-xl font-medium hover:bg-mk-teal/90 transition-colors">
              تحقق من التوفر
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              لا يلزم تسجيل الدخول للتصفح
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
