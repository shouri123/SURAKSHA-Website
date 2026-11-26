"use client";

import React from "react";

interface ScenarioComparisonChartProps {
  currentStage?: number;
  currentRisk?: number;
  currentExposed?: number;
}

export const ScenarioComparisonChart: React.FC<ScenarioComparisonChartProps> = ({
  currentStage = 47.17,
  currentRisk = 15,
  currentExposed = 0,
}) => {
  const baseline = { stage: 46.85, risk: 10, exposed: 0 };
  const rain = { stage: currentStage, risk: currentRisk, exposed: currentExposed };
  const surge = {
    stage: 48.12,
    risk: Math.max(32, Math.min(95, Math.round(currentRisk * 1.3))),
    exposed: currentExposed > 0 ? Math.round(currentExposed * 1.35) : 12,
  };

  const getStageHeight = (val: number) => {
    const clamped = Math.max(44.0, Math.min(50.0, val));
    return Math.max(12, Math.min(85, ((clamped - 44.0) / 6.0) * 85));
  };

  const getRiskHeight = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return Math.max(8, Math.min(85, (clamped / 100) * 85));
  };

  const maxExposed = Math.max(100, baseline.exposed, rain.exposed, surge.exposed);
  const getExposedHeight = (val: number) => {
    if (val <= 0) return 4;
    return Math.max(10, Math.min(85, (Math.min(val, maxExposed) / maxExposed) * 85));
  };

  const formatExposed = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return String(val);
  };

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-3 font-sans overflow-hidden">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-4 text-[11px] font-medium text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--subtle-foreground)]" />
          <span>Baseline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Heavy Rainfall</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Rapid River Rise</span>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="grid grid-cols-3 gap-6 pt-4 border-b border-[var(--border)] pb-2 h-44 items-end overflow-hidden [font-variant-numeric:tabular-nums]">
        {/* Metric 1: Peak Stage */}
        <div className="flex flex-col items-center h-full justify-end overflow-hidden">
          <div className="flex items-end gap-1.5 h-32 w-full justify-center overflow-hidden">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-[var(--muted-foreground)]">{baseline.stage.toFixed(1)}</span>
              <div
                style={{ height: `${getStageHeight(baseline.stage)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-[var(--subtle-foreground)]/75 hover:bg-[var(--subtle-foreground)] transition-colors max-h-[85px]"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-sky-400 font-semibold">{rain.stage.toFixed(2)}</span>
              <div
                style={{ height: `${getStageHeight(rain.stage)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-sky-400 hover:bg-sky-300 transition-colors max-h-[85px]"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-amber-400">{surge.stage.toFixed(1)}</span>
              <div
                style={{ height: `${getStageHeight(surge.stage)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-amber-400/85 hover:bg-amber-400 transition-colors max-h-[85px]"
              />
            </div>
          </div>
          <span className="mt-2 text-xs font-semibold text-[var(--foreground)] text-center">Peak Stage (m)</span>
        </div>

        {/* Metric 2: Flood Risk (/100) */}
        <div className="flex flex-col items-center h-full justify-end overflow-hidden">
          <div className="flex items-end gap-1.5 h-32 w-full justify-center overflow-hidden">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-[var(--muted-foreground)]">{baseline.risk}</span>
              <div
                style={{ height: `${getRiskHeight(baseline.risk)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-[var(--subtle-foreground)]/75 hover:bg-[var(--subtle-foreground)] transition-colors max-h-[85px]"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-sky-400 font-semibold">{rain.risk}</span>
              <div
                style={{ height: `${getRiskHeight(rain.risk)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-sky-400 hover:bg-sky-300 transition-colors max-h-[85px]"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-amber-400">{surge.risk}</span>
              <div
                style={{ height: `${getRiskHeight(surge.risk)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-amber-400/85 hover:bg-amber-400 transition-colors max-h-[85px]"
              />
            </div>
          </div>
          <span className="mt-2 text-xs font-semibold text-[var(--foreground)] text-center">Flood Risk (/100)</span>
        </div>

        {/* Metric 3: Exposed People */}
        <div className="flex flex-col items-center h-full justify-end overflow-hidden">
          <div className="flex items-end gap-1.5 h-32 w-full justify-center overflow-hidden">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-[var(--muted-foreground)]">0</span>
              <div
                style={{ height: `${getExposedHeight(baseline.exposed)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-[var(--subtle-foreground)]/75 hover:bg-[var(--subtle-foreground)] transition-colors max-h-[85px]"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-sky-400 font-semibold">{formatExposed(rain.exposed)}</span>
              <div
                style={{ height: `${getExposedHeight(rain.exposed)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-sky-400 hover:bg-sky-300 transition-colors max-h-[85px]"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-amber-400">{formatExposed(surge.exposed)}</span>
              <div
                style={{ height: `${getExposedHeight(surge.exposed)}px`, maxHeight: "85px" }}
                className="w-5 sm:w-7 rounded-t bg-amber-400/85 hover:bg-amber-400 transition-colors max-h-[85px]"
              />
            </div>
          </div>
          <span className="mt-2 text-xs font-semibold text-[var(--foreground)] text-center">Exposed People</span>
        </div>
      </div>
    </div>
  );
};
