import { Users, MapPin, Clock } from "lucide-react";

export default function Assignments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التعيينات</h1>
        <p className="text-gray-500 text-sm mt-1">إدارة تعيين الفرق للتذاكر</p>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: "فريق التنظيف - الرياض", members: 4, active: 2, zone: "الرياض" },
          { name: "فريق التنظيف - جدة", members: 3, active: 1, zone: "جدة" },
          { name: "فريق الصيانة", members: 2, active: 0, zone: "الكل" },
        ].map((team) => (
          <div
            key={team.name}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-brand-teal/10 p-2 rounded-lg">
                <Users size={18} className="text-brand-teal" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{team.name}</h3>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {team.members} أعضاء
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {team.active} نشط
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {team.zone}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment Board */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <Users size={48} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">لوحة التعيينات</p>
        <p className="text-gray-400 text-sm mt-1">
          قم بتوصيل قاعدة البيانات لعرض وإدارة تعيينات الفرق
        </p>
      </div>
    </div>
  );
}
