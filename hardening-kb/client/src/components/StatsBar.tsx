/**
 * StatsBar - Top bar showing overall progress and search
 * Design: Dark steel bar with gold accent line at bottom
 */
import { Search, Menu, Shield, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { getOverallStats } from "@/lib/data";

interface StatsBarProps {
  onSearchClick: () => void;
  onMenuClick: () => void;
}

export default function StatsBar({ onSearchClick, onMenuClick }: StatsBarProps) {
  const stats = getOverallStats();

  return (
    <header className="relative z-30 border-b border-border bg-[oklch(0.14_0.005_270)]">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Right side - Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5 text-gold" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gold font-[var(--font-display)]" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
                المفتاح الشهري
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none">
                قاعدة معرفة التقوية الإنتاجية
              </p>
            </div>
          </div>
        </div>

        {/* Center - Stats */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
            <span className="text-xs text-emerald font-medium">{stats.done} مكتمل</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber" />
            <span className="text-xs text-amber font-medium">{stats.partial} جزئي</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-ruby" />
            <span className="text-xs text-ruby font-medium">{stats.missing} غير مطبق</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-gold to-gold-dim transition-all duration-700"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="text-xs text-gold font-bold">{stats.progress}%</span>
          </div>
        </div>

        {/* Left side - Search */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:border-gold/30 bg-secondary/50 transition-all group"
        >
          <Search className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors hidden sm:inline">
            بحث...
          </span>
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Gold accent line */}
      <div className="gold-line" />
    </header>
  );
}
