"use client";

import React, { useState } from "react";
import { SimulationDayState, CWC_GANDHI_GHAT_BENCHMARKS } from "@/lib/simulation-scenarios";

interface RiverStageForecastChartProps {
  tPlus6?: number;
  tPlus12?: number;
  tPlus24?: number;
  startingStage?: number;
  warningLevel?: number;
  dangerLevel?: number;
  flowVelocity?: number;
  discharge?: number;
  catchmentRain?: number;
  snowmeltIndex?: number;
  soilSaturation?: number;
  timeline?: SimulationDayState[];
  currentSimulationDay?: number;
}

export const RiverStageForecastChart: React.FC<RiverStageForecastChartProps> = ({
  tPlus6 = 47.17,
  tPlus12 = 46.80,
  tPlus24 = 45.90,
  startingStage = 44.20,
  warningLevel = CWC_GANDHI_GHAT_BENCHMARKS.warningLevel,
  dangerLevel = CWC_GANDHI_GHAT_BENCHMARKS.dangerLevel,
  discharge = 31.4,
  catchmentRain = 18.5,
  snowmeltIndex = 1.0,
  soilSaturation = 65,
  timeline,
  currentSimulationDay = 1,
}) => {
  const [horizon, setHorizon] = useState<"6h" | "24h" | "72h">("24h");
  const [chartMode, setChartMode] = useState<"forecast" | "trajectories">("forecast");
  const [activePoint, setActivePoint] = useState<number | null>(1);

  const minY = 43.0;
  const maxY = 51.5;
  const mapY = (val: number) => 195 - ((Math.max(minY, Math.min(maxY, val)) - minY) / (maxY - minY)) * 160;

  const warningMarkY = mapY(warningLevel);
  const dangerMarkY = mapY(dangerLevel);
  const hflMarkY = mapY(CWC_GANDHI_GHAT_BENCHMARKS.highestFloodLevel);

  const forecastPoints = React.useMemo(() => {
    if (horizon === "6h") {
      return [
        { label: "Now", value: startingStage, x: 95, y: 0 },
        { label: "+2h", value: Number((startingStage + (tPlus6 - startingStage) * 0.45).toFixed(2)), x: 230, y: 0 },
        { label: "+4h", value: Number((startingStage + (tPlus6 - startingStage) * 0.85).toFixed(2)), x: 365, y: 0 },
        { label: "+6h", value: tPlus6, x: 495, y: 0 },
      ];
    }
    if (horizon === "72h") {
      return [
        { label: "Now", value: startingStage, x: 95, y: 0 },
        { label: "+12h", value: tPlus12, x: 230, y: 0 },
        { label: "+24h", value: tPlus24, x: 365, y: 0 },
        { label: "+72h", value: Number(Math.max(43.5, tPlus24 - 1.2).toFixed(2)), x: 495, y: 0 },
      ];
    }
    return [
      { label: "Now", value: startingStage, x: 95, y: 0 },
      { label: "+6h", value: tPlus6, x: 230, y: 0 },
      { label: "+12h", value: tPlus12, x: 365, y: 0 },
      { label: "+24h", value: tPlus24, x: 495, y: 0 },
    ];
  }, [horizon, startingStage, tPlus6, tPlus12, tPlus24]);

  const mappedForecastPoints = forecastPoints.map((p) => ({ ...p, y: mapY(p.value) }));
  const p0 = mappedForecastPoints[0];
  const p1 = mappedForecastPoints[1];
  const p2 = mappedForecastPoints[2];
  const p3 = mappedForecastPoints[3];

  const forecastPathD = `M ${p0.x} ${p0.y} C ${p0.x + 80} ${p0.y - 15}, ${p1.x - 70} ${p1.y}, ${p1.x} ${p1.y} S ${p2.x - 70} ${p2.y}, ${p2.x} ${p2.y} S ${p3.x - 70} ${p3.y}, ${p3.x} ${p3.y}`;
  const forecastAreaD = `${forecastPathD} L ${p3.x} 195 L ${p0.x} 195 Z`;

  const bandUpperD = `M ${p0.x} ${p0.y - 6} C ${p0.x + 80} ${p0.y - 22}, ${p1.x - 70} ${p1.y - 12}, ${p1.x} ${p1.y - 12} S ${p2.x - 70} ${p2.y - 14}, ${p2.x} ${p2.y - 14} S ${p3.x - 70} ${p3.y - 16}, ${p3.x} ${p3.y - 16}`;
  const bandLowerD = `L ${p3.x} ${p3.y + 14} C ${p3.x - 70} ${p3.y + 14}, ${p2.x + 70} ${p2.y + 12}, ${p2.x} ${p2.y + 12} S ${p1.x + 70} ${p1.y + 10}, ${p1.x} ${p1.y + 10} S ${p0.x + 80} ${p0.y + 6}, ${p0.x} ${p0.y + 6} Z`;
  const bandD = `${bandUpperD} ${bandLowerD}`;

  const trajectoryPoints = React.useMemo(() => {
    if (!timeline || timeline.length === 0) return null;
    const count = timeline.length;
    const xStart = 85;
    const xEnd = 525;
    const step = (xEnd - xStart) / Math.max(1, count - 1);

    return timeline.map((pt, idx) => ({
      ...pt,
      x: xStart + idx * step,
      yOptimistic: mapY(pt.optimisticStage),
      yReference: mapY(pt.referenceStage),
      ySevere: mapY(pt.severeStage),
      yActual: mapY(pt.stage),
    }));
  }, [timeline]);

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4 font-sans">
      {/* 4 Multi-Variable Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 sm:p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="text-[11px] font-sans text-[var(--muted-foreground)] mb-1">
            River stage
          </div>
          <div className="text-lg sm:text-xl font-bold font-sans [font-variant-numeric:tabular-nums] text-[var(--foreground)]">
            {tPlus6.toFixed(2)} m
          </div>
          <div className="text-[11px] text-[var(--brand)] font-sans [font-variant-numeric:tabular-nums] mt-0.5">
            +0.08 m/h
          </div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="text-[11px] font-sans text-[var(--muted-foreground)] mb-1">
            Discharge
          </div>
          <div className="text-lg sm:text-xl font-bold font-sans [font-variant-numeric:tabular-nums] text-[var(--foreground)]">
            {discharge.toFixed(1)}k
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] font-sans mt-0.5">m³/s (Cumecs)</div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="text-[11px] font-sans text-[var(--muted-foreground)] mb-1">
            Catchment rain
          </div>
          <div className="text-lg sm:text-xl font-bold font-sans [font-variant-numeric:tabular-nums] text-[var(--foreground)]">
            {catchmentRain.toFixed(1)}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] font-sans mt-0.5">mm/day (IMD)</div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="text-[11px] font-sans text-[var(--muted-foreground)] mb-1">
            Soil saturation
          </div>
          <div className="text-lg sm:text-xl font-bold font-sans [font-variant-numeric:tabular-nums] text-[var(--foreground)]">
            {soilSaturation}%
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] font-sans [font-variant-numeric:tabular-nums] mt-0.5">
            Melt anomaly: {snowmeltIndex.toFixed(1)}×
          </div>
        </div>
      </div>

      {/* Top Header with Mode & Horizon Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--brand)]" aria-hidden="true" />
          <h3 className="text-xs font-semibold text-[var(--foreground)] font-heading">
            {chartMode === "forecast" ? "Reach Inundation Model, 24-Hour Horizon" : "21-Day Multi-Outcome Trajectory Comparison"}
          </h3>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
            <code className="font-mono">STN-PAT-01</code>
            <span>Gandhi Ghat</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => setChartMode("forecast")}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                chartMode === "forecast"
                  ? "bg-[var(--brand)] text-[var(--primary-foreground)] font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Forecast
            </button>
            <button
              type="button"
              onClick={() => setChartMode("trajectories")}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                chartMode === "trajectories"
                  ? "bg-[var(--brand)] text-[var(--primary-foreground)] font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Trajectories
            </button>
          </div>

          {chartMode === "forecast" && (
            <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)] text-xs">
              {(["6h", "24h", "72h"] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizon(h)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    horizon === h
                      ? "bg-[var(--surface-elevated)] text-[var(--brand)] font-semibold border border-[var(--border)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {h.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Hydrograph Viewport */}
      <div className="relative w-full h-[260px] bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-3 sm:p-4 overflow-visible">
        <svg viewBox="0 0 720 245" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="hydroFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0FA978" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0FA978" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {[51, 50, 49, 48, 47, 46, 45, 44].map((lvl) => {
            const y = mapY(lvl);
            return (
              <g key={lvl}>
                <line x1="55" y1={y} x2="705" y2={y} stroke="rgba(151, 163, 158, 0.14)" strokeWidth="1" strokeDasharray="3 3" />
                <text x="48" y={y + 3.5} fill="currentColor" opacity="0.55" fontSize="9.5" textAnchor="end" fontFamily="var(--font-sans)">
                  {lvl}m
                </text>
              </g>
            );
          })}

          {/* Historic HFL */}
          <line x1="55" y1={hflMarkY} x2="705" y2={hflMarkY} stroke="#9333EA" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.8" />
          <rect x="575" y={hflMarkY - 10} width="130" height="15" rx="4" fill="var(--surface)" stroke="#9333EA" strokeWidth="0.8" opacity="0.95" />
          <text x="700" y={hflMarkY + 1} fill="#C084FC" fontSize="8.5" textAnchor="end" fontFamily="var(--font-sans)" fontWeight="600">
            Historic HFL 50.52m
          </text>

          {/* Danger Threshold */}
          <line x1="55" y1={dangerMarkY} x2="705" y2={dangerMarkY} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />
          <rect x="565" y={dangerMarkY - 10} width="140" height="15" rx="4" fill="var(--surface)" stroke="#EF4444" strokeWidth="0.8" opacity="0.95" />
          <text x="700" y={dangerMarkY + 1} fill="#EF4444" fontSize="8.5" textAnchor="end" fontFamily="var(--font-sans)" fontWeight="600">
            Danger mark {dangerLevel.toFixed(2)}m
          </text>

          {/* Warning Threshold */}
          <line x1="55" y1={warningMarkY} x2="705" y2={warningMarkY} stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.85" />
          <rect x="555" y={warningMarkY - 10} width="150" height="15" rx="4" fill="var(--surface)" stroke="#F59E0B" strokeWidth="0.8" opacity="0.95" />
          <text x="700" y={warningMarkY + 1} fill="#F59E0B" fontSize="8.5" textAnchor="end" fontFamily="var(--font-sans)" fontWeight="600">
            Warning mark {warningLevel.toFixed(2)}m
          </text>

          {chartMode === "forecast" ? (
            <>
              <line x1="90" y1="28" x2="90" y2="210" stroke="currentColor" opacity="0.25" strokeWidth="1" strokeDasharray="3 3" />
              <text x="90" y="22" fill="currentColor" opacity="0.65" fontSize="9" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="600">
                T+0 Now
              </text>

              <path d={bandD} fill="url(#confidenceBand)" />
              <path d={forecastAreaD} fill="url(#hydroFill)" />
              <path d={forecastPathD} fill="none" stroke="#0FA978" strokeWidth="2.5" strokeLinecap="round" />

              {mappedForecastPoints.map((pt, idx) => {
                const isHighlight = pt.label === "+6h" || activePoint === idx;
                return (
                  <g
                    key={pt.label}
                    className="cursor-pointer group select-none"
                    onClick={() => setActivePoint(idx)}
                    onMouseEnter={() => setActivePoint(idx)}
                  >
                    {isHighlight ? (
                      <g transform={`translate(${pt.x}, ${pt.y - 14})`}>
                        <rect
                          x="-24"
                          y="-12"
                          width="48"
                          height="18"
                          rx="6"
                          fill="#0FA978"
                          stroke="#FFFFFF"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="1"
                          fill="#05130E"
                          fontSize="9.5"
                          fontWeight="700"
                          fontFamily="var(--font-sans)"
                          textAnchor="middle"
                        >
                          {pt.value.toFixed(2)} m
                        </text>
                      </g>
                    ) : (
                      <g transform={`translate(${pt.x}, ${pt.y - 12})`}>
                        <rect
                          x="-20"
                          y="-10"
                          width="40"
                          height="15"
                          rx="4"
                          fill="var(--surface)"
                          stroke="var(--border)"
                          strokeWidth="0.8"
                        />
                        <text
                          x="0"
                          y="1"
                          fill="currentColor"
                          fontSize="9"
                          fontWeight="600"
                          fontFamily="var(--font-sans)"
                          textAnchor="middle"
                        >
                          {pt.value.toFixed(1)} m
                        </text>
                      </g>
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHighlight ? "5.5" : "3.5"}
                      fill={isHighlight ? "#0FA978" : "#FFFFFF"}
                      stroke="#09090B"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />

                    <text x={pt.x} y="222" fill="currentColor" opacity="0.65" fontSize="9.5" textAnchor="middle" fontFamily="var(--font-sans)">
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {trajectoryPoints && trajectoryPoints.length > 0 && (
                <>
                  <path
                    d={trajectoryPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.ySevere}`).join(" ")}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <path
                    d={trajectoryPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yReference}`).join(" ")}
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth="2.5"
                  />
                  <path
                    d={trajectoryPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yOptimistic}`).join(" ")}
                    fill="none"
                    stroke="#0FA978"
                    strokeWidth="2"
                  />

                  {trajectoryPoints.map((p) => {
                    const isCurrent = p.day === currentSimulationDay;
                    return (
                      <g key={p.day} className="select-none">
                        {isCurrent && (
                          <line
                            x1={p.x}
                            y1="25"
                            x2={p.x}
                            y2="205"
                            stroke="#0FA978"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                        )}
                        <circle
                          cx={p.x}
                          cy={p.yReference}
                          r={isCurrent ? "5.5" : "3.5"}
                          fill={isCurrent ? "#0FA978" : "#0284C7"}
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <text
                          x={p.x}
                          y="222"
                          fill={isCurrent ? "#0FA978" : "currentColor"}
                          opacity={isCurrent ? 1 : 0.55}
                          fontWeight={isCurrent ? "700" : "400"}
                          fontSize="9"
                          textAnchor="middle"
                          fontFamily="var(--font-sans)"
                        >
                          D{p.day.toString().padStart(2, "0")}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </>
          )}
        </svg>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--muted-foreground)] pt-1 font-sans">
        {chartMode === "forecast" ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand)]" />
              <span>Stage Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2 rounded bg-sky-400/20 border border-sky-400/40" />
              <span>90% Uncertainty Band</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-b-2 border-dashed border-amber-400" />
              <span>Warning (47.60m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-b-2 border-dashed border-red-500" />
              <span>Danger (48.60m)</span>
            </div>
          </>
        ) : (
          <div className="w-full space-y-1.5">
            <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--muted-foreground)] font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[var(--brand)]" />
                <span>Optimistic Scenario</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-sky-600" />
                <span>Reference Case</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b-2 border-dashed border-red-500" />
                <span>Severe Outcome</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b-2 border-dashed border-purple-500" />
                <span>HFL (50.52m)</span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] border-t border-[var(--border)] pt-1">
              Scientific distinction: These 3 trajectories represent scenario assumption presets (lower rain vs. sustained deluge vs. saturated catchment), not statistically calculated probability distributions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
