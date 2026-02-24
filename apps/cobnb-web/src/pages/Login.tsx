import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST to adapter /api/v1/auth/login
    localStorage.setItem("cobnb_token", "placeholder");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-cobnb-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-cobnb-primary">COBNB</Link>
          <p className="text-cobnb-light mt-2">Log in to book your next stay</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cobnb-dark mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobnb-primary/30"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cobnb-dark mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobnb-primary/30"
              required
            />
          </div>
          <button type="submit" className="w-full bg-cobnb-primary text-white py-3 rounded-xl font-medium hover:bg-cobnb-primary/90 transition-colors">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
