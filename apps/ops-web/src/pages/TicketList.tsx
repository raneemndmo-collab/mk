import { useState } from "react";
import { Link } from "react-router-dom";
import { Filter, PlusCircle, Search } from "lucide-react";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600 font-bold",
};

export default function TicketList() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التذاكر</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة تذاكر التنظيف والصيانة</p>
        </div>
        <Link
          to="/tickets/new"
          className="flex items-center gap-2 bg-brand-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition-colors"
        >
          <PlusCircle size={16} />
          تذكرة جديدة
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في التذاكر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          >
            <option value="ALL">كل الحالات</option>
            <option value="OPEN">مفتوحة</option>
            <option value="ASSIGNED">معيّنة</option>
            <option value="IN_PROGRESS">قيد التنفيذ</option>
            <option value="COMPLETED">مكتملة</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          >
            <option value="ALL">كل الأنواع</option>
            <option value="CHECKOUT_CLEAN">تنظيف مغادرة</option>
            <option value="DEEP_CLEAN">تنظيف عميق</option>
            <option value="MAINTENANCE">صيانة</option>
            <option value="INSPECTION">فحص</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <Filter size={48} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">لا توجد تذاكر</p>
        <p className="text-gray-400 text-sm mt-1">قم بتوصيل قاعدة البيانات أو أنشئ تذكرة جديدة</p>
      </div>
    </div>
  );
}
