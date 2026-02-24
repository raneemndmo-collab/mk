import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "لوحة التحكم" },
  { to: "/tickets", icon: ClipboardList, label: "التذاكر" },
  { to: "/tickets/new", icon: PlusCircle, label: "تذكرة جديدة" },
  { to: "/assignments", icon: Users, label: "التعيينات" },
  { to: "/reports", icon: BarChart3, label: "التقارير" },
];

export default function OpsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("ops_token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-brand-navy text-white transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center font-bold text-brand-navy text-sm">
              MK
            </div>
            <div>
              <h1 className="font-bold text-sm">بوابة العمليات</h1>
              <p className="text-xs text-gray-400">Cleaning & Maintenance</p>
            </div>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-brand-teal/20 text-brand-teal font-medium"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h2 className="font-semibold text-gray-800">نظام إدارة العمليات</h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
