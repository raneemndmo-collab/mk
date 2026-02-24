import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: "CHECKOUT_CLEAN",
    unitId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    dueAt: "",
    zone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST to /api/v1/tickets
    alert("سيتم إنشاء التذكرة عند توصيل قاعدة البيانات");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">إنشاء تذكرة جديدة</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع التذكرة</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
          >
            <option value="CHECKOUT_CLEAN">تنظيف مغادرة</option>
            <option value="DEEP_CLEAN">تنظيف عميق</option>
            <option value="MAINTENANCE">صيانة</option>
            <option value="INSPECTION">فحص</option>
            <option value="TURNOVER">تجهيز وحدة</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: تنظيف مغادرة — شقة الكورنيش"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="تفاصيل إضافية..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
            >
              <option value="LOW">منخفضة</option>
              <option value="MEDIUM">متوسطة</option>
              <option value="HIGH">عالية</option>
              <option value="URGENT">عاجلة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة</label>
            <select
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
            >
              <option value="">اختر المنطقة</option>
              <option value="الرياض">الرياض</option>
              <option value="جدة">جدة</option>
              <option value="الدمام">الدمام</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الموعد المطلوب</label>
          <input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-brand-teal text-white py-3 rounded-xl font-medium hover:bg-brand-teal/90 transition-colors"
          >
            إنشاء التذكرة
          </button>
          <button
            type="button"
            onClick={() => navigate("/tickets")}
            className="px-6 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
