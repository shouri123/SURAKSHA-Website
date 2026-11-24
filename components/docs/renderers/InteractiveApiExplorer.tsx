"use client";

import React, { useState } from "react";
import {
  Server,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Search,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Play,
} from "lucide-react";

interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  defaultVal?: string;
  description: string;
}

interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  summary: string;
  description: string;
  auth: string;
  parameters: ApiParam[];
  requestSample?: string;
  responseSample: string;
  responseCode: number;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: "health",
    method: "GET",
    path: "/api/v1/flood/health",
    summary: "Engine Health & Operational Readiness",
    description: "Returns process health separately from provider configuration, runtime polling, model readiness, and outstanding operational blockers.",
    auth: "Public read endpoint",
    parameters: [],
    responseCode: 200,
    responseSample: "The response includes status, operational_readiness, readiness_blockers, provider configuration/runtime, model readiness, supervisor modes, and station-catalog metadata. Values vary with runtime configuration; no sample readiness status is implied here.",
  },
  {
    id: "stations",
    method: "GET",
    path: "/api/v1/flood/stations?basin=Ganges&state=Bihar",
    summary: "List Station Metadata",
    description: "Returns catalogue metadata and warning/danger references. It is not a live stage-observation feed.",
    auth: "Public read endpoint",
    parameters: [
      {
        name: "basin",
        type: "string",
        required: false,
        defaultVal: "Ganges",
        description: "Filter by river basin name.",
      },
      {
        name: "state",
        type: "string",
        required: false,
        defaultVal: "Bihar",
        description: "Filter by state name.",
      },
    ],
    responseCode: 200,
    responseSample: `[
  {
    "station_id": "GANGES_PATNA",
    "station_name": "Gandhi Ghat, Patna",
    "river": "Ganges",
    "basin": "Ganges Basin",
    "state": "Bihar",
    "district": "Patna",
    "latitude": 25.62,
    "longitude": 85.176,
    "zero_datum_m": 43.0,
    "warning_level_m": 49.5,
    "danger_level_m": 50.5,
    "hfl_m": 52.52,
    "hfl_date": "1994-08-16"
  }
]`,
  },
  {
    id: "pipeline",
    method: "POST",
    path: "/api/v1/flood/pipeline/run",
    summary: "Run the Flood Analysis Pipeline",
    description: "Runs the engine for a configured station. Omitted observations are loaded from configured providers where available; supplied observations are marked as operator-provided.",
    auth: "Bearer operator API key may be required by deployment middleware; keep it server-side",
    parameters: [
      {
        name: "station_id",
        type: "string",
        required: false,
        defaultVal: "GANGES_PATNA",
        description: "Station ID from GET /api/v1/flood/stations.",
      },
      {
        name: "water_level_m",
        type: "number",
        required: false,
        description: "Optional water level in metres.",
      },
      {
        name: "rainfall_24h_mm",
        type: "number",
        required: false,
        description: "Optional 24-hour rainfall in millimetres.",
      },
      {
        name: "execution_mode",
        type: "string",
        required: false,
        defaultVal: "supervised",
        description: "supervised or static.",
      },
    ],
    requestSample: `{
  "station_id": "GANGES_PATNA",
  "execution_mode": "static"
}`,
    responseCode: 200,
    responseSample: "Returns the assembled FloodState and pipeline outputs. Values and checks depend on configured telemetry, supplied inputs, model readiness, and execution mode; inspect the response and the engine OpenAPI schema.",
  },
  {
    id: "demo-catalog",
    method: "GET",
    path: "/api/v1/flood/demo/scenarios",
    summary: "List Synthetic Demo Scenarios",
    description: "Returns the engine's synthetic scenario suite, including preset inputs, limitations, and evaluation references. This endpoint is disabled in production.",
    auth: "Synthetic demo only · unavailable when SURAKSHA_ENV or ENVIRONMENT is production",
    parameters: [],
    responseCode: 200,
    responseSample: "The response contains suite_id, suite_name, synthetic_data_only, limitations, and scenarios from the configured synthetic scenario catalog. The exact scenarios are environment-dependent; this endpoint is unavailable in production.",
  },
  {
    id: "demo-run",
    method: "POST",
    path: "/api/v1/flood/demo/scenarios/BEST_01_CALM_BASELINE/run?mode=static",
    summary: "Run a Synthetic Demo Scenario",
    description: "Executes the named catalogue scenario with synthetic provenance. Omit the body to use its preset input, or send { input: <full FloodState> }. This endpoint is disabled in production.",
    auth: "Synthetic demo only · unavailable when SURAKSHA_ENV or ENVIRONMENT is production",
    parameters: [
      {
        name: "mode",
        type: "string",
        required: false,
        defaultVal: "supervised",
        description: "Query parameter: static or supervised.",
      },
    ],
    requestSample: `{}`,
    responseCode: 200,
    responseSample: "Returns the engine's generated event ID, scenario metadata, FloodState result, provenance, and review information. Result fields depend on the selected scenario and execution mode.",
  },
];

export function InteractiveApiExplorer() {
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabByEndpoint, setActiveTabByEndpoint] = useState<Record<string, "curl" | "response" | "python">>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);

  const filtered = ENDPOINTS.filter((ep) => {
    if (selectedMethod !== "ALL" && ep.method !== selectedMethod) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ep.path.toLowerCase().includes(q) ||
      ep.summary.toLowerCase().includes(q) ||
      ep.description.toLowerCase().includes(q)
    );
  });

  const getActiveTab = (epId: string) => activeTabByEndpoint[epId] || "response";

  const setTab = (epId: string, tab: "curl" | "response" | "python") => {
    setActiveTabByEndpoint((prev) => ({ ...prev, [epId]: tab }));
  };

  const handleCopy = async (id: string, text: string) => {
    setCopyErrorId(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
      setCopyErrorId(id);
    }
  };

  const generateCurl = (ep: ApiEndpoint) => {
    if (ep.method === "GET") {
      return `curl -X GET "http://localhost:8000${ep.path}" \\
  -H "Accept: application/json"`;
    }
    return `curl -X POST "http://localhost:8000${ep.path}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_SURAKSHA_API_KEY" \\
  -d '${ep.requestSample?.replace(/\n/g, "")}'`;
  };

  const generatePython = (ep: ApiEndpoint) => {
    if (ep.method === "GET") {
      return `import httpx

response = httpx.get("http://localhost:8000${ep.path}")
print(response.status_code)
print(response.json())`;
    }
    return `import httpx

headers = {"Authorization": "Bearer YOUR_SURAKSHA_API_KEY"}
payload = ${ep.requestSample || "{}"}

response = httpx.post("http://localhost:8000${ep.path}", json=payload, headers=headers)
print(response.json())`;
  };

  return (
    <div className="space-y-8 my-8">
      {/* Top Protocol & Base URL Card */}
      <div className="p-5 rounded-2xl border border-[#A1A1AA]/20 bg-[#242421] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A69B88]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#FFFFFF] font-semibold">
              Verified Engine API Examples · FastAPI
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#A69B88]">A subset confirmed against the engine source. This explorer does not check current service reachability; runtime responses vary. The engine OpenAPI document is the full contract.</p>
          <div className="flex items-center gap-2 text-xs font-mono text-[#A69B88]">
            <span>Local development base URL:</span>
            <code className="text-[#E4E4E7] bg-[#000000] px-2 py-0.5 rounded border border-[#A1A1AA]/15">
              http://localhost:8000/api/v1/flood
            </code>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleCopy("base-url", "http://localhost:8000/api/v1/flood")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#000000] hover:bg-[#2D2D29] border border-[#A1A1AA]/20 text-xs text-[#FFFFFF] transition-colors shrink-0"
        >
          {copyErrorId === "base-url" ? (
            <span role="status" className="text-amber-200">Copy unavailable</span>
          ) : copiedId === "base-url" ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[#10B981]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#A69B88]" />
              <span>Copy Base URL</span>
            </>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Method filter pills */}
        <div role="group" aria-label="Filter API examples by method" className="flex items-center gap-1.5 bg-[#242421] p-1 rounded-xl border border-[#A1A1AA]/15 text-xs">
          {["ALL", "GET", "POST"].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method)}
              aria-pressed={selectedMethod === method}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                selectedMethod === method
                  ? "bg-emerald-600 text-white font-semibold shadow"
                  : "text-[#A69B88] hover:text-[#FFFFFF]"
              }`}
            >
              {method}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A69B88]" />
          <label className="sr-only" htmlFor="api-search">Search API endpoints</label>
          <input
            id="api-search"
            type="text"
            placeholder="Search API endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242421] border border-[#A1A1AA]/20 rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#FFFFFF] placeholder-[#A69B88] focus:outline-none focus:border-[#FFFFFF]"
          />
        </div>
      </div>

      {/* Endpoint Cards List */}
      <div className="space-y-6">
        {filtered.map((ep) => {
          const tab = getActiveTab(ep.id);
          const curlCode = generateCurl(ep);
          const pyCode = generatePython(ep);

          return (
            <div
              key={ep.id}
              className="rounded-2xl border border-[#A1A1AA]/15 bg-[#242421] overflow-hidden shadow-md"
            >
              {/* Endpoint Header Bar */}
              <div className="p-4 sm:p-5 border-b border-[#A1A1AA]/10 bg-[#0A0A0A] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wider ${
                      ep.method === "GET"
                        ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                        : "bg-[#3B82F6]/20 text-[#E4E4E7] border border-[#3B82F6]/40"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm font-semibold text-[#FFFFFF] tracking-tight">
                    {ep.path}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#000000] text-[#A69B88] border border-[#A1A1AA]/10">
                    Auth: {ep.auth}
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    HTTP {ep.responseCode}
                  </span>
                </div>
              </div>

              {/* Endpoint Description */}
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-[#FFFFFF] mb-1">
                    {ep.summary}
                  </h4>
                  <p className="text-xs text-[#A69B88] leading-relaxed">
                    {ep.description}
                  </p>
                </div>

                {/* Parameters Table (if any) */}
                {ep.parameters.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#A69B88] block">
                      Parameters
                    </span>
                    <div className="border border-[#A1A1AA]/10 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-[#000000] text-[#A69B88] border-b border-[#A1A1AA]/10 font-mono text-[11px]">
                          <tr>
                            <th className="p-2.5">Field</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Requirement</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#A1A1AA]/5 bg-[#242421]/60">
                          {ep.parameters.map((param) => (
                            <tr key={param.name}>
                              <td className="p-2.5 font-mono text-[#E4E4E7] font-medium">
                                {param.name}
                              </td>
                              <td className="p-2.5 font-mono text-[11px] text-[#A69B88]">
                                {param.type}
                              </td>
                              <td className="p-2.5">
                                {param.required ? (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                                    required
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-[#A69B88]">
                                    optional {param.defaultVal ? `(default: ${param.defaultVal})` : ""}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-[#A1A1AA] text-xs">
                                {param.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Request / Response Tabbed Box */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#A1A1AA]/10 pb-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTab(ep.id, "response")}
                        aria-pressed={tab === "response"}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                          tab === "response"
                            ? "bg-[#0A0A0A] text-[#FFFFFF] font-semibold border border-[#A1A1AA]/20"
                            : "text-[#A69B88] hover:text-[#FFFFFF]"
                        }`}
                      >
                        Response (JSON)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab(ep.id, "curl")}
                        aria-pressed={tab === "curl"}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                          tab === "curl"
                            ? "bg-[#0A0A0A] text-[#FFFFFF] font-semibold border border-[#A1A1AA]/20"
                            : "text-[#A69B88] hover:text-[#FFFFFF]"
                        }`}
                      >
                        cURL Request
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab(ep.id, "python")}
                        aria-pressed={tab === "python"}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                          tab === "python"
                            ? "bg-[#0A0A0A] text-[#FFFFFF] font-semibold border border-[#A1A1AA]/20"
                            : "text-[#A69B88] hover:text-[#FFFFFF]"
                        }`}
                      >
                        Python (httpx)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          ep.id,
                          tab === "response"
                            ? ep.responseSample
                            : tab === "curl"
                            ? curlCode
                            : pyCode
                        )
                      }
                      className="flex items-center gap-1 text-[11px] font-mono text-[#A69B88] hover:text-[#FFFFFF] transition-colors"
                    >
                      {copyErrorId === ep.id ? (
                        <span role="status" className="text-amber-200">Copy unavailable</span>
                      ) : copiedId === ep.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#10B981]" />
                          <span className="text-[#10B981]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy snippet</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Container */}
                  <div className="rounded-xl border border-[#A1A1AA]/15 bg-[#141413] p-4 overflow-x-auto text-xs font-mono text-[#A1A1AA] leading-relaxed">
                    <pre>
                      <code>
                        {tab === "response"
                          ? ep.responseSample
                          : tab === "curl"
                          ? curlCode
                          : pyCode}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

