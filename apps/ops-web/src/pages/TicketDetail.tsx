import { useParams, Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, Camera, Clock, MapPin, User } from "lucide-react";

export default function TicketDetail() {
  const { id } = useParams();

  // Placeholder — will be fetched from API
  const ticket = {
    id,
    title: "تنظيف مغادرة — استوديو العليا",
    type: "CHECKOUT_CLEAN",
    status: "IN_PROGRESS",
    priority: "HIGH",
    unit: "استوديو فاخر في الرياض",
    zone: "العليا",
    assignedTo: "فريق التنظيف",
    dueAt: "2026-02-26T14:00:00",
    tasks: [
      { id: "1", title: "تنظيف المطبخ وغسل الأطباق", done: true },
      { id: "2", title: "تنظيف الحمام وتعقيمه", done: true },
      { id: "3", title: "تغيير المفارش والمناشف", done: false },
      { id: "4", title: "كنس ومسح الأرضيات", done: false },
      { id: "5", title: "تنظيف النوافذ والمرايا", done: false },
      { id: "6", title: "التقاط صور التوثيق", done: false },
    ],
  };

  const completedTasks = ticket.tasks.filter((t) => t.done).length;
  const progress = Math.round((completedTasks / ticket.tasks.length) * 100);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Link
        to="/tickets"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight size={16} />
        العودة للتذاكر
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-sm text-gray-500 mt-1">تذكرة #{ticket.id}</p>
          </div>
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
            قيد التنفيذ
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={14} className="text-brand-teal" />
            <span>{ticket.zone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User size={14} className="text-brand-teal" />
            <span>{ticket.assignedTo}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} className="text-brand-teal" />
            <span>الموعد: 26 فبراير 2:00 م</span>
          </div>
          <div className="flex items-center gap-2 text-orange-600 font-medium">
            أولوية عالية
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">التقدم</h2>
          <span className="text-sm text-gray-500">
            {completedTasks} / {ticket.tasks.length} مهام
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-brand-teal h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{progress}% مكتمل</p>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">قائمة المهام</h2>
        <div className="space-y-3">
          {ticket.tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                task.done
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-gray-100 hover:border-brand-teal/30"
              }`}
            >
              {task.done ? (
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={20} className="text-gray-300 shrink-0" />
              )}
              <span
                className={`text-sm flex-1 ${
                  task.done ? "text-gray-400 line-through" : "text-gray-700"
                }`}
              >
                {task.title}
              </span>
              {!task.done && (
                <button className="text-gray-400 hover:text-brand-teal p-1 rounded">
                  <Camera size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 bg-brand-teal text-white py-3 rounded-xl font-medium hover:bg-brand-teal/90 transition-colors">
          تحديث الحالة
        </button>
        <button className="px-6 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          إضافة ملاحظة
        </button>
      </div>
    </div>
  );
}
