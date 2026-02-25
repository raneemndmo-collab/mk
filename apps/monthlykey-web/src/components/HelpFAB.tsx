import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Bot, Phone } from "lucide-react";

/**
 * HelpFAB — expandable floating action button.
 * Primary button expands to reveal WhatsApp + AI assistant options.
 * RTL-aware: bottom-left for AR, bottom-right for EN.
 * Safe-area padding for iOS.
 */

interface HelpFABProps {
  /** WhatsApp number in international format (e.g. "966501234567") */
  whatsappNumber?: string;
  /** Default WhatsApp message */
  whatsappMessage?: string;
  /** Callback when AI assistant is clicked */
  onAIClick?: () => void;
  /** Current locale for RTL positioning */
  locale?: "ar" | "en";
}

export default function HelpFAB({
  whatsappNumber = "966501234567",
  whatsappMessage = "مرحباً، أحتاج مساعدة بخصوص الإيجار الشهري",
  onAIClick,
  locale = "ar",
}: HelpFABProps) {
  const [expanded, setExpanded] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  // RTL: bottom-left. LTR: bottom-right.
  const positionClass = locale === "ar" ? "left-4" : "right-4";

  return (
    <div
      ref={fabRef}
      className={`fixed bottom-4 ${positionClass} z-40 flex flex-col items-center gap-3`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Expanded options — slide up */}
      {expanded && (
        <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* AI Assistant */}
          <button
            onClick={() => {
              onAIClick?.();
              setExpanded(false);
            }}
            className="group flex items-center gap-3 bg-white rounded-full shadow-lg border border-gray-100 pl-4 pr-2 py-2 hover:shadow-xl transition-all"
          >
            <span className="text-sm font-medium text-mk-navy whitespace-nowrap">
              المساعد الذكي
            </span>
            <div className="w-10 h-10 rounded-full bg-mk-navy flex items-center justify-center shrink-0">
              <Bot size={18} className="text-white" />
            </div>
          </button>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-white rounded-full shadow-lg border border-gray-100 pl-4 pr-2 py-2 hover:shadow-xl transition-all"
          >
            <span className="text-sm font-medium text-mk-navy whitespace-nowrap">
              واتساب
            </span>
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
              <Phone size={18} className="text-white" />
            </div>
          </a>
        </div>
      )}

      {/* Primary FAB */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:shadow-xl hover:scale-105 ${
          expanded
            ? "bg-gray-700 rotate-0"
            : "bg-mk-teal"
        }`}
        aria-label="مساعدة"
      >
        {expanded ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
      </button>
    </div>
  );
}
