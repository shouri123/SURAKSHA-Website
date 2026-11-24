"use client";

import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Code2, Eye, AlertCircle } from "lucide-react";

interface MermaidRendererProps {
  chart: string;
  id: string;
}

export function MermaidRenderer({ chart, id }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chart || typeof window === "undefined") return;

      try {
        setLoading(true);
        setError(null);

        // Dynamically import mermaid to avoid any SSR issues
        const mermaid = (await import("mermaid")).default;

        const isDark =
          document.documentElement.classList.contains("dark") ||
          (!document.documentElement.classList.contains("light") &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          htmlLabels: false,
          flowchart: {
            htmlLabels: false,
            useMaxWidth: true,
          },
          theme: isDark ? "dark" : "neutral",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          themeVariables: isDark
            ? {
                darkMode: true,
                background: "#090d0b",
                primaryColor: "#10B981",
                primaryTextColor: "#ECFDF5",
                primaryBorderColor: "rgba(16, 185, 129, 0.4)",
                lineColor: "#34D399",
                secondaryColor: "#131a16",
                tertiaryColor: "#0d1310",
                edgeLabelBackground: "#131a16",
                mainBkg: "#131a16",
                nodeBorder: "rgba(16, 185, 129, 0.4)",
              }
            : {
                darkMode: false,
                background: "#F8FAF9",
                primaryColor: "#059669",
                primaryTextColor: "#064E3B",
                primaryBorderColor: "rgba(5, 150, 105, 0.4)",
                lineColor: "#10B981",
                secondaryColor: "#EDFDF5",
                tertiaryColor: "#F0FDF4",
                edgeLabelBackground: "#FFFFFF",
                mainBkg: "#F0FDF4",
                nodeBorder: "rgba(5, 150, 105, 0.4)",
              },
        });

        // Generate safe unique ID starting with letter
        const cleanId = `m_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

        // Clean chart input: strip any backticks and ensure trimmed
        const cleanChart = chart.replace(/^```mermaid\s*/i, "").replace(/```$/, "").trim();

        // Render diagram directly and sanitize SVG output
        const { svg } = await mermaid.render(cleanId, cleanChart);
        const safeSvg = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true, html: true },
          ADD_TAGS: ["foreignObject"],
          FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
        });

        if (isMounted) {
          setSvgHtml(safeSvg);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("Mermaid render error:", err);
          setError(err?.message || "Failed to render Mermaid diagram.");
          setLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  return (
    <div className="my-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden shadow-sm transition-colors duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]">
            System Architecture Diagram
          </span>
        </div>
        <button
          onClick={() => setShowSource(!showSource)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] transition-colors cursor-pointer"
        >
          {showSource ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>View Diagram</span>
            </>
          ) : (
            <>
              <Code2 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <span>View Source</span>
            </>
          )}
        </button>
      </div>

      {/* Render Area */}
      <div className="p-4 sm:p-6 overflow-x-auto min-h-[160px] flex items-center justify-center bg-[var(--surface-elevated)]">
        {loading ? (
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted-foreground)] py-8">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--border)] border-t-emerald-500 animate-spin" />
            <span>Rendering diagram...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5 max-w-lg w-full">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="flex-1 min-w-0">
              <strong className="block font-semibold">Diagram Specification</strong>
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                The diagram definition can be viewed directly below:
              </p>
              <pre className="mt-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] overflow-x-auto text-[11px] font-mono text-[var(--foreground)]">
                {chart}
              </pre>
            </div>
          </div>
        ) : showSource ? (
          <pre className="w-full text-xs font-mono text-[var(--foreground)] bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] overflow-x-auto">
            {chart}
          </pre>
        ) : (
          <div
            ref={containerRef}
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto transition-opacity duration-300"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        )}
      </div>
    </div>
  );
}
