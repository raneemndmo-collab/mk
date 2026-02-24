/**
 * HeroSection - Landing view with vault imagery and section cards
 * Design: Full-width hero with circuit pattern overlay, section grid below
 */
import { motion } from "framer-motion";
import { sections, getSectionStats, getOverallStats } from "@/lib/data";
import {
  FileText, ShieldCheck, Server, Gauge, Lock, Search,
  Eye, BarChart3, Activity, ListChecks, Rocket, ArrowLeft
} from "lucide-react";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/NXMIeJYf0oP6FAo6uk3LFP/sandbox/atcvHy5WcfrvAwBNZRiftS-img-1_1771902418000_na1fn_aGVyby12YXVsdA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvTlhNSWVKWWYwb1A2RkFvNnVrM0xGUC9zYW5kYm94L2F0Y3ZIeTVXY2ZydkF3Qk5aUmlmdFMtaW1nLTFfMTc3MTkwMjQxODAwMF9uYTFmbl9hR1Z5YnkxMllYVnNkQS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=SNTVqMDNR0zzfPrC7M8Nv1SG0Nc4IwI~FO-XADrCwn2AhHEiK7tcIk01j20P9~Io8XbQgzclkc1mMCS~maEtmQXQAubRb7HNFmw-I7m~MRGJAyhJIiWufFL~Xh1gLaotkAKoGd9fwlUtTmDrfAc-yMal9SCr-hmeGEbPC28cH-vsHCK6y-9jkEKv61L1-klQ39M2sXEkxCMcV7Ul5VCaHkG4-vMLWwzwhPg3WvVtacVlCLHKUozaF2xeWbf4Zqkkim41x9NysjIl7jh8zsn91TT8Z5q6Au-hbi6ZOsQpp9YyMNbTYEBErbhwPgLwAt5FXaWPoB61L50jGn-nmTMMng__";

const PATTERN_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/NXMIeJYf0oP6FAo6uk3LFP/sandbox/atcvHy5WcfrvAwBNZRiftS-img-2_1771902414000_na1fn_cGF0dGVybi1jaXJjdWl0.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvTlhNSWVKWWYwb1A2RkFvNnVrM0xGUC9zYW5kYm94L2F0Y3ZIeTVXY2ZydkF3Qk5aUmlmdFMtaW1nLTJfMTc3MTkwMjQxNDAwMF9uYTFmbl9jR0YwZEdWeWJpMWphWEpqZFdsMC5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=cOxUZVQSNQsl3hzxVfkAb5w7lIqhWEKkK4RvP1Sx5Hz19D-c7TRTScAnMiVIt-zlzck1bKOXMjVVgoCi3QSXGENwf15smM4I6f0NdvuS7qO1P~AZXeZHMThAYCIl9oRwSAa0-gN-nn0ZeogNsMz~HWbQN0Hl6FugXSZbNDZ2C~LomSgnhIydxB8fpdFX04EPptGZsD7k1HlozwiSh4hYM3KrAUB7h2X4-kOI9o3harTeh9JhxV6yyw3n1h6JR2DiLx~3aeGN4fzNdw-JeeWBCGn8bP98GPtVt1~pz~2CxPP6t~0Syy1TE0jX6YYe0-fse5K-aA6r46iWMQX6MhQ89w__";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, ShieldCheck, Server, Gauge, Lock, Search,
  Eye, BarChart3, Activity, ListChecks, Rocket,
};

interface HeroSectionProps {
  onSectionClick: (id: string) => void;
}

export default function HeroSection({ onSectionClick }: HeroSectionProps) {
  const overall = getOverallStats();

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[340px] lg:h-[400px] overflow-hidden">
        {/* Background image */}
        <img
          src={HERO_IMG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 lg:p-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 max-w-12 bg-gold/40" />
              <span className="text-[10px] text-gold uppercase tracking-widest font-medium">
                PRODUCTION HARDENING
              </span>
            </div>
            <h2
              className="text-2xl lg:text-4xl font-bold text-foreground mb-3 leading-tight"
              style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
            >
              خطة تقوية الجاهزية للإنتاج
            </h2>
            <p className="text-sm lg:text-base text-foreground/70 max-w-xl leading-relaxed">
              وثيقة شاملة لتقوية موقع "المفتاح الشهري" ليكون جاهزًا للإنتاج وقادرًا على التعامل مع عدد كبير من الزوار.
            </p>

            {/* Overall progress bar */}
            <div className="mt-5 flex items-center gap-3">
              <div className="w-48 h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overall.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-l from-gold to-gold-dim"
                />
              </div>
              <span className="text-sm text-gold font-bold">{overall.progress}% مكتمل</span>
              <span className="text-xs text-muted-foreground">
                ({overall.done}/{overall.total} عنصر)
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section Grid */}
      <section className="p-4 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sections.map((section, index) => {
            const Icon = iconMap[section.icon] || FileText;
            const stats = getSectionStats(section);

            return (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() => onSectionClick(section.id)}
                className="vault-card rounded-lg p-4 text-right group"
              >
                <div className="flex items-start gap-3">
                  {/* Number badge */}
                  <span className="text-[10px] font-bold w-6 h-6 rounded bg-gold/10 text-gold flex items-center justify-center shrink-0 border border-gold/20">
                    {section.number}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4 text-gold/70 shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-gold transition-colors">
                        {section.titleShort}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {section.description}
                    </p>

                    {/* Progress */}
                    {stats && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stats.progress === 100 ? "bg-emerald" :
                              stats.progress > 50 ? "bg-gold" : "bg-ruby"
                            }`}
                            style={{ width: `${stats.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {stats.done}/{stats.total}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-all group-hover:-translate-x-1 shrink-0 mt-1" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Pattern section divider */}
      <section className="relative h-32 overflow-hidden opacity-30">
        <img src={PATTERN_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </section>
    </div>
  );
}
