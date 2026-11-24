"use client";

import React, { useMemo } from "react";
import { DocItem } from "@/lib/docs";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { MermaidRenderer } from "@/components/docs/MermaidRenderer";

let targetRelHookRegistered = false;
function ensureTargetRelHook() {
  if (targetRelHookRegistered) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  targetRelHookRegistered = true;
}
import { InteractiveApiExplorer } from "./InteractiveApiExplorer";
import { InteractiveArchitectureView } from "./InteractiveArchitectureView";
import { InteractiveModelCard } from "./InteractiveModelCard";
import { InteractiveStationRegistry } from "./InteractiveStationRegistry";
import {
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface StructuredDocRendererProps {
  doc: DocItem;
}

export function StructuredDocRenderer({ doc }: StructuredDocRendererProps) {
  // Determine if this doc warrants an embedded interactive workbench
  const isApiDoc = useMemo(
    () =>
      doc.id.includes("api") ||
      doc.title.toLowerCase().includes("api reference") ||
      doc.path.includes("API"),
    [doc]
  );

  const isArchitectureDoc = useMemo(
    () =>
      doc.id.includes("system-architecture") ||
      doc.id.includes("overview") ||
      doc.title.toLowerCase().includes("architecture"),
    [doc]
  );

  const isModelDoc = useMemo(
    () =>
      doc.id.includes("model") ||
      doc.id.includes("forecast") ||
      doc.title.toLowerCase().includes("hydrological model"),
    [doc]
  );

  const isStationDoc = useMemo(
    () =>
      doc.id.includes("station") ||
      doc.title.toLowerCase().includes("station") ||
      doc.title.toLowerCase().includes("telemetry"),
    [doc]
  );

  // Question-led section header mapping for clarity
  const formatQuestionTitle = (title: string, index: number) => {
    // If the title is already phrased as a question, keep it
    if (title.endsWith("?")) return title;

    // Clean numeric prefix if present (e.g., "1. Scope" -> "Scope")
    const clean = title.replace(/^\d+[\.\)]\s*/, "").trim();

    // Context-sensitive phrasing for standard section headers
    if (/scope|boundary/i.test(clean)) return `What is within the operational boundary and scope?`;
    if (/objective|purpose|why/i.test(clean)) return `Why was this operational capability defined?`;
    if (/overview|introduction/i.test(clean)) return `What is the objective of this specification?`;
    if (/geograph|corridor|patna|gandhi/i.test(clean)) return `What geographical area does this cover?`;
    if (/architecture|pipeline|flow/i.test(clean)) return `How is the pipeline structured and verified?`;
    if (/methodology|model|predict/i.test(clean)) return `How do the predictive models calculate risk?`;
    if (/station|telemetry|sensor|gauge/i.test(clean)) return `Where are observations measured and ingested?`;
    if (/api|endpoint|request/i.test(clean)) return `How do clients interact with the verified endpoints?`;
    if (/safety|supervisory|review|human/i.test(clean)) return `How does human supervisory review safeguard outputs?`;
    if (/simulat|advisory|offline/i.test(clean)) return `Which capabilities are simulated or advisory only?`;
    if (/outside|limit|unsupported/i.test(clean)) return `What is explicitly outside the current scope?`;
    if (/implementation|evidence|test/i.test(clean)) return `What evidence validates this implementation?`;
    if (/learn|resource|next|reference/i.test(clean)) return `Where can developers and researchers learn more?`;
    return clean;
  };

  // Parse sections based on ## Headings, completely omitting any "Document Metadata"
  const parsedSections = useMemo(() => {
    const raw = doc.content;
    const lines = raw.split("\n");

    const sections: {
      title: string;
      rawTitle: string;
      id: string;
      level: number;
      lines: string[];
    }[] = [];

    let currentSection = {
      title: "Overview",
      rawTitle: "Overview",
      id: "overview",
      level: 2,
      lines: [] as string[],
    };

    let inCode = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith("```")) {
        inCode = !inCode;
      }

      if (!inCode && line.trim().startsWith("## ")) {
        const rawTitle = line.trim().replace(/^##\s+/, "").trim();
        const cleanTitle = rawTitle.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*`_]/g, "");

        // Completely omit metadata section
        if (/metadata/i.test(cleanTitle) || /document metadata/i.test(rawTitle)) {
          continue;
        }

        if (currentSection.lines.length > 0 && !/metadata/i.test(currentSection.title)) {
          sections.push(currentSection);
        }

        const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        currentSection = {
          title: cleanTitle,
          rawTitle,
          id: id || `section-${sections.length}`,
          level: 2,
          lines: [],
        };
      } else {
        // Skip metadata lines even if they are in the preamble before the first header
        if (
          line.trim().startsWith("- **Document ID**:") ||
          line.trim().startsWith("- **Version**:") ||
          line.trim().startsWith("- **Status**:") ||
          line.trim().startsWith("- **Owner**:") ||
          line.trim().startsWith("- **Created Date**:") ||
          line.trim().startsWith("- **Last Updated**:") ||
          line.trim().startsWith("- **Last Verified Against Commit**:") ||
          line.trim().startsWith("- **Applicable Module**:") ||
          line.trim().startsWith("- **Related Documents**:")
        ) {
          continue;
        }

        currentSection.lines.push(line);
      }
    }

    if (currentSection.lines.length > 0 && !/metadata/i.test(currentSection.title)) {
      sections.push(currentSection);
    }

    // Filter out any section that only has metadata or is titled metadata
    return sections.filter((s) => !/metadata/i.test(s.title) && !/metadata/i.test(s.rawTitle));
  }, [doc]);

  // Generate dynamic key takeaways
  const keyTakeaways = useMemo(() => {
    if (doc.id.includes("scope") || doc.id.includes("boundary")) {
      return [
        "What SURAKSHA currently covers in production.",
        "Geographical study boundaries across the Patna Middle Ganga corridor.",
        "Which predictive and hydrological capabilities are fully implemented.",
        "What is simulated, synthetic, or advisory only for safety.",
        "What remains explicitly outside operational boundaries.",
      ];
    }
    if (doc.id.includes("api")) {
      return [
        "Verified REST contracts for pipeline simulation and telemetry.",
        "Authentication requirements and operator API key protection.",
        "Deterministic synthetic scenario execution parameters.",
        "Response schemas and error handling conventions.",
      ];
    }
    if (doc.id.includes("model") || doc.id.includes("forecast")) {
      return [
        "Hydrological modeling architecture (BiLSTM, SARIMA, Ensemble).",
        "Forecast horizons and 90% uncertainty confidence intervals.",
        "Datum benchmarks (CWC Gandhi Ghat 44.20m baseline).",
        "Deterministic simulator mode vs. live physical telemetry.",
      ];
    }
    // Generic high-value takeaways derived from section titles
    return parsedSections
      .filter((s) => s.title !== "Overview" && s.title !== "References")
      .slice(0, 4)
      .map((s) => `Deep dive into ${s.title.toLowerCase()}.`);
  }, [doc.id, parsedSections]);

  // Render a block of markdown text into clean HTML
  const renderSectionHtml = (rawText: string) => {
    let text = rawText;

    // Filter out redundant metadata tables or bullets
    text = text.replace(/\| Field \| Value \|[\s\S]*?(?=\n\n[^\s|]|\n?$)/gi, "");
    text = text.replace(/\| Attribute \| Detail \|[\s\S]*?(?=\n\n[^\s|]|\n?$)/gi, "");
    text = text.replace(/## Document Metadata[\s\S]*?(?=\n---|\n##|$)/gi, "");
    text = text.replace(/-\s*\*\*Document ID\*\*:.*$/gim, "");
    text = text.replace(/-\s*\*\*Last Verified Against Commit\*\*:.*$/gim, "");

    // Replace Callouts > [!NOTE] etc. with clean editorial styles
    text = text.replace(
      />\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)(?=(?:\n\n[^\s>]|\n?$))/gi,
      (match, type, body) => {
        const typeUpper = type.toUpperCase();
        let borderClass = "border-emerald-500 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-200";
        let label = "NOTE";

        if (typeUpper === "WARNING" || typeUpper === "CAUTION") {
          borderClass = "border-amber-500 bg-amber-500/[0.06] text-amber-900 dark:text-amber-200";
          label = "WARNING";
        } else if (typeUpper === "IMPORTANT") {
          borderClass = "border-rose-500 bg-rose-500/[0.06] text-rose-900 dark:text-rose-200";
          label = "CRITICAL REQUIREMENT";
        } else if (typeUpper === "TIP") {
          borderClass = "border-teal-500 bg-teal-500/[0.06] text-teal-900 dark:text-teal-200";
          label = "ENGINEERING TIP";
        }

        return `<div class="my-6 p-4 rounded-xl border-l-4 ${borderClass} text-xs sm:text-sm leading-relaxed"><div class="font-mono font-bold uppercase tracking-wider mb-1 text-[11px]">${label}</div><div>${body.trim()}</div></div>`;
      }
    );

    try {
      marked.setOptions({ gfm: true, breaks: false });
      const rawHtml = marked.parse(text) as string;

      // Add modern clean classes to tables
      const styledHtml = rawHtml
        .replace(
          /<table>/gi,
          '<div class="my-6 rounded-xl border border-[var(--border)] overflow-x-auto shadow-xs"><table class="w-full text-left text-xs sm:text-sm border-collapse">'
        )
        .replace(/<\/table>/gi, "</table></div>")
        .replace(
          /<thead>/gi,
          '<thead class="bg-[var(--surface-elevated)] text-[var(--muted-foreground)] font-mono text-xs border-b border-[var(--border)]">'
        )
        .replace(/<th>/gi, '<th class="p-3.5 font-bold text-[var(--foreground)]">')
        .replace(
          /<tbody>/gi,
          '<tbody class="divide-y divide-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]">'
        )
        .replace(/<td>/gi, '<td class="p-3.5 leading-relaxed text-[var(--foreground)]/90">');

      ensureTargetRelHook();
      return DOMPurify.sanitize(styledHtml, {
        ADD_ATTR: ["target", "id", "class", "rel"],
      });
    } catch {
      return `<p>Content render error.</p>`;
    }
  };

  return (
    <article className="space-y-10 my-4 text-[var(--foreground)] font-sans transition-colors duration-200">
      {/* 1. Editorial Document Header Hero */}
      <header className="space-y-4 pb-8 border-b border-[var(--border)]">
        {/* Category & Status Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            DOCUMENTATION · {doc.category}
          </span>
          <span className="text-[var(--border)]">|</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{doc.status || "Implemented"} · v1.0.0</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--muted-foreground)]">
            <Clock className="w-3 h-3" />
            <span>{doc.readingTime || 3} min read</span>
          </span>
          <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
            Updated {doc.lastVerified || "Nov 24, 2026"}
          </span>
        </div>

        {/* Big Editorial Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--foreground)] font-heading leading-tight">
          {doc.id.includes("scope") || doc.id.includes("boundary")
            ? "What is SURAKSHA's operational scope, and what does it actually support?"
            : doc.title}
        </h1>

        {/* Lead Summary Paragraph */}
        {doc.summary && (
          <p className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed font-normal max-w-3xl">
            {doc.id.includes("scope") || doc.id.includes("boundary")
              ? "Understand which parts of SURAKSHA are implemented, where the platform operates, what it can currently do and which capabilities remain outside its operational boundary."
              : doc.summary}
          </p>
        )}

        {/* "What You Will Learn" Takeaways Box */}
        {keyTakeaways.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5 my-6 text-[var(--foreground)] shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>What You Will Learn in This Document</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-[var(--foreground)]/90">
              {keyTakeaways.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* 2. Specialized Interactive Components If Relevant */}
      {isApiDoc && <InteractiveApiExplorer />}
      {isArchitectureDoc && <InteractiveArchitectureView />}
      {isModelDoc && <InteractiveModelCard />}
      {isStationDoc && <InteractiveStationRegistry />}

      {/* 3. Question-Led Editorial Article Sections with In-Place Diagram Rendering */}
      <div className="space-y-12">
        {parsedSections.map((sec, sIdx) => {
          const sectionText = sec.lines.join("\n");

          // Skip sections that only have empty lines or comments
          if (!sec.lines.some((l) => l.trim() && !l.trim().startsWith("#"))) {
            return null;
          }

          const questionTitle = formatQuestionTitle(sec.title, sIdx);

          // Split section by Mermaid diagrams to render diagrams directly in-place
          const contentBlocks = sectionText.split(/(```mermaid[\s\S]*?```)/g);

          return (
            <section
              key={sec.id || sIdx}
              id={sec.id}
              className="scroll-mt-24 pt-8 border-t border-[var(--border)] first:border-0 first:pt-0 space-y-5"
            >
              {/* Question-Led Section Header */}
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 select-none">
                    {String(sIdx + 1).padStart(2, "0")}.
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] font-heading">
                    {questionTitle}
                  </h2>
                </div>

                <a
                  href={`#${sec.id}`}
                  className="text-xs font-mono text-[var(--muted-foreground)] hover:text-emerald-500 opacity-50 hover:opacity-100 transition-opacity"
                  aria-label={`Anchor link for ${questionTitle}`}
                >
                  #
                </a>
              </div>

              {/* Render Section Blocks: Prose Text & Inline Flowchart Diagrams */}
              <div className="space-y-4">
                {contentBlocks.map((block, bIdx) => {
                  if (block.startsWith("```mermaid")) {
                    const chartCode = block
                      .replace(/^```mermaid\s*/i, "")
                      .replace(/```$/, "")
                      .trim();

                    return (
                      <div key={bIdx} className="my-6 w-full">
                        <MermaidRenderer
                          id={`${sec.id}-chart-${bIdx}`}
                          chart={chartCode}
                        />
                      </div>
                    );
                  }

                  if (!block.trim()) return null;

                  return (
                    <div
                      key={bIdx}
                      className="text-[15px] sm:text-base text-[var(--foreground)]/85 leading-[1.8] space-y-4
                        [&_p]:my-4 [&_p]:leading-[1.8]
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2
                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2
                        [&_li]:leading-[1.7]
                        [&_code]:text-emerald-600 dark:text-emerald-300 [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-[var(--surface-elevated)] [&_code]:border [&_code]:border-[var(--border)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
                        [&_pre]:bg-[var(--surface-elevated)] [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-[var(--border)] [&_pre]:overflow-x-auto [&_pre]:my-5
                        [&_a]:text-emerald-600 dark:text-emerald-400 [&_a]:underline hover:[&_a]:text-emerald-500"
                      dangerouslySetInnerHTML={{
                        __html: renderSectionHtml(block),
                      }}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
