import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react";

const stats = [
  { label: "إجمالي التذاكر", value: "—", icon: ClipboardList, color: "bg-blue-500" },
  { label: "قيد الانتظار", value: "—", icon: Clock, color: "bg-amber-500" },
  { label: "مكتملة", value: "—", icon: CheckCircle2, color: "bg-emerald-500" },
  { label: "متأخرة", value: "—", icon: AlertTriangle, color: "bg-red-500" },
  { label: "الفريق النشط", value: "—", icon: Users, color: "bg-brand-teal" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على عمليات التنظيف والصيانة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`${stat.color} p-2 rounded-lg text-white`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">آخر التذاكر</h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد تذاكر حتى الآن</p>
          <p className="text-sm mt-1">قم بتوصيل قاعدة البيانات لعرض التذاكر</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-brand-teal to-emerald-600 rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">تذكرة تنظيف جديدة</h3>
          <p className="text-white/80 text-sm mb-4">إنشاء تذكرة تنظيف لوحدة بعد المغادرة</p>
          <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            إنشاء تذكرة
          </button>
        </div>
        <div className="bg-gradient-to-br from-brand-gold to-amber-600 rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">تذكرة صيانة جديدة</h3>
          <p className="text-white/80 text-sm mb-4">الإبلاغ عن مشكلة صيانة في وحدة</p>
          <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            إنشاء تذكرة
          </button>
        </div>
      </div>
    </div>
  );
}
