import { MapPin, Filter } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";

export default function Search() {
  const [params] = useSearchParams();
  const city = params.get("city") ?? "الكل";

  return (
    <div className="min-h-screen bg-mk-light">
      <nav className="bg-mk-navy text-white px-6 py-4 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo-mark.svg" alt="MonthlyKey" width={28} height={28} className="shrink-0" />
          <span className="font-bold text-sm">المفتاح الشهري</span>
        </Link>
        <span className="text-sm text-gray-400">
          نتائج البحث: <strong className="text-white">{city}</strong>
        </span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          {["الكل", "استوديو", "غرفة", "غرفتين", "3+ غرف"].map((f) => (
            <button
              key={f}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm text-mk-navy hover:border-mk-teal hover:text-mk-teal transition-colors whitespace-nowrap bg-white"
            >
              {f}
            </button>
          ))}
          <button className="px-4 py-2 rounded-full border border-gray-200 text-sm text-mk-navy hover:border-mk-teal flex items-center gap-1 bg-white">
            <Filter size={14} />
            فلاتر إضافية
          </button>
        </div>

        <div className="bg-white rounded-xl p-12 text-center">
          <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-mk-navy font-medium">لا توجد وحدات</p>
          <p className="text-gray-500 text-sm mt-1">
            قم بتوصيل قاعدة البيانات لعرض الوحدات المتاحة
          </p>
        </div>
      </div>
    </div>
  );
}
