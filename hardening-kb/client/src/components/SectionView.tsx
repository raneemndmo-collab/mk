/**
 * SectionView - Displays a single section's full content
 * Design: Dark vault card style with gold accents
 */
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Section, CheckItem } from "@/lib/data";
import { getStatusLabel, getPriorityLabel, getSectionStats } from "@/lib/data";

interface SectionViewProps {
  section: Section;
  onBack: () => void;
  searchQuery?: string;
}

function StatusIcon({ status }: { status: CheckItem["status"] }) {
  switch (status) {
    case "done": return <CheckCircle2 className="w-4 h-4 text-emerald" />;
    case "partial": return <AlertTriangle className="w-4 h-4 text-amber" />;
    case "missing": return <XCircle className="w-4 h-4 text-ruby" />;
    case "unknown": return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

function PriorityBadge({ priority }: { priority: CheckItem["priority"] }) {
  const colors = {
    critical: "bg-ruby/15 text-ruby border-ruby/20",
    high: "bg-amber/15 text-amber border-amber/20",
    medium: "bg-gold/15 text-gold border-gold/20",
    low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border ${colors[priority]}`}>
      {getPriorityLabel(priority)}
    </span>
  );
}

function CheckItemCard({ item }: { item: CheckItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="vault-card rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-right"
      >
        <StatusIcon status={item.status} />
        <span className="flex-1 text-sm text-foreground">{item.text}</span>
        <PriorityBadge priority={item.priority} />
        <span className={`text-[10px] px-2 py-0.5 rounded border ${
          item.status === "done" ? "bg-emerald/15 text-emerald border-emerald/20" :
          item.status === "partial" ? "bg-amber/15 text-amber border-amber/20" :
          item.status === "missing" ? "bg-ruby/15 text-ruby border-ruby/20" :
          "bg-muted text-muted-foreground border-border"
        }`}>
          {getStatusLabel(item.status)}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border px-3 py-3 bg-secondary/30"
        >
          {item.details && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.details}</p>
          )}
          {item.verification && (
            <div className="flex items-center gap-2 text-xs text-gold/80">
              <span className="font-medium">التحقق:</span>
              <span>{item.verification}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function SectionView({ section, onBack }: SectionViewProps) {
  const stats = getSectionStats(section);

  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-6 group"
      >
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        <span>العودة للرئيسية</span>
      </motion.button>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold w-8 h-8 rounded-md bg-gold/10 text-gold flex items-center justify-center border border-gold/20">
            {section.number}
          </span>
          <div className="h-px flex-1 bg-gold/20" />
        </div>
        <h2
          className="text-xl lg:text-2xl font-bold text-foreground mb-2"
          style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
        >
          {section.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>

        {/* Progress bar */}
        {stats && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 max-w-xs h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${
                  stats.progress === 100 ? "bg-emerald" :
                  stats.progress > 50 ? "bg-gold" : "bg-ruby"
                }`}
              />
            </div>
            <span className="text-sm text-gold font-bold">{stats.progress}%</span>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-emerald">{stats.done} مكتمل</span>
              <span className="text-amber">{stats.partial} جزئي</span>
              <span className="text-ruby">{stats.missing} غير مطبق</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Content paragraphs */}
      {section.content.map((paragraph, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
          className="text-sm text-foreground/80 leading-relaxed mb-4"
        >
          {paragraph}
        </motion.p>
      ))}

      {/* Tables */}
      {section.tables?.map((table, ti) => (
        <motion.div
          key={ti}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="vault-card rounded-lg overflow-hidden mb-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20 bg-gold/5">
                  {table.headers.map((h, hi) => (
                    <th key={hi} className="text-right px-4 py-3 text-xs font-semibold text-gold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    {row.cells.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-xs text-foreground/80">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ))}

      {/* Subsections */}
      {section.subsections?.map((sub, si) => (
        <motion.div
          key={si}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + si * 0.05 }}
          className="mb-6"
        >
          <h3 className="text-base font-semibold text-gold/90 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            {sub.title}
          </h3>
          {sub.content.map((p, pi) => (
            <p key={pi} className="text-sm text-foreground/70 leading-relaxed mb-2 mr-4">
              {p}
            </p>
          ))}
          {sub.items && (
            <div className="space-y-2 mt-3 mr-4">
              {sub.items.map((item) => (
                <CheckItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* Check items */}
      {section.items && section.items.length > 0 && (
        <div className="space-y-2 mt-6">
          <h3 className="text-sm font-semibold text-gold/80 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            قائمة العناصر
          </h3>
          {section.items.map((item, ii) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + ii * 0.03 }}
            >
              <CheckItemCard item={item} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-16" />
    </div>
  );
}
