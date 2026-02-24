import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST to /api/v1/auth/login
    // For now, accept any credentials
    localStorage.setItem("ops_token", "placeholder");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-brand-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-gold flex items-center justify-center font-bold text-brand-navy text-2xl mx-auto mb-4">
            MK
          </div>
          <h1 className="text-2xl font-bold text-white">بوابة العمليات</h1>
          <p className="text-gray-400 mt-1">تسجيل الدخول لنظام التنظيف والصيانة</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@monthlykey.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-teal text-white py-3 rounded-xl font-medium hover:bg-brand-teal/90 transition-colors"
          >
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
