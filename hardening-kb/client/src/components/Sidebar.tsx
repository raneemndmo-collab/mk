/**
 * Sidebar - Right-side navigation (RTL)
 * Design: Dark steel panel with gold active indicators
 */
import { sections, getSectionStats } from "@/lib/data";
import {
  FileText, ShieldCheck, Server, Gauge, Lock, Search,
  Eye, BarChart3, Activity, ListChecks, Rocket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, ShieldCheck, Server, Gauge, Lock, Search,
  Eye, BarChart3, Activity, ListChecks, Rocket,
};

interface SidebarProps {
  activeSection: string | null;
  onSectionClick: (id: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ activeSection, onSectionClick, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 lg:z-auto
          top-0 right-0 h-full lg:h-auto
          w-64 lg:w-56 xl:w-64
          bg-[oklch(0.13_0.005_270)] border-l border-border
          overflow-y-auto scrollbar-vault
          transition-transform duration-300 lg:transition-none
          ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden p-4 border-b border-border">
          <h2 className="text-sm font-bold text-gold" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
            الأقسام
          </h2>
        </div>

        <nav className="p-2 space-y-0.5">
          {sections.map((section) => {
            const Icon = iconMap[section.icon] || FileText;
            const stats = getSectionStats(section);
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-right
                  transition-all duration-200 group relative
                  ${isActive
                    ? "bg-gold/10 border border-gold/20"
                    : "hover:bg-secondary/60 border border-transparent"
                  }
                `}
              >
                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gold rounded-l"
                  />
                )}

                {/* Section number */}
                <span className={`
                  text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0
                  ${isActive ? "bg-gold text-background" : "bg-secondary text-muted-foreground"}
                `}>
                  {section.number}
                </span>

                {/* Icon */}
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-gold" : "text-muted-foreground group-hover:text-foreground"} transition-colors`} />

                {/* Title */}
                <span className={`text-xs flex-1 truncate ${isActive ? "text-gold font-semibold" : "text-foreground/80 group-hover:text-foreground"} transition-colors`}>
                  {section.titleShort}
                </span>

                {/* Progress dot */}
                {stats && (
                  <span className={`
                    w-2 h-2 rounded-full shrink-0
                    ${stats.progress === 100 ? "bg-emerald" :
                      stats.progress > 50 ? "bg-amber" :
                      stats.progress > 0 ? "bg-gold-dim" : "bg-ruby"}
                  `} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            تاريخ: 24 فبراير 2026
            <br />
            المؤلف: Manus AI
            <br />
            الحالة: مسودة
          </p>
        </div>
      </aside>
    </>
  );
}
