"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface HydrometricStageStaffGaugeProps {
  stage: number;
  warningLevel?: number;
  dangerLevel?: number;
  hfl?: number;
  stationName?: string;
  embankmentStatus?: string;
}

export const HydrometricStageStaffGauge: React.FC<HydrometricStageStaffGaugeProps> = ({
  stage,
  warningLevel = 47.6,
  dangerLevel = 48.6,
  hfl = 50.52,
  stationName = "Gandhi Ghat, Patna",
  embankmentStatus = "Stable",
}) => {
  const minM = 42.0;
  const maxM = 52.0;
  const range = maxM - minM;

  const clampStage = Math.max(minM, Math.min(maxM, stage));
  const waterHeightPct = ((clampStage - minM) / range) * 100;
  const warningPosPct = 100 - ((warningLevel - minM) / range) * 100;
  const dangerPosPct = 100 - ((dangerLevel - minM) / range) * 100;
  const hflPosPct = 100 - ((hfl - minM) / range) * 100;
  const waterTopPct = 100 - waterHeightPct;

  const isDanger = stage >= dangerLevel;
  const isWarning = stage >= warningLevel && !isDanger;
  const diffDanger = stage - dangerLevel;

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
        <h3 className="font-heading text-xs font-semibold text-[var(--foreground)]">
          Stage Elevation Cross-Section
        </h3>
        <span className="text-[11px] font-sans text-[var(--muted-foreground)] truncate max-w-[140px]">
          {stationName}
        </span>
      </div>

      {/* Main Infographic Staff Gauge & Cross-Section Graphic */}
      <div className="grid grid-cols-12 gap-3 items-center py-1">
        {/* Left: River Cross-Section Column */}
        <div className="col-span-8 relative h-48 sm:h-52 rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
            {[52, 50, 48, 46, 44, 42].map((m) => (
              <div key={m} className="w-full border-b border-dashed border-[var(--foreground)]" />
            ))}
          </div>

          {/* HFL Reference Line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-purple-500/80 z-20 flex items-center justify-between px-2 text-[10px] font-sans font-semibold text-purple-400"
            style={{ top: `${hflPosPct}%` }}
          >
            <span className="bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded border border-purple-500/30 [font-variant-numeric:tabular-nums]">
              Historic HFL {hfl.toFixed(2)}m
            </span>
          </div>

          {/* Danger Level Line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500 z-20 flex items-center justify-between px-2 text-[10px] font-sans font-semibold text-rose-400"
            style={{ top: `${dangerPosPct}%` }}
          >
            <span className="bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded border border-rose-500/30 [font-variant-numeric:tabular-nums]">
              Danger {dangerLevel.toFixed(2)}m
            </span>
          </div>

          {/* Warning Level Line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-amber-500 z-20 flex items-center justify-between px-2 text-[10px] font-sans font-semibold text-amber-400"
            style={{ top: `${warningPosPct}%` }}
          >
            <span className="bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded border border-amber-500/30 [font-variant-numeric:tabular-nums]">
              Warning {warningLevel.toFixed(2)}m
            </span>
          </div>

          {/* Water Body Fill */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-sky-700/85 via-sky-600/75 to-teal-500/75 transition-all duration-700 ease-out z-10"
            style={{ height: `${waterHeightPct}%` }}
          >
            <div className="absolute -top-1.5 left-0 right-0 h-3 overflow-hidden opacity-90">
              <svg className="w-full h-full text-teal-300" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 C 20 0, 40 20, 60 10 C 80 0, 100 20, 120 10 L 120 20 L 0 20 Z" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Floating Surface Level Badge */}
          <div
            className="absolute right-2 -translate-y-1/2 z-30 transition-all duration-700 ease-out flex items-center gap-1.5"
            style={{ top: `${waterTopPct}%` }}
          >
            <div
              className={`px-2 py-0.5 rounded-md font-sans [font-variant-numeric:tabular-nums] text-[11px] font-bold flex items-center gap-1 border ${
                isDanger
                  ? "bg-rose-600 border-rose-400 text-white"
                  : isWarning
                  ? "bg-amber-500 border-amber-300 text-black"
                  : "bg-[var(--brand)] border-[var(--brand-strong)] text-[var(--primary-foreground)]"
              }`}
            >
              <span>{stage.toFixed(2)}m</span>
            </div>
          </div>
        </div>

        {/* Right: Vertical Hydrometric Metric Bar */}
        <div className="col-span-4 flex flex-col justify-between h-48 sm:h-52 py-1 pl-1 space-y-2">
          <div className="space-y-0.5">
            <span className="text-[11px] font-sans text-[var(--muted-foreground)] block">
              River stage
            </span>
            <div className="font-sans [font-variant-numeric:tabular-nums] text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
              {stage.toFixed(2)} <span className="text-xs font-medium text-[var(--muted-foreground)]">m</span>
            </div>
            <div className="text-[11px] font-sans font-medium [font-variant-numeric:tabular-nums]">
              {isDanger ? (
                <span className="text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  +{diffDanger.toFixed(2)}m over
                </span>
              ) : isWarning ? (
                <span className="text-amber-500">{(dangerLevel - stage).toFixed(2)}m to danger</span>
              ) : (
                <span className="text-[var(--brand)]">Nominal stage</span>
              )}
            </div>
          </div>

          <div className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[11px] font-sans space-y-0.5">
            <div className="text-[10px] text-[var(--muted-foreground)]">Embankment</div>
            <div
              className={`font-semibold truncate ${
                embankmentStatus === "Breach"
                  ? "text-rose-500"
                  : embankmentStatus === "Under Stress"
                  ? "text-amber-500"
                  : "text-[var(--brand)]"
              }`}
            >
              {embankmentStatus}
            </div>
          </div>

          <div className="text-[10px] font-sans [font-variant-numeric:tabular-nums] text-[var(--muted-foreground)] border-t border-[var(--border)] pt-1">
            Zero datum: {minM.toFixed(1)}m GTS
          </div>
        </div>
      </div>
    </div>
  );
};
