import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mk_token", "placeholder");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mk-navy to-mk-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-mk-gold flex items-center justify-center font-bold text-mk-navy text-2xl mx-auto mb-4">
            MK
          </div>
          <h1 className="text-2xl font-bold text-white">المفتاح الشهري</h1>
          <p className="text-gray-400 mt-1">تسجيل الدخول لحسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mk-teal/30 focus:border-mk-teal"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mk-teal/30 focus:border-mk-teal"
              required
            />
          </div>
          <button type="submit" className="w-full bg-mk-teal text-white py-3 rounded-xl font-medium hover:bg-mk-teal/90 transition-colors">
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
