import { MapPin, Star, Filter } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";

export default function Search() {
  const [params] = useSearchParams();
  const city = params.get("city") ?? "all";

  return (
    <div className="min-h-screen bg-cobnb-bg">
      {/* Top bar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-cobnb-primary">
          COBNB
        </Link>
        <span className="text-sm text-cobnb-light">
          Results for: <strong className="text-cobnb-dark capitalize">{city}</strong>
        </span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          {["All", "Studio", "1 BR", "2 BR", "3+ BR"].map((f) => (
            <button
              key={f}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm text-cobnb-dark hover:border-cobnb-primary hover:text-cobnb-primary transition-colors whitespace-nowrap"
            >
              {f}
            </button>
          ))}
          <button className="px-4 py-2 rounded-full border border-gray-200 text-sm text-cobnb-dark hover:border-cobnb-primary flex items-center gap-1">
            <Filter size={14} />
            More filters
          </button>
        </div>

        {/* Empty state */}
        <div className="bg-white rounded-xl p-12 text-center">
          <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-cobnb-dark font-medium">No units found</p>
          <p className="text-cobnb-light text-sm mt-1">
            Connect the database to display available units
          </p>
        </div>
      </div>
    </div>
  );
}
