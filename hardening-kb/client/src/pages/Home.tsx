/**
 * Home Page - Technical Vault Knowledge Base
 * Design: Dark charcoal (#0A0A0F) + Gold copper (#C8A55C)
 * Layout: Fixed sidebar (right RTL) + scrollable content
 */
import { useState, useMemo, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import HeroSection from "@/components/HeroSection";
import SectionView from "@/components/SectionView";
import SearchOverlay from "@/components/SearchOverlay";
import StatsBar from "@/components/StatsBar";
import { sections } from "@/lib/data";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.content.some((c) => c.toLowerCase().includes(q)) ||
        s.items?.some((i) => i.text.toLowerCase().includes(q) || i.details?.toLowerCase().includes(q)) ||
        s.subsections?.some(
          (sub) =>
            sub.title.toLowerCase().includes(q) ||
            sub.content.some((c) => c.toLowerCase().includes(q))
        )
    );
  }, [searchQuery]);

  const handleSectionClick = useCallback((id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    // Scroll to top of content
    const el = document.getElementById("content-area");
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearchToggle = useCallback(() => {
    setSearchOpen((prev) => !prev);
    if (searchOpen) setSearchQuery("");
  }, [searchOpen]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" dir="rtl">
      {/* Stats Bar - Top */}
      <StatsBar onSearchClick={handleSearchToggle} onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Right side (RTL) */}
        <Sidebar
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <main
          id="content-area"
          className="flex-1 overflow-y-auto scrollbar-vault"
        >
          {activeSection === null ? (
            <div>
              <HeroSection onSectionClick={handleSectionClick} />
            </div>
          ) : (
            <SectionView
              section={filteredSections.find((s) => s.id === activeSection) || sections.find((s) => s.id === activeSection)!}
              onBack={() => setActiveSection(null)}
              searchQuery={searchQuery}
            />
          )}
        </main>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <SearchOverlay
          query={searchQuery}
          onQueryChange={setSearchQuery}
          results={filteredSections}
          onSelect={(id: string) => {
            handleSectionClick(id);
            setSearchOpen(false);
            setSearchQuery("");
          }}
          onClose={() => {
            setSearchOpen(false);
            setSearchQuery("");
          }}
        />
      )}
    </div>
  );
}
