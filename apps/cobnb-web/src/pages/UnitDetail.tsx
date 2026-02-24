import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Wifi, Car, Wind, Tv } from "lucide-react";

export default function UnitDetail() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-cobnb-primary">COBNB</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/search" className="inline-flex items-center gap-1 text-sm text-cobnb-light hover:text-cobnb-dark mb-4">
          <ArrowLeft size={16} /> Back to search
        </Link>

        {/* Photo placeholder */}
        <div className="bg-gray-100 rounded-2xl h-64 md:h-96 flex items-center justify-center mb-6">
          <p className="text-gray-400">Unit photos will load from Beds24</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-cobnb-dark">Unit #{id}</h1>
              <div className="flex items-center gap-2 text-cobnb-light text-sm mt-1">
                <MapPin size={14} />
                <span>Location will load from database</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-cobnb-dark mb-3">Amenities</h3>
              <div className="grid grid-cols-2 gap-3 text-sm text-cobnb-light">
                {[
                  { icon: Wifi, label: "Free WiFi" },
                  { icon: Car, label: "Free parking" },
                  { icon: Wind, label: "Air conditioning" },
                  { icon: Tv, label: "Smart TV" },
                ].map((a) => (
                  <div key={a.label} className="flex items-center gap-2">
                    <a.icon size={16} className="text-cobnb-primary" />
                    {a.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit sticky top-6">
            <div className="text-center mb-4">
              <span className="text-2xl font-bold text-cobnb-dark">—</span>
              <span className="text-cobnb-light text-sm"> SAR / night</span>
            </div>
            <button className="w-full bg-cobnb-primary text-white py-3 rounded-xl font-medium hover:bg-cobnb-primary/90 transition-colors">
              Check availability
            </button>
            <p className="text-xs text-cobnb-light text-center mt-3">
              No login required to browse
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
