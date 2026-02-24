/**
 * SearchOverlay - Full-screen search with instant results
 * Design: Dark overlay with gold-bordered search input
 */
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import type { Section } from "@/lib/data";
import { getSectionStats } from "@/lib/data";

interface SearchOverlayProps {
  query: string;
  onQueryChange: (q: string) => void;
  results: Section[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function SearchOverlay({ query, onQueryChange, results, onSelect, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl mx-4 bg-card border border-gold/20 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-gold shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="ابحث في قاعدة المعرفة..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto scrollbar-vault">
          {query.trim() === "" ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              اكتب للبحث في جميع الأقسام...
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              لا توجد نتائج لـ "{query}"
            </div>
          ) : (
            <div className="p-2">
              {results.map((section) => {
                const stats = getSectionStats(section);
                return (
                  <button
                    key={section.id}
                    onClick={() => onSelect(section.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-right group"
                  >
                    <span className="text-[10px] font-bold w-6 h-6 rounded bg-gold/10 text-gold flex items-center justify-center border border-gold/20 shrink-0">
                      {section.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-gold transition-colors truncate">
                        {section.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {section.description}
                      </p>
                    </div>
                    {stats && (
                      <span className="text-[10px] text-gold font-medium shrink-0">
                        {stats.progress}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{results.length} نتيجة</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary">↵</kbd>
            <span>للتحديد</span>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary">Esc</kbd>
            <span>للإغلاق</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
