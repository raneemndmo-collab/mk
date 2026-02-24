import { Search, MapPin, Calendar, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    navigate(`/search?${params}`);
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cobnb-primary">COBNB</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-cobnb-dark hover:text-cobnb-primary transition-colors"
          >
            Login
          </button>
          <button className="bg-cobnb-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cobnb-primary/90 transition-colors">
            List your place
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-cobnb-primary/5 to-orange-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-cobnb-dark mb-4">
            Short-term stays,{" "}
            <span className="text-cobnb-primary">Saudi style</span>
          </h2>
          <p className="text-cobnb-light text-lg mb-8 max-w-2xl mx-auto">
            Premium furnished apartments for daily and weekly stays across Riyadh, Jeddah, and beyond.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-2xl shadow-lg p-2 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl hover:bg-gray-50">
              <MapPin size={18} className="text-cobnb-light shrink-0" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              >
                <option value="">Where to?</option>
                <option value="riyadh">Riyadh</option>
                <option value="jeddah">Jeddah</option>
                <option value="dammam">Dammam</option>
                <option value="makkah">Makkah</option>
                <option value="madinah">Madinah</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl hover:bg-gray-50">
              <Calendar size={18} className="text-cobnb-light shrink-0" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                placeholder="Check-in"
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl hover:bg-gray-50">
              <Calendar size={18} className="text-cobnb-light shrink-0" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                placeholder="Check-out"
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-cobnb-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium hover:bg-cobnb-primary/90 transition-colors"
            >
              <Search size={18} />
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Featured Cities */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-cobnb-dark mb-6">Popular destinations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Riyadh", units: "120+ units" },
            { name: "Jeddah", units: "85+ units" },
            { name: "Dammam", units: "45+ units" },
            { name: "Makkah", units: "60+ units" },
          ].map((city) => (
            <div
              key={city.name}
              onClick={() => navigate(`/search?city=${city.name.toLowerCase()}`)}
              className="bg-white rounded-xl border border-gray-100 p-6 cursor-pointer hover:shadow-md hover:border-cobnb-primary/20 transition-all"
            >
              <MapPin size={24} className="text-cobnb-primary mb-3" />
              <h4 className="font-semibold text-cobnb-dark">{city.name}</h4>
              <p className="text-sm text-cobnb-light">{city.units}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cobnb-dark text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <h4 className="text-xl font-bold text-cobnb-primary mb-2">COBNB</h4>
            <p className="text-gray-400 text-sm">Short-term stays in Saudi Arabia</p>
          </div>
          <div className="text-sm text-gray-400">
            <p>&copy; 2026 COBNB. All rights reserved.</p>
            <p className="mt-1">A Monthly Key brand</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
