/**
 * Admin Knowledge Base — loaded from docs/kb/ at server start
 *
 * This module reads the KB markdown files and provides them
 * for the Admin AI Copilot and Help Center page.
 */

import fs from "fs";
import path from "path";

const KB_DIR = path.resolve(process.cwd(), "docs/kb");

let kbAr = "";
let kbEn = "";

/** Load KB files from disk (called once at server start) */
export function loadAdminKB() {
  try {
    const arPath = path.join(KB_DIR, "kb.ar.md");
    const enPath = path.join(KB_DIR, "kb.en.md");
    if (fs.existsSync(arPath)) kbAr = fs.readFileSync(arPath, "utf-8");
    if (fs.existsSync(enPath)) kbEn = fs.readFileSync(enPath, "utf-8");
    console.log(`[AdminKB] Loaded: AR=${kbAr.length} chars, EN=${kbEn.length} chars`);
  } catch (err) {
    console.error("[AdminKB] Failed to load KB files:", err);
  }
}

/** Get KB content by language */
export function getAdminKB(lang: string): string {
  return lang === "ar" ? kbAr : kbEn;
}

/** Get KB content for AI Copilot injection (both languages for context) */
export function getAdminKBForCopilot(): string {
  return `## Arabic KB:\n${kbAr}\n\n## English KB:\n${kbEn}`;
}

/** Parse KB sections for Help Center display */
export function getKBSections(lang: string): Array<{ id: string; title: string; content: string }> {
  const raw = lang === "ar" ? kbAr : kbEn;
  if (!raw) return [];

  const sections: Array<{ id: string; title: string; content: string }> = [];
  // Split by ## headings (level 2)
  const parts = raw.split(/^## /gm).filter(Boolean);

  for (const part of parts) {
    const lines = part.split("\n");
    const titleLine = lines[0]?.trim() || "";
    // Extract ID from {#id} anchor if present
    const idMatch = titleLine.match(/\{#([^}]+)\}/);
    const id = idMatch ? idMatch[1] : titleLine.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const title = titleLine.replace(/\s*\{#[^}]+\}/, "").trim();
    const content = lines.slice(1).join("\n").trim();
    if (title) {
      sections.push({ id, title, content });
    }
  }

  return sections;
}

// Load on import
loadAdminKB();
