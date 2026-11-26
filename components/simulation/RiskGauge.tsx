"use client";

import React from "react";

interface RiskGaugeProps {
  score: number; // 0 to 100
  severity?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const needleAngle = -90 + (clampedScore / 100) * 180;

  const getRiskLabel = (s: number) => {
    if (s < 30) return "Low risk";
    if (s < 70) return "Moderate risk";
    return "High risk";
  };

  const getRiskColor = (s: number) => {
    if (s < 30) return "#0FA978";
    if (s < 70) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="flex flex-col items-center justify-center relative py-2">
      <svg
        viewBox="0 0 200 120"
        className="w-48 h-28 overflow-visible"
        aria-label={`Flood risk gauge showing ${clampedScore} out of 100`}
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0FA978" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        <path
          d="M 20 105 A 80 80 0 0 1 180 105"
          fill="none"
          stroke="rgba(151, 163, 158, 0.22)"
          strokeWidth="16"
          strokeLinecap="round"
        />

        <path
          d="M 20 105 A 80 80 0 0 1 180 105"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset={251.2 - (clampedScore / 100) * 251.2}
          className="transition-all duration-700 ease-out"
        />

        <g
          transform={`translate(100, 105) rotate(${needleAngle})`}
          className="transition-transform duration-700 ease-out"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-68"
            stroke={getRiskColor(clampedScore)}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="0" cy="0" r="7" fill="#FFFFFF" />
          <circle cx="0" cy="0" r="3.5" fill="#09090B" />
        </g>
      </svg>

      <div className="text-center mt-1">
        <div className="font-sans [font-variant-numeric:tabular-nums] text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
          {clampedScore} <span className="text-sm font-normal text-[var(--muted-foreground)]">/ 100</span>
        </div>
        <div className="mt-1">
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium font-sans"
            style={{
              backgroundColor: `${getRiskColor(clampedScore)}20`,
              color: getRiskColor(clampedScore),
              border: `1px solid ${getRiskColor(clampedScore)}45`,
            }}
          >
            {getRiskLabel(clampedScore)}
          </span>
        </div>
      </div>
    </div>
  );
};
