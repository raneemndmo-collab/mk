/**
 * ═══════════════════════════════════════════════════════════════
 *  LocationResolve — CoBnB Brand Component
 * ═══════════════════════════════════════════════════════════════
 *
 *  FULLY ADDITIVE — new file, does NOT modify any existing components.
 *
 *  Usage:
 *    <LocationResolve onResolved={(result) => { ... }} />
 *
 *  Features:
 *    - Paste Google Maps link + "تحليل الموقع" button
 *    - Shows address preview after resolve
 *    - Editable unit_number and address_notes fields
 *    - Shows degraded state indicator
 *    - RTL Arabic layout
 *    - Matches CoBnB brand colors
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from "react";
import { MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

export interface LocationResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string | null;
  google_maps_url: string;
  unit_number: string | null;
  address_notes: string | null;
  degraded: boolean;
  resolution_quality: "full" | "coords_only" | "geocoded";
  resolved_via: string;
  cached: boolean;
}

interface Props {
  onResolved?: (result: LocationResult) => void;
  onError?: (error: { code: string; message: string; retryable: boolean }) => void;
  initialUrl?: string;
  initialUnitNumber?: string;
  initialAddressNotes?: string;
  disabled?: boolean;
}

// ─── API Base URL ─────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// ─── Component ────────────────────────────────────────────────

export default function LocationResolve({
  onResolved,
  onError,
  initialUrl = "",
  initialUnitNumber = "",
  initialAddressNotes = "",
  disabled = false,
}: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [unitNumber, setUnitNumber] = useState(initialUnitNumber);
  const [addressNotes, setAddressNotes] = useState(initialAddressNotes);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = useCallback(async () => {
    if (!url.trim()) {
      setError("الرجاء لصق رابط خرائط جوجل");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/location/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_maps_url: url.trim(),
          unit_number: unitNumber.trim() || null,
          address_notes: addressNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.message || "فشل في تحليل الموقع";
        setError(errMsg);
        onError?.({ code: data.code || "UNKNOWN", message: errMsg, retryable: data.retryable ?? false });
        return;
      }

      setResult(data as LocationResult);
      onResolved?.(data as LocationResult);
    } catch {
      const msg = "خطأ في الاتصال بالخادم";
      setError(msg);
      onError?.({ code: "NETWORK_ERROR", message: msg, retryable: true });
    } finally {
      setLoading(false);
    }
  }, [url, unitNumber, addressNotes, onResolved, onError]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Section Header */}
      <div className="flex items-center gap-2 text-mk-navy">
        <MapPin size={18} />
        <h3 className="font-semibold text-sm">الموقع على الخريطة</h3>
      </div>

      {/* Google Maps URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          رابط خرائط جوجل
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="الصق رابط Google Maps هنا..."
            disabled={disabled || loading}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mk-teal/30 focus:border-mk-teal disabled:bg-gray-50 disabled:text-gray-400"
            dir="ltr"
          />
          <button
            type="button"
            onClick={handleResolve}
            disabled={disabled || loading || !url.trim()}
            className="bg-mk-teal text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-mk-teal/90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري التحليل...
              </>
            ) : (
              "تحليل الموقع"
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Resolved Preview */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  {result.formatted_address || "عنوان غير متوفر"}
                </p>
                <p className="text-xs text-emerald-600 mt-1 font-mono" dir="ltr">
                  {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {result.degraded && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">تقريبي</span>
              )}
              {result.cached && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">مؤقت</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unit Number + Address Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            رقم الوحدة <span className="text-gray-400 text-xs">(اختياري)</span>
          </label>
          <input
            type="text"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            placeholder="مثال: شقة 305"
            disabled={disabled}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mk-teal/30 focus:border-mk-teal disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ملاحظات العنوان <span className="text-gray-400 text-xs">(اختياري)</span>
          </label>
          <input
            type="text"
            value={addressNotes}
            onChange={(e) => setAddressNotes(e.target.value)}
            placeholder="مثال: البوابة الشمالية"
            disabled={disabled}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mk-teal/30 focus:border-mk-teal disabled:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
}
