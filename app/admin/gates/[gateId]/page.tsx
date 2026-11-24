"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield, Activity } from "lucide-react";

interface GateConfig {
  name: string;
  desc: string;
  state: string;
  checks: [string, string, string][];
  decision: string;
  note: string;
}

const GATES_DATA: Record<string, GateConfig> = {
  "pre-run": {
    name: "Pre-Run Gate · Input Quality & Sensor Integrity",
    desc: "Validate input quality, sensor completeness and operating boundary conditions before numerical execution.",
    state: "REFERENCE CHECKLIST · NOT RUN",
    checks: [
      ["Telemetry quality", "Missing values, units and timestamp continuity checks", "Example"],
      ["Sensor consistency", "Detect conflicting or implausible gauge readings", "Example"],
      ["Data regime", "Classify normal, rapid rise, heavy rainfall or degraded mode", "Example"],
      ["Fallback readiness", "Verify approved degraded-mode fallback strategies", "Example"],
    ],
    decision: "CONTINUE / APPROVED FALLBACK / HUMAN REVIEW",
    note: "Pre-Run Gate blocks execution when required evidence is missing or sensor readings conflict beyond tolerance.",
  },
  "mid-run": {
    name: "Mid-Run Gate · Forecast Committee & Physics Verification",
    desc: "Review forecast committee output, mass conservation, model disagreement and evidence support.",
    state: "REFERENCE CHECKLIST · NOT RUN",
    checks: [
      ["Forecast committee", "Compare approved model outputs across 6h, 24h and 72h horizons", "Review"],
      ["Model disagreement", "Inspect ensemble spread and conflicting predictions", "Review"],
      ["Claim support", "Check forecast and inundation claims against physical evidence", "Verify"],
      ["Escalation", "Flag divergence (>0.45m) or unsupported claims for human review", "Escalate"],
    ],
    decision: "CONTINUE / DISCOUNT CONFIDENCE / HUMAN ESCALATION",
    note: "Mid-Run Gate highlights model version, forecast horizon, input window and ensemble spread metrics.",
  },
  "post-run": {
    name: "Post-Run Gate · Evidence Triangulation & Human Approval",
    desc: "Triangulate downstream outputs against available terrain and satellite evidence and record confidence.",
    state: "REFERENCE CHECKLIST · NOT RUN",
    checks: [
      ["Satellite corroboration", "Compare available SAR observations and derived flood extent", "Review"],
      ["Forecast vs risk", "Check consistency between stage forecast, risk and impact claims", "Verify"],
      ["External evidence", "Record authoritative corroboration where supplied", "Verify"],
      ["Human approval", "Require commander sign-off for unresolved or high-impact claims", "Required"],
    ],
    decision: "ACCEPT WITH CONFIDENCE / DISCOUNT / HUMAN REVIEW",
    note: "The reference policy calls for external evidence checks before an advisory reaches operators.",
  },
  "gate-1": {
    name: "Pre-Run Gate (Gate 01)",
    desc: "Validate input quality and operating conditions before analysis.",
    state: "REFERENCE CHECKLIST · NOT RUN",
    checks: [
      ["Telemetry quality", "Missing values, units and timestamp checks", "Example"],
      ["Sensor consistency", "Detect conflicting or implausible readings", "Example"],
      ["Data regime", "Normal, rapid rise, heavy rainfall or degraded mode", "Classify"],
      ["Fallback readiness", "Check approved degraded-mode strategies", "Example"],
    ],
    decision: "CONTINUE / APPROVED FALLBACK / HUMAN REVIEW",
    note: "This gate blocks execution when required evidence is missing or sensor readings conflict.",
  },
  "gate-2": {
    name: "Mid-Run Gate (Gate 02)",
    desc: "Review forecast committee output, model disagreement and evidence support.",
    state: "REFERENCE CHECKLIST · NOT RUN",
    checks: [
      ["Forecast committee", "Compare approved model outputs and horizons", "Review"],
      ["Model disagreement", "Inspect spread and conflicting predictions", "Review"],
      ["Claim support", "Check forecast and risk claims against evidence", "Verify"],
      ["Escalation", "Flag disagreement or unsupported claims for review", "Escalate"],
    ],
    decision: "CONTINUE / DISCOUNT CONFIDENCE / HUMAN ESCALATION",
    note: "The UI highlights model version, forecast horizon, input window and spread metrics.",
  },
  "gate-3": {
    name: "Post-Run Gate (Gate 03)",
    desc: "Triangulate outputs against available evidence and record confidence.",
    state: "REFERENCE CHECKLIST · NOT RUN",
    checks: [
      ["Satellite corroboration", "Compare available satellite observations and derived extent", "Review"],
      ["Forecast vs risk", "Check consistency between forecast, risk and impact claims", "Verify"],
      ["External evidence", "Record authoritative corroboration where supplied", "Verify"],
      ["Human approval", "Require review for unresolved or high-impact claims", "Required"],
    ],
    decision: "ACCEPT WITH CONFIDENCE / DISCOUNT / HUMAN REVIEW",
    note: "The reference policy calls for checking supporting evidence before making an external claim.",
  },
};

export default function GateDetailPage() {
  const params = useParams<{ gateId?: string }>();
  const gateId = typeof params?.gateId === "string" ? params.gateId : "pre-run";
  const data = Object.hasOwn(GATES_DATA, gateId)
    ? GATES_DATA[gateId]
    : GATES_DATA["pre-run"];
  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-[#A69B88] hover:text-[#FFFFFF] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations Overview
        </Link>

        {/* Gate Quick Switcher */}
        <div className="inline-flex rounded-lg border border-[#A1A1AA]/16 bg-[#0A0A0A] p-1 gap-1">
          {[
            { id: "pre-run", label: "01 Pre-Run" },
            { id: "mid-run", label: "02 Mid-Run" },
            { id: "post-run", label: "03 Post-Run" },
          ].map((g) => (
            <Link
              key={g.id}
              href={`/admin/gates/${g.id}`}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                gateId === g.id
                  ? "bg-[#FFFFFF] text-white"
                  : "text-[#A69B88] hover:text-[#A1A1AA]"
              }`}
            >
              {g.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A1A1AA]/14">
        <div>
          <div className="eyebrow">ILLUSTRATIVE VERIFICATION TEMPLATE</div>
          <h1 className="text-3xl font-extrabold text-[#A1A1AA]">{data.name}</h1>
          <p className="text-xs text-[#A69B88] mt-1">{data.desc}</p>
        </div>
        <span className="pill self-start sm:self-auto">
          <i className="dot blue" /> {data.state}
        </span>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#A1A1AA]/15 bg-[#0A0A0A] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A69B88]">
            <span>Gate Execution</span>
            <Activity className="w-3.5 h-3.5 text-[#FFFFFF]" />
          </div>
          <div className="text-lg font-extrabold font-mono text-[#A1A1AA]">Not run</div>
          <div className="text-[11px] font-mono text-[#A69B88]">No connected execution record</div>
        </div>

        <div className="p-4 rounded-xl border border-[#A1A1AA]/15 bg-[#0A0A0A] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A69B88]">
            <span>Checks Performed</span>
            <Shield className="w-3.5 h-3.5 text-[#FFFFFF]" />
          </div>
          <div className="text-lg font-extrabold font-mono text-[#A1A1AA]">Unavailable</div>
          <div className="text-[11px] font-mono text-[#A69B88]">Checklist items are examples</div>
        </div>

        <div className="p-4 rounded-xl border border-[#A1A1AA]/15 bg-[#0A0A0A] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A69B88]">
            <span>Supervisory State</span>
            <Activity className="w-3.5 h-3.5 text-[#FFFFFF]" />
          </div>
          <div className="text-lg font-extrabold font-mono text-[#A1A1AA]">Not reported</div>
          <div className="text-[11px] font-mono text-[#A69B88]">No supervisory result returned</div>
        </div>

        <div className="p-4 rounded-xl border border-[#A1A1AA]/15 bg-[#0A0A0A] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A69B88]">
            <span>Evidence Score</span>
            <Shield className="w-3.5 h-3.5 text-[#FFFFFF]" />
          </div>
          <div className="text-lg font-extrabold font-mono text-[#A1A1AA]">Unavailable</div>
          <div className="text-[11px] font-mono text-[#A69B88]">No evidence score returned</div>
        </div>
      </div>

      {/* Two Columns: Gate checks vs Decision Contract */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gate Checks */}
        <div className="p-6 rounded-xl border border-[#A1A1AA]/15 bg-[#0A0A0A] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#A1A1AA]/14">
            <h3 className="text-sm font-bold text-[#A1A1AA]">Verification Invariants</h3>
            <span className="text-xs font-mono text-[#FFFFFF]">4 Invariants</span>
          </div>

          <div className="divide-y divide-[#A1A1AA]/12">
            {data.checks.map(([t, d, s], idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <strong className="text-xs text-[#A1A1AA] block">{t}</strong>
                  <small className="text-[11px] text-[#A69B88]">{d}</small>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    s === "Pass" || s === "Ready" || s === "Verify"
                      ? "bg-[#FFFFFF]/18 text-[#FFFFFF] border-[#FFFFFF]/35"
                      : "bg-[#F59E0B]/18 text-[#FBBF24] border-[#F59E0B]/40"
                  }`}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Contract */}
        <div className="p-6 rounded-xl border border-[#A1A1AA]/15 bg-[#0A0A0A] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#A1A1AA]/14">
              <h3 className="text-sm font-bold text-[#A1A1AA]">Supervisory Decision Contract</h3>
              <span className="text-xs font-mono text-[#A69B88]">Policy Rule</span>
            </div>

            <div className="p-4 rounded-lg border border-[#A1A1AA]/15 bg-[#000000] text-xs text-[#A1A1AA] leading-relaxed">
              {data.note} This page is an illustrative checklist, not an executed or verified gate result.
            </div>

            <div className="pt-2">
              <div className="text-xs font-bold font-mono text-[#A1A1AA]">
                Permitted Gate Outcomes
              </div>
              <p className="text-xs font-mono text-[#FFFFFF] mt-1.5 leading-relaxed bg-[#000000] p-3 rounded-lg border border-[#A1A1AA]/12">
                {data.decision}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#A1A1AA]/14">
            <p className="rounded-lg border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs text-amber-100">
              Gate execution is unavailable because no gate result endpoint is connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
