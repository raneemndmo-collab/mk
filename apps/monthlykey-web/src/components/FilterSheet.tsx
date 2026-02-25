import { useState, useEffect, useRef } from "react";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";

/**
 * FilterSheet — advanced property filters.
 * Mobile: slides up as a bottom sheet overlay.
 * Desktop: drops down as a panel below the trigger.
 */

export interface FilterValues {
  city: string;
  type: string;
  minBudget: string;
  maxBudget: string;
  bedrooms: string;
}

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onApply: () => void;
  onReset: () => void;
}

const CITIES = [
  { value: "", label: "الكل" },
  { value: "الرياض", label: "الرياض" },
  { value: "جدة", label: "جدة" },
  { value: "الدمام", label: "الدمام" },
  { value: "مكة", label: "مكة المكرمة" },
  { value: "المدينة", label: "المدينة المنورة" },
  { value: "الخبر", label: "الخبر" },
  { value: "أبها", label: "أبها" },
  { value: "تبوك", label: "تبوك" },
];

const TYPES = [
  { value: "", label: "الكل" },
  { value: "شقة", label: "شقة" },
  { value: "فيلا", label: "فيلا" },
  { value: "استوديو", label: "استوديو" },
  { value: "غرفة مفروشة", label: "غرفة مفروشة" },
  { value: "دوبلكس", label: "دوبلكس" },
  { value: "مجمع سكني", label: "مجمع سكني" },
  { value: "شقة فندقية", label: "شقة فندقية" },
];

const BEDROOMS = [
  { value: "", label: "الكل" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
];

export default function FilterSheet({
  open,
  onOpenChange,
  values,
  onChange,
  onApply,
  onReset,
}: FilterSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click (desktop)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    // Delay to avoid immediate close from trigger click
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onOpenChange]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (open && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const update = (key: keyof FilterValues, val: string) => {
    onChange({ ...values, [key]: val });
  };

  const activeCount = Object.values(values).filter(Boolean).length;

  if (!open) return null;

  const filterContent = (
    <div className="space-y-5">
      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-mk-navy mb-2">المدينة</label>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button
              key={c.value}
              onClick={() => update("city", c.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                values.city === c.value
                  ? "bg-mk-teal text-white border-mk-teal"
                  : "bg-white text-gray-600 border-gray-200 hover:border-mk-teal/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-semibold text-mk-navy mb-2">نوع العقار</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => update("type", t.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                values.type === t.value
                  ? "bg-mk-teal text-white border-mk-teal"
                  : "bg-white text-gray-600 border-gray-200 hover:border-mk-teal/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-semibold text-mk-navy mb-2">الميزانية (ر.س / شهر)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={values.minBudget}
            onChange={(e) => update("minBudget", e.target.value)}
            placeholder="من"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mk-teal/30 focus:border-mk-teal"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number"
            value={values.maxBudget}
            onChange={(e) => update("maxBudget", e.target.value)}
            placeholder="إلى"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mk-teal/30 focus:border-mk-teal"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="block text-sm font-semibold text-mk-navy mb-2">غرف النوم</label>
        <div className="flex gap-2">
          {BEDROOMS.map((b) => (
            <button
              key={b.value}
              onClick={() => update("bedrooms", b.value)}
              className={`w-12 h-10 rounded-lg text-sm border font-medium transition-colors ${
                values.bedrooms === b.value
                  ? "bg-mk-teal text-white border-mk-teal"
                  : "bg-white text-gray-600 border-gray-200 hover:border-mk-teal/50"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: bottom sheet overlay */}
      <div className="md:hidden fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        {/* Sheet */}
        <div
          ref={panelRef}
          className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-mk-navy text-lg">فلاتر البحث</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          {/* Content */}
          <div className="px-5 py-4">{filterContent}</div>
          {/* Actions */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
            <button
              onClick={onReset}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              إعادة تعيين
            </button>
            <button
              onClick={() => { onApply(); onOpenChange(false); }}
              className="flex-1 py-3 rounded-xl bg-mk-teal text-white text-sm font-medium hover:bg-mk-teal/90 transition-colors"
            >
              عرض النتائج
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: dropdown panel */}
      <div
        ref={panelRef}
        className="hidden md:block absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-40 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        {filterContent}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onReset}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            إعادة تعيين
          </button>
          <button
            onClick={() => { onApply(); onOpenChange(false); }}
            className="px-6 py-2.5 rounded-xl bg-mk-teal text-white text-sm font-medium hover:bg-mk-teal/90 transition-colors"
          >
            عرض النتائج
          </button>
        </div>
      </div>
    </>
  );
}

/** Trigger button for opening the filter sheet */
export function FilterTrigger({
  onClick,
  activeCount = 0,
}: {
  onClick: () => void;
  activeCount?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-mk-navy hover:border-mk-teal hover:text-mk-teal transition-colors bg-white relative"
    >
      <SlidersHorizontal size={15} />
      <span>فلاتر</span>
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-mk-teal text-white text-[10px] font-bold flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
}
