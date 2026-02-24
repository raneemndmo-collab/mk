import { BarChart3, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <p className="text-gray-500 text-sm mt-1">تحليلات وإحصائيات العمليات</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "متوسط وقت الإنجاز", value: "—", icon: Clock, color: "text-blue-500" },
          { label: "نسبة الإنجاز في الموعد", value: "—", icon: CheckCircle2, color: "text-emerald-500" },
          { label: "تذاكر هذا الشهر", value: "—", icon: BarChart3, color: "text-purple-500" },
          { label: "تحسن عن الشهر السابق", value: "—", icon: TrendingUp, color: "text-brand-teal" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
          >
            <kpi.icon size={20} className={`${kpi.color} mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">التذاكر حسب النوع</h3>
          <div className="h-48 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <BarChart3 size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm text-gray-400">الرسم البياني سيظهر عند توصيل البيانات</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">أداء الفرق</h3>
          <div className="h-48 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <TrendingUp size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm text-gray-400">الرسم البياني سيظهر عند توصيل البيانات</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-2">تصدير التقارير</h3>
        <p className="text-sm text-gray-500 mb-4">تصدير بيانات التذاكر والعمليات</p>
        <div className="flex gap-3">
          <button className="bg-brand-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition-colors">
            تصدير CSV
          </button>
          <button className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            تصدير PDF
          </button>
        </div>
      </div>
    </div>
  );
}
