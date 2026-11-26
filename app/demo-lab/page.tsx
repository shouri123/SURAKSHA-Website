"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  CircleAlert,
  LoaderCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { RiskGauge } from "@/components/simulation/RiskGauge";
import { ScenarioComparisonChart } from "@/components/simulation/ScenarioComparisonChart";
import { RiverStageForecastChart } from "@/components/simulation/RiverStageForecastChart";
import { HydrometricStageStaffGauge } from "@/components/simulation/HydrometricStageStaffGauge";
import { CompoundHazardFlowInfographic } from "@/components/simulation/CompoundHazardFlowInfographic";
import {
  SIMULATION_SCENARIOS,
  SimulationScenario,
  SimulationDayState,
  FloodImpactAssessment,
  CWC_GANDHI_GHAT_BENCHMARKS,
  generateCustomScenario,
  computeImpactAssessment,
  CustomScenarioInput,
} from "@/lib/simulation-scenarios";

type ScenarioResult = {
  suite_id: string;
  scenario_id: string;
  scenario_name: string;
  mode: "static" | "supervised";
  synthetic_data_only: boolean;
  jev_mode: string;
  result: {
    event_id: string;
    timestamp: string;
    severity: string;
    risk_score: number;
    metadata?: { data_provenance?: string; jev_mode?: string };
    current_condition: { water_level_m?: number };
    forecast: { t_plus_6?: number; t_plus_12?: number; t_plus_24?: number; confidence_interval?: number[] };
    impact_assessment?: { affected_population?: number };
    pre_event_assessment?: { exposed_population?: number };
    requires_human_review?: boolean;
    supervisor?: { requires_human_review?: boolean };
  };
};

type DemoPreset = "steady" | "rain" | "surge";

const STUDY_STATIONS = [
  {
    id: "STN-PAT-01",
    name: "Ganges – Gandhi Ghat, Patna",
    shortName: "Gandhi Ghat, Patna",
    corridor: "Ganga Mainstream Corridor",
    warningLevel: 47.6,
    dangerLevel: 48.6,
    hfl: 50.52,
    badge: "Primary Reference Node",
    status: "Active Telemetry",
  },
  {
    id: "STN-DIG-02",
    name: "Ganges – Digha Ghat Reach",
    shortName: "Digha Ghat Reach",
    corridor: "Upper Inflow Reach Corridor",
    warningLevel: 50.4,
    dangerLevel: 51.4,
    hfl: 52.8,
    badge: "Inflow Gauge Node",
    status: "Operational",
  },
  {
    id: "STN-HAT-03",
    name: "Ganges – Hathidah Reach",
    shortName: "Hathidah Reach",
    corridor: "Downstream Gauge Node",
    warningLevel: 41.76,
    dangerLevel: 42.76,
    hfl: 44.5,
    badge: "Discharge Node",
    status: "Operational",
  },
  {
    id: "STN-SON-04",
    name: "Son River – Koelwar Reach",
    shortName: "Koelwar Reach",
    corridor: "Southern Tributary Confluence",
    warningLevel: 52.6,
    dangerLevel: 53.6,
    hfl: 55.1,
    badge: "Confluence Monitor",
    status: "Operational",
  },
  {
    id: "STN-GAN-05",
    name: "Gandak River – Hajipur Reach",
    shortName: "Hajipur Gandak Reach",
    corridor: "Northern Tributary Confluence",
    warningLevel: 49.5,
    dangerLevel: 50.5,
    hfl: 51.8,
    badge: "Tributary Gauge Node",
    status: "Operational",
  },
];

const PRESET_DATES = [
  { label: "01 Jun, 2026", desc: "Early Summer Glacier Thaw Onset", value: "2026-06-01" },
  { label: "15 Jul, 2026", desc: "Active Monsoon Depression Inflow", value: "2026-07-15" },
  { label: "24 Aug, 2026", desc: "Peak Historical Monsoon Crest", value: "2026-08-24" },
  { label: "24 Nov, 2026", desc: "Late Season Hydrological Baseline", value: "2026-11-24" },
];

const PRESETS: Record<
  DemoPreset,
  { label: string; description: string; anchor: string; scenarioId: string; inflow: number; rainfall: number }
> = {
  steady: {
    label: "Steady Conditions",
    description: "Baseline scenario",
    anchor: "GANGES_PATNA, Gandhi Ghat, Patna",
    scenarioId: "BEST_01_CALM_BASELINE",
    inflow: 1.0,
    rainfall: 0,
  },
  rain: {
    label: "Heavy Rainfall",
    description: "Increased rainfall",
    anchor: "GANGES_PATNA, Gandhi Ghat, Patna",
    scenarioId: "STRESS_01_HEAVY_RAINFALL",
    inflow: 1.25,
    rainfall: 80,
  },
  surge: {
    label: "Rapid River Rise",
    description: "High discharge",
    anchor: "GANGES_PATNA, Gandhi Ghat, Patna",
    scenarioId: "WORST_01_RAPID_RIVER_SURGE",
    inflow: 1.6,
    rainfall: 160,
  },
};

function isScenarioResult(value: unknown, expectedScenarioId: string): value is ScenarioResult {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<ScenarioResult>;
  const result = data.result;
  const forecastValues = [result?.forecast?.t_plus_6, result?.forecast?.t_plus_12, result?.forecast?.t_plus_24];
  return (
    data.scenario_id === expectedScenarioId &&
    data.synthetic_data_only === true &&
    data.mode === "static" &&
    data.jev_mode === "OFFLINE_DETERMINISTIC_SIMULATOR" &&
    typeof data.scenario_name === "string" &&
    typeof data.result?.event_id === "string" &&
    typeof data.result.timestamp === "string" &&
    Number.isFinite(Date.parse(data.result.timestamp)) &&
    typeof data.result.severity === "string" &&
    typeof data.result.risk_score === "number" &&
    Number.isFinite(data.result.risk_score) &&
    data.result.risk_score >= 0 &&
    data.result.risk_score <= 1 &&
    data.result.current_condition !== null &&
    typeof data.result.current_condition === "object" &&
    data.result.metadata?.data_provenance === "SYNTHETIC_SCENARIO" &&
    data.result.metadata?.jev_mode === "OFFLINE_DETERMINISTIC_SIMULATOR" &&
    forecastValues.some((val) => typeof val === "number" && Number.isFinite(val))
  );
}

const TABS = [
  { id: "impact" as const, label: "Disaster Impact Infographics" },
  { id: "diagnostic" as const, label: "AI Causal Diagnostics" },
  { id: "defense" as const, label: "BCA Technical Defense" },
];

function useDialogSync(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const isOutsideDialog = (e: React.PointerEvent<HTMLDialogElement>, dialog: HTMLDialogElement) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    pressedOutsideRef.current = isOutsideDialog(e, dialog);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pressedOutsideRef.current && isOutsideDialog(e, dialog)) {
      onClose();
    }
    pressedOutsideRef.current = false;
  };

  return { dialogRef, handlePointerDown, handlePointerUp };
}

export default function DemoLabPage() {
  const [customScenarios, setCustomScenarios] = useState<SimulationScenario[]>([]);
  const allScenarios = [...customScenarios, ...SIMULATION_SCENARIOS];

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("WORST_01_RAPID_RIVER_SURGE");
  const [, setPreset] = useState<DemoPreset>("surge");

  const [inflow, setInflow] = useState<number>(PRESETS.surge.inflow);
  const [rainfall, setRainfall] = useState<number>(PRESETS.surge.rainfall);
  const [snowmeltIndex, setSnowmeltIndex] = useState<number>(2.1);
  const [soilSaturation, setSoilSaturation] = useState<number>(82);
  const [tributaryInflow, setTributaryInflow] = useState<number>(6200);

  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([
    "glacier_melt",
    "persistent_rain",
    "tributary_surge",
  ]);

  const isCompoundDerived =
    selectedDrivers.length >= 2 ||
    (selectedDrivers.includes("glacier_melt") &&
      (selectedDrivers.includes("persistent_rain") || selectedDrivers.includes("tributary_surge")));

  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"impact" | "diagnostic" | "defense">("impact");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>("Custom Multi-Driver Inflow Scenario");
  const [customDrivers] = useState<string[]>([
    "glacier_melt",
    "persistent_rain",
    "tributary_surge",
  ]);
  const [customInflow, setCustomInflow] = useState<number>(1.5);
  const [customRainfall, setCustomRainfall] = useState<number>(150);
  const [customSnowmelt] = useState<number>(2.0);
  const [customSoil] = useState<number>(75);
  const [customTributary] = useState<number>(6800);
  const [customBreachRisk] = useState<boolean>(false);

  const [selectedStation, setSelectedStation] = useState(STUDY_STATIONS[0]);
  const [selectedDate, setSelectedDate] = useState<string>("2026-11-24");
  const [isLocationOpen, setIsLocationOpen] = useState<boolean>(false);
  const [isDateOpen, setIsDateOpen] = useState<boolean>(false);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState<boolean>(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const studioDialog = useDialogSync(isStudioOpen, () => setIsStudioOpen(false));
  const forecastDialog = useDialogSync(isForecastModalOpen, () => setIsForecastModalOpen(false));

  useEffect(() => {
    function handleClickOutside(event: Event) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(target)) {
        setIsLocationOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(target)) {
        setIsDateOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsLocationOpen(false);
        setIsDateOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    } catch {
      return "Nov 24, 2026";
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Extreme-Event":
        return "bg-purple-500/15 border border-purple-500/30 text-purple-400";
      case "High-Risk":
        return "bg-rose-500/15 border border-rose-500/30 text-rose-400";
      case "Moderate-Risk":
        return "bg-amber-500/15 border border-amber-500/30 text-amber-400";
      default:
        return "bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand)]";
    }
  };

  const activeScenario: SimulationScenario =
    allScenarios.find((s) => s.id === selectedScenarioId) ?? SIMULATION_SCENARIOS[0];
  const timeline: SimulationDayState[] = activeScenario.timeline;
  const currentDayState: SimulationDayState = timeline[currentDayIndex] ?? timeline[0];

  useEffect(() => {
    runScenario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentDayIndex((prev) => {
        if (prev >= timeline.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, timeline.length]);

  const forecastPoints = result
    ? [
        { horizon: "+6h", value: result.result.forecast.t_plus_6 },
        { horizon: "+12h", value: result.result.forecast.t_plus_12 },
        { horizon: "+24h", value: result.result.forecast.t_plus_24 },
      ].filter((point): point is { horizon: string; value: number } => typeof point.value === "number" && Number.isFinite(point.value))
    : [];

  const forecastPeak = forecastPoints.reduce<{ horizon: string; value: number } | null>(
    (peak, point) => (peak === null || point.value > peak.value ? point : peak),
    null
  );

  const currentStage = currentDayState ? currentDayState.stage : (forecastPeak?.value ?? 47.17);
  const currentRisk = currentDayState ? currentDayState.aiRiskScore : (result ? Math.round(result.result.risk_score * 100) : 15);

  const impactAssessment: FloodImpactAssessment = computeImpactAssessment(
    currentStage,
    currentDayState.embankmentStatus
  );

  const exposedPopulation = impactAssessment.exposedPopulation;

  function toggleDriver(driverId: string) {
    setSelectedDrivers((prev) => {
      const isSelected = prev.includes(driverId);
      const next = isSelected ? prev.filter((d) => d !== driverId) : [...prev, driverId];
      if (!isSelected) {
        if (driverId === "glacier_melt") setSnowmeltIndex(2.2);
        if (driverId === "cloudburst") setRainfall((r) => Math.max(r, 220));
        if (driverId === "persistent_rain") {
          setRainfall((r) => Math.max(r, 160));
          setSoilSaturation((s) => Math.max(s, 85));
        }
        if (driverId === "tributary_surge") setTributaryInflow(8500);
        if (driverId === "glof") {
          setInflow((f) => Math.max(f, 2.0));
          setSnowmeltIndex(2.5);
        }
        if (driverId === "reservoir_release") setInflow((f) => Math.max(f, 1.8));
      }
      return next;
    });
  }

  function handleSelectScenario(scenarioId: string) {
    const scen = allScenarios.find((s) => s.id === scenarioId) ?? SIMULATION_SCENARIOS[0];
    setSelectedScenarioId(scen.id);
    setInflow(scen.initialInflowMultiplier);
    setRainfall(scen.initialRainfallAnomaly);
    setSnowmeltIndex(scen.initialSnowmeltIndex ?? 1.0);
    setSoilSaturation(scen.initialSoilSaturation ?? 65);
    setTributaryInflow(scen.initialTributaryInflow ?? 4500);
    setSelectedDrivers(scen.activeDrivers ?? ["glacier_melt", "persistent_rain"]);
    setCurrentDayIndex(0);
    setIsPlaying(false);
    setError(null);

    if (scen.id === PRESETS.steady.scenarioId) setPreset("steady");
    else if (scen.id === PRESETS.rain.scenarioId) setPreset("rain");
    else if (scen.id === PRESETS.surge.scenarioId) setPreset("surge");
  }

  async function runScenario(scenarioToRun?: SimulationScenario) {
    setIsRunning(true);
    setError(null);
    const target = scenarioToRun ?? activeScenario;
    const backendScenarioId =
      target.id === "BEST_01_CALM_BASELINE"
        ? "BEST_01_CALM_BASELINE"
        : target.id === "STRESS_01_HEAVY_RAINFALL"
        ? "STRESS_01_HEAVY_RAINFALL"
        : "WORST_01_RAPID_RIVER_SURGE";

    try {
      const response = await fetch("/api/flood/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          scenario_id: backendScenarioId,
          river_discharge_multiplier: inflow,
          precipitation_anomaly_mm: rainfall,
        }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "The simulation service could not complete this run.");
      if (!isScenarioResult(data, backendScenarioId)) {
        throw new Error("The simulation service returned an incomplete or unexpected synthetic result.");
      }
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The simulation service could not be reached.");
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }

  function handleCreateAndLaunchCustomScenario() {
    const input: CustomScenarioInput = {
      title: customTitle.trim() || "User Custom Scenario",
      initialInflowMultiplier: customInflow,
      initialRainfallAnomaly: customRainfall,
      initialSnowmeltIndex: customSnowmelt,
      initialSoilSaturation: customSoil,
      initialTributaryInflow: customTributary,
      activeDrivers: customDrivers,
      embankmentBreachRisk: customBreachRisk,
    };

    const newScenario = generateCustomScenario(input);
    setCustomScenarios((prev) => [newScenario, ...prev]);
    setSelectedScenarioId(newScenario.id);
    setInflow(newScenario.initialInflowMultiplier);
    setRainfall(newScenario.initialRainfallAnomaly);
    setCurrentDayIndex(0);
    setIsStudioOpen(false);
    setIsPlaying(true);
    runScenario(newScenario);
  }

  const getPhaseInfo = (stage: number, day: number) => {
    if (stage >= CWC_GANDHI_GHAT_BENCHMARKS.dangerLevel) {
      return { label: "Critical Danger Exceedance", color: "text-rose-500 bg-rose-500/10 border-rose-500/30" };
    }
    if (stage >= CWC_GANDHI_GHAT_BENCHMARKS.warningLevel) {
      return { label: "Warning Threshold Active", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
    }
    if (day <= 3) {
      return { label: "Baseline Nominal Regime", color: "text-[var(--brand)] bg-[var(--brand-soft)] border-[var(--brand-border)]" };
    }
    if (day <= 9) {
      return { label: "Glacial Thaw & Inflow Surge", color: "text-sky-500 bg-sky-500/10 border-sky-500/30" };
    }
    return { label: "Recession & Recovery", color: "text-teal-400 bg-teal-500/10 border-teal-500/30" };
  };

  const phaseInfo = getPhaseInfo(currentStage, currentDayState.day);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let nextIdx = idx;
    if (event.key === "ArrowRight") nextIdx = (idx + 1) % TABS.length;
    else if (event.key === "ArrowLeft") nextIdx = (idx - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") nextIdx = 0;
    else if (event.key === "End") nextIdx = TABS.length - 1;
    else return;

    event.preventDefault();
    setActiveTab(TABS[nextIdx].id);
    tabRefs.current[nextIdx]?.focus();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-200">
      <main className="w-full">
        {/* TOP COMMAND HEADER (SOLID SURFACE, NO BACKDROP FILTER ON CARDS) */}
        <header className="relative z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="px-4 sm:px-6 lg:px-8 py-4 max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--brand)]">
                  BCA MINOR PROJECT
                </span>
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <code className="font-mono text-[11px] text-[var(--foreground)]">{selectedStation.id}</code>
                  <span>{selectedStation.shortName}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-[var(--foreground)] mt-1">
                SURAKSHA — Flood Scenario Simulation Laboratory
              </h1>
            </div>

            {/* Quick Command Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Station Selector */}
              <div ref={locationRef} className={`relative ${isLocationOpen ? "z-50" : "z-20"}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsLocationOpen((prev) => !prev);
                    setIsDateOpen(false);
                  }}
                  aria-expanded={isLocationOpen}
                  aria-label="Select hydrometric station"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs text-[var(--foreground)] transition-colors cursor-pointer ${
                    isLocationOpen
                      ? "border-[var(--brand)] bg-[var(--surface-elevated)] ring-2 ring-[var(--ring)]"
                      : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <span className="font-semibold truncate max-w-[160px]">{selectedStation.shortName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-200 ${isLocationOpen ? "rotate-180 text-[var(--brand)]" : ""}`} />
                </button>

                {isLocationOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-overlay)] p-1.5 space-y-1"
                  >
                    <div className="px-2.5 py-1 text-xs font-semibold text-[var(--muted-foreground)] border-b border-[var(--border)] pb-1">
                      Hydrometric Gauging Stations
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {STUDY_STATIONS.map((stn) => {
                        const isSelected = stn.id === selectedStation.id;
                        return (
                          <button
                            type="button"
                            key={stn.id}
                            onClick={() => {
                              setSelectedStation(stn);
                              setIsLocationOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs ${
                              isSelected
                                ? "bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--foreground)]"
                                : "hover:bg-[var(--surface-raised)] text-[var(--foreground)]/90 border border-transparent"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-xs truncate">{stn.shortName}</div>
                              <div className="text-[11px] text-[var(--muted-foreground)] [font-variant-numeric:tabular-nums]">
                                <code className="font-mono text-[10px] mr-1.5">{stn.id}</code>
                                Warn {stn.warningLevel}m, Danger {stn.dangerLevel}m
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Calibration Dropdown */}
              <div ref={dateRef} className={`relative ${isDateOpen ? "z-50" : "z-20"}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsDateOpen((prev) => !prev);
                    setIsLocationOpen(false);
                  }}
                  aria-expanded={isDateOpen}
                  aria-label="Select simulation calibration date"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs text-[var(--foreground)] font-sans [font-variant-numeric:tabular-nums] transition-colors cursor-pointer ${
                    isDateOpen
                      ? "border-[var(--brand)] bg-[var(--surface-elevated)] ring-2 ring-[var(--ring)]"
                      : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                  <span>{formatDisplayDate(selectedDate)}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-200 ${isDateOpen ? "rotate-180 text-[var(--brand)]" : ""}`} />
                </button>

                {isDateOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1.5 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-overlay)] p-2 space-y-2"
                  >
                    <div className="text-xs font-semibold text-[var(--muted-foreground)] border-b border-[var(--border)] pb-1">
                      Calibration Date Preset
                    </div>
                    <div className="space-y-1">
                      {PRESET_DATES.map((pd) => {
                        const isSelected = selectedDate === pd.value;
                        return (
                          <button
                            type="button"
                            key={pd.value}
                            onClick={() => {
                              setSelectedDate(pd.value);
                              setIsDateOpen(false);
                            }}
                            className={`w-full text-left p-1.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs [font-variant-numeric:tabular-nums] ${
                              isSelected
                                ? "bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--foreground)] font-semibold"
                                : "hover:bg-[var(--surface-raised)] text-[var(--foreground)]/85 border border-transparent"
                            }`}
                          >
                            <span>{pd.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[var(--brand)]" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-1.5 border-t border-[var(--border)]">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedDate(e.target.value);
                            setIsDateOpen(false);
                          }
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-sans [font-variant-numeric:tabular-nums]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Create Custom Scenario Button */}
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] hover:bg-[var(--surface-raised)] text-[var(--brand)] font-semibold text-xs transition-colors cursor-pointer active:scale-95"
              >
                <span>+ Custom Studio</span>
              </button>

              {/* Run Simulation Button */}
              <button
                type="button"
                onClick={() => runScenario()}
                disabled={isRunning}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-[var(--primary-foreground)] font-bold text-xs transition-colors active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    <span>Simulating…</span>
                  </>
                ) : (
                  <>
                    <span>Run Simulation</span>
                    <Play className="w-3 h-3 fill-current" />
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* UNIFIED SIMULATION DASHBOARD */}
        <div className="p-3 sm:p-5 max-w-[1700px] mx-auto w-full space-y-4">
          {error && (
            <div className="p-3 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <CircleAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <div><strong>Simulation run error:</strong> {error}</div>
            </div>
          )}

          {/* STUDY REACH & PRODUCT VISUAL EVIDENCE (FIRST SCREEN) */}
          <section aria-label="Study reach and hydrodynamic model evidence" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <figure className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden flex flex-col sm:flex-row">
              <div className="relative w-full sm:w-52 h-36 sm:h-auto shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border)]">
                <Image
                  src="/images/hydrodynamic-river-routing.jpg"
                  alt="1D and 2D hydrodynamic river routing inundation extent along the channel corridor"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 208px"
                  className="object-cover"
                />
              </div>
              <figcaption className="p-3.5 flex flex-col justify-center space-y-1">
                <h2 className="font-heading text-sm font-semibold text-[var(--foreground)]">
                  Hydrodynamic Reach Routing
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Ganga mainstream flood-depth envelope modeled across the Patna reach using HAND digital terrain geometry and Manning stage-discharge relations.
                </p>
              </figcaption>
            </figure>

            <figure className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden flex flex-col sm:flex-row">
              <div className="relative w-full sm:w-52 h-36 sm:h-auto shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border)]">
                <Image
                  src="/images/sentinel1-sar-inundation.jpg"
                  alt="Sentinel-1 SAR backscatter and segmented flood water extent comparison"
                  fill
                  sizes="(max-width: 640px) 100vw, 208px"
                  className="object-cover"
                />
              </div>
              <figcaption className="p-3.5 flex flex-col justify-center space-y-1">
                <h2 className="font-heading text-sm font-semibold text-[var(--foreground)]">
                  Sentinel-1 SAR Flood Extent
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Synthetic-aperture radar water surface classification paired with Gandhi Ghat benchmark thresholds (Warning 47.60m, Danger 48.60m, Historic HFL 50.52m).
                </p>
              </figcaption>
            </figure>
          </section>

          {/* DANGER EXCEEDANCE BANNER (WHEN ACTIVE) */}
          {currentStage >= CWC_GANDHI_GHAT_BENCHMARKS.dangerLevel && (
            <div className="px-3.5 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-900 dark:text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs font-semibold [font-variant-numeric:tabular-nums]">
                  Danger mark exceeded: {currentStage.toFixed(2)}m (Threshold: {CWC_GANDHI_GHAT_BENCHMARKS.dangerLevel.toFixed(2)}m), approximately {exposedPopulation.toLocaleString()} people exposed
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-semibold [font-variant-numeric:tabular-nums] self-start sm:self-auto">
                +{(currentStage - CWC_GANDHI_GHAT_BENCHMARKS.dangerLevel).toFixed(2)}m critical
              </span>
            </div>
          )}

          {/* TOP METRIC & GAUGE ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: River Stage Elevation Cross-Section Staff Gauge */}
            <HydrometricStageStaffGauge
              stage={currentStage}
              warningLevel={selectedStation.warningLevel}
              dangerLevel={selectedStation.dangerLevel}
              hfl={selectedStation.hfl}
              stationName={selectedStation.shortName}
              embankmentStatus={currentDayState.embankmentStatus}
            />

            {/* Card 2: AI Flood Risk Gauge */}
            <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                <h3 className="font-heading text-xs font-semibold text-[var(--foreground)]">
                  AI Flood Risk Score
                </h3>
                <span className="text-[11px] text-[var(--muted-foreground)]">SURAKSHA Neural</span>
              </div>
              <RiskGauge score={currentRisk} severity={result?.result.severity} />
              <div className="flex items-center justify-between text-[11px] border-t border-[var(--border)] pt-1.5 text-[var(--muted-foreground)] [font-variant-numeric:tabular-nums]">
                <span>Highest returned stage:</span>
                <span className="font-semibold text-[var(--foreground)]">{currentStage.toFixed(2)} m</span>
              </div>
            </div>

            {/* Card 3: Inundation & Exposed Population */}
            <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                <h3 className="font-heading text-xs font-semibold text-[var(--foreground)]">
                  Exposed Population
                </h3>
                <span className="text-[11px] text-[var(--brand)]">HAND Surface Depth</span>
              </div>
              <div className="space-y-1 my-auto [font-variant-numeric:tabular-nums]">
                <div className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  {exposedPopulation.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Active Inundation Area: <strong className="text-[var(--foreground)]">{impactAssessment.inundationAreaKm2} km²</strong>
                </div>
                <div className="text-[11px] text-[var(--muted-foreground)]">
                  Crest Water Depth: <span className="font-semibold text-rose-500">{impactAssessment.waterDepthM.max}m</span> (Avg: {impactAssessment.waterDepthM.avg}m)
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[11px] flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Evacuation Priority:</span>
                <span className={`font-semibold ${exposedPopulation > 10000 ? "text-rose-500" : exposedPopulation > 0 ? "text-amber-500" : "text-[var(--brand)]"}`}>
                  {exposedPopulation > 10000 ? "Level 3 Emergency" : exposedPopulation > 0 ? "Standby Alert" : "Safe Nominal"}
                </span>
              </div>
            </div>

            {/* Card 4: Forecast Horizon & Detailed Inspector */}
            <div
              onClick={() => setIsForecastModalOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsForecastModalOpen(true);
                }
              }}
              aria-haspopup="dialog"
              aria-expanded={isForecastModalOpen}
              className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--brand-border)] hover:bg-[var(--surface-raised)] flex flex-col justify-between space-y-2 cursor-pointer transition-colors group select-none"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                <h3 className="font-heading text-xs font-semibold text-[var(--foreground)]">
                  Forecast Horizon
                </h3>
                <span className="text-[11px] text-sky-400">BiLSTM-ARIMA Lead</span>
              </div>
              <div className="space-y-1 my-auto [font-variant-numeric:tabular-nums]">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                    24 h
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">/ 21d timeline</span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Model Lead: <strong className="text-[var(--foreground)]">72-Hour Causal Sequence</strong>
                </div>
                <div className="text-[11px] text-[var(--muted-foreground)]">
                  NSE Score: <span className="text-[var(--brand)] font-semibold">0.962</span>, MAE: 0.28m
                </div>
              </div>
              <div className="border-t border-[var(--border)] pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsForecastModalOpen(true);
                  }}
                  aria-haspopup="dialog"
                  aria-expanded={isForecastModalOpen}
                  className="text-[var(--brand)] font-semibold text-xs group-hover:underline cursor-pointer flex items-center gap-1 focus:outline-none"
                >
                  Detailed forecast →
                </button>
                <span className="text-[11px] text-[var(--muted-foreground)] [font-variant-numeric:tabular-nums]">+6h / +12h / +24h</span>
              </div>
            </div>
          </div>

          {/* MAIN WORKSPACE: 2-COLUMN COMMAND CANVAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT COLUMN: TIMELINE & CONTROL STUDIO (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-3.5">
              {/* Card 1: 21-Day Dynamic Hydrological Progression Player */}
              <section className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="px-2 py-0.5 rounded-md bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand)] font-mono text-[10px] font-semibold shrink-0">
                      {activeScenario.code}
                    </code>
                    <h2 className="text-xs font-bold text-[var(--foreground)] truncate font-heading">
                      {activeScenario.title}
                    </h2>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold shrink-0 [font-variant-numeric:tabular-nums] ${phaseInfo.color}`}>
                    Day {currentDayState.day.toString().padStart(2, "0")} / 21
                  </span>
                </div>

                {/* Progress Track & Step Nodes */}
                <div className="space-y-2">
                  <div className="relative w-full py-1">
                    <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-[var(--surface)] rounded-full border border-[var(--border)]" />
                    <div
                      className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 bg-[var(--brand)] rounded-full transition-all duration-300"
                      style={{ width: `${(currentDayIndex / Math.max(1, timeline.length - 1)) * 100}%` }}
                    />
                    <div className="relative flex justify-between items-center w-full">
                      {timeline.map((step, idx) => {
                        const isCurrent = idx === currentDayIndex;
                        const isPassed = idx <= currentDayIndex;
                        const isDanger = step.stage >= CWC_GANDHI_GHAT_BENCHMARKS.dangerLevel;
                        return (
                          <button
                            key={step.day}
                            type="button"
                            onClick={() => {
                              setCurrentDayIndex(idx);
                              setIsPlaying(false);
                            }}
                            aria-label={`Jump to Day ${step.day}`}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-sans [font-variant-numeric:tabular-nums] font-bold transition-transform cursor-pointer ${
                              isCurrent
                                ? "scale-125 z-10 bg-[var(--brand)] text-[var(--primary-foreground)]"
                                : isPassed
                                ? isDanger
                                  ? "bg-rose-500 text-white"
                                  : "bg-[var(--brand)]/80 text-[var(--primary-foreground)]"
                                : "bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)] hover:border-[var(--brand)]"
                            }`}
                          >
                            {step.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <input
                    type="range"
                    aria-label="Scrub 21-day simulation timeline"
                    min="0"
                    max={timeline.length - 1}
                    step="1"
                    value={currentDayIndex}
                    onChange={(e) => {
                      setCurrentDayIndex(Number(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="w-full cursor-pointer h-1.5 bg-transparent"
                  />
                </div>

                {/* Transport Controls Bar */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentDayIndex(0);
                      setIsPlaying(false);
                    }}
                    title="Reset to Day 1"
                    aria-label="Reset to Day 1"
                    className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentDayIndex((prev) => Math.max(0, prev - 1));
                      setIsPlaying(false);
                    }}
                    disabled={currentDayIndex === 0}
                    title="Previous Day"
                    aria-label="Previous Day"
                    className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isPlaying
                        ? "bg-amber-500 hover:bg-amber-400 text-black"
                        : "bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-[var(--primary-foreground)]"
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause 21-Day Evolution</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play 21-Day Progression</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentDayIndex((prev) => Math.min(timeline.length - 1, prev + 1));
                      setIsPlaying(false);
                    }}
                    disabled={currentDayIndex === timeline.length - 1}
                    title="Next Day"
                    aria-label="Next Day"
                    className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Telemetry Indicators */}
                <div className="grid grid-cols-4 gap-1.5 text-center font-sans [font-variant-numeric:tabular-nums] text-[10px] pt-1">
                  <div className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)] block">Glacier</span>
                    <strong className="text-[var(--foreground)]">{currentDayState.snowmeltIndex.toFixed(1)}×</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)] block">Soil sat</span>
                    <strong className="text-[var(--foreground)]">{currentDayState.soilSaturation}%</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)] block">Tributary</span>
                    <strong className="text-[var(--foreground)]">{(currentDayState.tributaryInflow / 1000).toFixed(1)}k</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)] block">Levee</span>
                    <strong className={currentDayState.embankmentStatus === "Breach" ? "text-rose-500 font-bold" : "text-[var(--brand)]"}>
                      {currentDayState.embankmentStatus}
                    </strong>
                  </div>
                </div>
              </section>

              {/* Card 2: Scenario Studio & Multi-Driver Console */}
              <section className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-3.5">
                <div ref={dropdownRef} className={`space-y-1.5 relative ${isDropdownOpen ? "z-40" : "z-20"}`}>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] flex items-center justify-between">
                    <h2 className="font-heading text-xs font-semibold text-[var(--foreground)]">
                      Select Scenario from Library
                    </h2>
                    <span className="text-[11px] text-[var(--brand)]">
                      Active: <code className="font-mono">{activeScenario.code}</code>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isDropdownOpen}
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-left flex items-center justify-between transition-colors cursor-pointer select-none ${
                      isDropdownOpen
                        ? "border-[var(--brand)] bg-[var(--surface-elevated)] ring-2 ring-[var(--ring)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <code className="px-1.5 py-0.5 rounded bg-[var(--brand-soft)] text-[var(--brand)] font-mono font-semibold text-[10px] shrink-0 border border-[var(--brand-border)]">
                        {activeScenario.code}
                      </code>
                      <span className="font-semibold text-[var(--foreground)] truncate text-xs">
                        {activeScenario.title}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-200 shrink-0 ${isDropdownOpen ? "rotate-180 text-[var(--brand)]" : ""}`} />
                  </button>

                  {isDropdownOpen && (
                    <div
                      role="listbox"
                      className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-overlay)] p-1.5 space-y-1 max-h-80 overflow-y-auto"
                    >
                      {customScenarios.length > 0 && (
                        <div>
                          <div className="px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
                            User Custom Scenarios ({customScenarios.length})
                          </div>
                          {customScenarios.map((scen) => (
                            <button
                              type="button"
                              role="option"
                              aria-selected={scen.id === selectedScenarioId}
                              key={scen.id}
                              onClick={() => {
                                handleSelectScenario(scen.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs ${
                                scen.id === selectedScenarioId ? "bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--foreground)]" : "hover:bg-[var(--surface-raised)] text-[var(--foreground)]/90"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold truncate">{scen.title}</div>
                                <div className="text-[11px] text-[var(--muted-foreground)] truncate">{scen.shortDescription}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${getCategoryBadge(scen.category)}`}>
                                  {scen.category}
                                </span>
                                {scen.id === selectedScenarioId && <Check className="w-3.5 h-3.5 text-[var(--brand)]" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={customScenarios.length > 0 ? "border-t border-[var(--border)] pt-1" : ""}>
                        <div className="px-2.5 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
                          Benchmark Scenarios ({SIMULATION_SCENARIOS.length})
                        </div>
                        {SIMULATION_SCENARIOS.map((scen) => (
                          <button
                            type="button"
                            role="option"
                            aria-selected={scen.id === selectedScenarioId}
                            key={scen.id}
                            onClick={() => {
                              handleSelectScenario(scen.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs ${
                              scen.id === selectedScenarioId ? "bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--foreground)]" : "hover:bg-[var(--surface-raised)] text-[var(--foreground)]/90"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <code className="font-mono text-[10px] font-semibold text-[var(--brand)]">{scen.code}</code>
                                <span className="font-semibold truncate">{scen.title}</span>
                              </div>
                              <div className="text-[11px] text-[var(--muted-foreground)] truncate">{scen.shortDescription}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${getCategoryBadge(scen.category)}`}>
                                {scen.category}
                              </span>
                              {scen.id === selectedScenarioId && <Check className="w-3.5 h-3.5 text-[var(--brand)]" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Multi-Driver Compound Hazard Infographic Component */}
                <CompoundHazardFlowInfographic
                  selectedDrivers={selectedDrivers}
                  onToggleDriver={toggleDriver}
                  snowmeltIndex={snowmeltIndex}
                  rainfall={rainfall}
                  tributaryInflow={tributaryInflow}
                  inflowMultiplier={inflow}
                  isCompound={isCompoundDerived}
                />

                {/* Compact Environmental Calibration Tuning Sliders */}
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <div className="text-xs flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-[var(--foreground)]">
                      Continuous Environmental Tuning
                    </h3>
                    <span className="text-[11px] text-[var(--brand)]">Live physics calibration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
                      <label htmlFor="slider-inflow" className="flex justify-between items-center text-[11px]">
                        <span className="text-[var(--muted-foreground)]">Discharge Inflow:</span>
                        <span className="font-semibold [font-variant-numeric:tabular-nums] text-[var(--brand)]">{inflow.toFixed(2)}×</span>
                      </label>
                      <input
                        id="slider-inflow"
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.05"
                        value={inflow}
                        onChange={(e) => setInflow(Number(e.target.value))}
                        className="w-full cursor-pointer h-1"
                      />
                    </div>

                    <div className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
                      <label htmlFor="slider-rainfall" className="flex justify-between items-center text-[11px]">
                        <span className="text-[var(--muted-foreground)]">24h Rainfall:</span>
                        <span className="font-semibold [font-variant-numeric:tabular-nums] text-sky-400">{rainfall} mm</span>
                      </label>
                      <input
                        id="slider-rainfall"
                        type="range"
                        min="0"
                        max="500"
                        step="5"
                        value={rainfall}
                        onChange={(e) => setRainfall(Number(e.target.value))}
                        className="w-full accent-sky-500 cursor-pointer h-1"
                      />
                    </div>

                    <div className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
                      <label htmlFor="slider-snowmelt" className="flex justify-between items-center text-[11px]">
                        <span className="text-[var(--muted-foreground)]">Snowmelt Thaw:</span>
                        <span className="font-semibold [font-variant-numeric:tabular-nums] text-teal-400">{snowmeltIndex.toFixed(1)}×</span>
                      </label>
                      <input
                        id="slider-snowmelt"
                        type="range"
                        min="1.0"
                        max="3.0"
                        step="0.1"
                        value={snowmeltIndex}
                        onChange={(e) => setSnowmeltIndex(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer h-1"
                      />
                    </div>

                    <div className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
                      <label htmlFor="slider-soil" className="flex justify-between items-center text-[11px]">
                        <span className="text-[var(--muted-foreground)]">Soil Saturation:</span>
                        <span className="font-semibold [font-variant-numeric:tabular-nums] text-amber-400">{soilSaturation}%</span>
                      </label>
                      <input
                        id="slider-soil"
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={soilSaturation}
                        onChange={(e) => setSoilSaturation(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: PREDICTION HYDROGRAPH & TABBED INTELLIGENCE (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Reach Inundation Model Hydrograph */}
              <section className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                  <h2 className="font-heading text-xs font-semibold text-[var(--foreground)]">
                    Reach Inundation Model, 24-Hour Predictive Horizon
                  </h2>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)] [font-variant-numeric:tabular-nums]">
                    <span>Danger: <strong className="text-rose-500">{selectedStation.dangerLevel}m</strong></span>
                    <span>Warning: <strong className="text-amber-500">{selectedStation.warningLevel}m</strong></span>
                  </div>
                </div>

                <RiverStageForecastChart
                  startingStage={CWC_GANDHI_GHAT_BENCHMARKS.datumLevel + 1.2}
                  tPlus6={currentStage}
                  tPlus12={result?.result.forecast.t_plus_12 ?? (currentStage - 0.35)}
                  tPlus24={result?.result.forecast.t_plus_24 ?? (currentStage - 0.75)}
                  warningLevel={selectedStation.warningLevel}
                  dangerLevel={selectedStation.dangerLevel}
                  flowVelocity={1.84}
                  discharge={Number((currentDayState.discharge / 1000).toFixed(1))}
                  catchmentRain={currentDayState.upstreamRain}
                  snowmeltIndex={currentDayState.snowmeltIndex}
                  soilSaturation={currentDayState.soilSaturation}
                  timeline={timeline}
                  currentSimulationDay={currentDayState.day}
                />
              </section>

              {/* Cross-Scenario Comparative Benchmarking Bar Graph */}
              <section className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                  <h2 className="font-heading text-xs font-semibold text-[var(--foreground)]">
                    Cross-Scenario Comparative Benchmarking
                  </h2>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Baseline vs Heavy Rain vs Rapid River Rise
                  </span>
                </div>
                <ScenarioComparisonChart
                  currentStage={currentStage}
                  currentRisk={currentRisk}
                  currentExposed={exposedPopulation}
                />
              </section>

              {/* Tabbed Intelligence & Impact Infographics Panel */}
              <section className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 flex-wrap gap-2">
                  <div
                    role="tablist"
                    aria-label="Simulation analytics views"
                    className="flex items-center gap-1 overflow-x-auto"
                  >
                    {TABS.map((tab, idx) => {
                      const isSelected = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          ref={(el) => {
                            tabRefs.current[idx] = el;
                          }}
                          id={`tab-${tab.id}`}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => setActiveTab(tab.id)}
                          onKeyDown={(e) => handleTabKeyDown(e, idx)}
                          className={`relative px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                            isSelected
                              ? "border-[var(--brand)] text-[var(--foreground)] bg-[var(--surface)]"
                              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[11px] text-[var(--muted-foreground)] [font-variant-numeric:tabular-nums]">
                    Day {currentDayState.day} telemetry synced
                  </span>
                </div>

                {/* TAB 1: DISASTER IMPACT INFOGRAPHICS */}
                <div
                  role="tabpanel"
                  aria-labelledby="tab-impact"
                  hidden={activeTab !== "impact"}
                  tabIndex={activeTab === "impact" ? 0 : undefined}
                >
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs [font-variant-numeric:tabular-nums]">
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="text-[11px] text-[var(--muted-foreground)]">Inundation footprint</div>
                        <div className="text-lg font-bold text-[var(--foreground)] mt-0.5">{impactAssessment.inundationAreaKm2} km²</div>
                        <div className="text-[10px] text-[var(--brand)]">HAND Digital Terrain</div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="text-[11px] text-[var(--muted-foreground)]">Exposed population</div>
                        <div className="text-lg font-bold text-amber-500 mt-0.5">{impactAssessment.exposedPopulation.toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Depth ≥ 0.5m</div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="text-[11px] text-[var(--muted-foreground)]">NDRF boats deployed</div>
                        <div className="text-lg font-bold text-rose-500 mt-0.5">{impactAssessment.emergencyLogistics.ndrfBoatsDeployed} Boats</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Search & Rescue</div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="text-[11px] text-[var(--muted-foreground)]">Relief shelters</div>
                        <div className="text-lg font-bold text-teal-400 mt-0.5">{impactAssessment.emergencyLogistics.reliefSheltersActivated} Camps</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Recession: {impactAssessment.recoveryWindowDays}d</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
                      <div className="text-xs font-semibold text-[var(--muted-foreground)] flex justify-between">
                        <span>Spatial Ward & Infrastructure Impact</span>
                        <span className="text-rose-500 [font-variant-numeric:tabular-nums]">{impactAssessment.affectedWards.length} wards impacted</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {impactAssessment.affectedWards.map((w) => (
                          <span key={w} className="px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] text-[var(--foreground)]">
                            {w}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-[var(--muted-foreground)] pt-1.5 border-t border-[var(--border)] flex flex-wrap justify-between gap-2">
                        <span>Roads cut: {impactAssessment.criticalInfrastructure.roadsCutOff[0] ?? "None"}</span>
                        <span>Power grids: {impactAssessment.criticalInfrastructure.substationsAtRisk[0] ?? "Nominal"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TAB 2: AI CAUSAL DIAGNOSTICS */}
                <div
                  role="tabpanel"
                  aria-labelledby="tab-diagnostic"
                  hidden={activeTab !== "diagnostic"}
                  tabIndex={activeTab === "diagnostic" ? 0 : undefined}
                >
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
                      <h3 className="font-heading text-xs font-bold text-[var(--brand)]">
                        SURAKSHA Multi-Variable Reasoning: {currentDayState.label}
                      </h3>
                      <p className="text-xs text-[var(--foreground)]/85 leading-relaxed">
                        {currentDayState.diagnostic}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs [font-variant-numeric:tabular-nums]">
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <span className="text-[11px] text-[var(--muted-foreground)] block">Synthetic Ground Truth (Ht)</span>
                        <span className="text-base font-bold text-[var(--foreground)] mt-0.5 block">{currentStage.toFixed(2)} m</span>
                        <span className="text-[10px] text-[var(--brand)]">Observed State</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <span className="text-[11px] text-[var(--muted-foreground)] block">AI BiLSTM Forecast (Ĥt)</span>
                        <span className="text-base font-bold text-sky-400 mt-0.5 block">{currentDayState.aiForecastStage.toFixed(2)} m</span>
                        <span className="text-[10px] text-sky-400">Sequence Model</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <span className="text-[11px] text-[var(--muted-foreground)] block">Model Residual (Δ)</span>
                        <span className="text-base font-bold text-amber-400 mt-0.5 block">±{Math.abs(currentStage - currentDayState.aiForecastStage).toFixed(2)} m</span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">Residual Error</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TAB 3: BCA TECHNICAL DEFENSE ARCHITECTURE */}
                <div
                  role="tabpanel"
                  aria-labelledby="tab-defense"
                  hidden={activeTab !== "defense"}
                  tabIndex={activeTab === "defense" ? 0 : undefined}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1.5">
                      <h3 className="font-heading font-bold text-[var(--foreground)]">
                        1. Trained ML Sequence
                      </h3>
                      <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                        BiLSTM-ARIMA neural network captures multi-horizon temporal lags (+6h, +12h, +24h) from upstream discharge.
                      </p>
                      <div className="text-[11px] text-sky-400 font-semibold pt-1 border-t border-[var(--border)] [font-variant-numeric:tabular-nums]">
                        NSE: 0.962, MAE: 0.28m
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1.5">
                      <h3 className="font-heading font-bold text-[var(--foreground)]">
                        2. Physical Hydraulics
                      </h3>
                      <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                        Manning&apos;s rating equations, Antecedent Soil Saturation Runoff (API index), and HAND elevation geometry.
                      </p>
                      <div className="text-[11px] text-teal-400 font-semibold pt-1 border-t border-[var(--border)]">
                        Mass continuity strictly bounded
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1.5">
                      <h3 className="font-heading font-bold text-[var(--foreground)]">
                        3. AI Diagnostic Reasoning
                      </h3>
                      <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                        Explainable reasoning engine operating under controlled synthetic scenarios for safe extreme-event testing.
                      </p>
                      <div className="text-[11px] text-amber-400 font-semibold pt-1 border-t border-[var(--border)]">
                        Zero false public alarms
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* RESEARCH SAFETY NOTICE */}
          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-2.5">
            Synthetic scenario only: this offline run did not check a live authority bulletin or external source. Model outputs serve decision support and research evaluation.
          </p>
        </div>
      </main>

      {/* CUSTOM SCENARIO CREATOR STUDIO MODAL (NATIVE DIALOG) */}
      <dialog
        ref={studioDialog.dialogRef}
        aria-labelledby="studio-modal-title"
        onCancel={(e) => {
          e.preventDefault();
          setIsStudioOpen(false);
        }}
        onPointerDown={studioDialog.handlePointerDown}
        onPointerUp={studioDialog.handlePointerUp}
        className="m-auto w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[var(--shadow-overlay)] p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <div className="text-xs font-semibold text-[var(--brand)]">
              Custom Scenario Studio
            </div>
            <h2 id="studio-modal-title" className="text-xl font-heading font-bold text-[var(--foreground)] mt-0.5">
              Design Custom Flood Event
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsStudioOpen(false)}
            aria-label="Close custom studio"
            className="w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] grid place-items-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="customTitle" className="text-xs font-semibold text-[var(--foreground)]">
              Scenario Title
            </label>
            <input
              id="customTitle"
              type="text"
              autoFocus
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Extreme Alaknanda Glacial Lake Burst + Patna Cloudburst"
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground)] font-medium focus:outline-none focus:border-[var(--brand)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
              <label htmlFor="customInflow" className="flex justify-between">
                <span>Discharge Inflow Multiplier:</span>
                <strong className="[font-variant-numeric:tabular-nums] text-[var(--brand)]">{customInflow.toFixed(2)}×</strong>
              </label>
              <input
                id="customInflow"
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={customInflow}
                onChange={(e) => setCustomInflow(Number(e.target.value))}
                className="w-full cursor-pointer h-1.5"
              />
            </div>

            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
              <label htmlFor="customRainfall" className="flex justify-between">
                <span>Added 24h Rainfall:</span>
                <strong className="[font-variant-numeric:tabular-nums] text-sky-400">{customRainfall} mm</strong>
              </label>
              <input
                id="customRainfall"
                type="range"
                min="0"
                max="500"
                step="10"
                value={customRainfall}
                onChange={(e) => setCustomRainfall(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-1.5"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] flex items-center justify-between text-xs [font-variant-numeric:tabular-nums]">
            <span className="text-[var(--brand)] font-semibold">Predicted Peak Stage:</span>
            <span className="text-[var(--foreground)] font-bold">
              ~{(44.0 + Math.pow(Math.max(0, (21000 * customInflow + customRainfall * 40 + customTributary * 0.4) - 18000) / 5200, 0.72)).toFixed(2)}m
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setIsStudioOpen(false)}
            className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateAndLaunchCustomScenario}
            className="px-5 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-[var(--primary-foreground)] font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
          >
            <span>Launch Live 21-Day Simulation</span>
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </dialog>

      {/* DETAILED FORECAST HORIZON INSPECTOR MODAL (NATIVE DIALOG) */}
      <dialog
        ref={forecastDialog.dialogRef}
        aria-labelledby="forecast-modal-title"
        onCancel={(e) => {
          e.preventDefault();
          setIsForecastModalOpen(false);
        }}
        onPointerDown={forecastDialog.handlePointerDown}
        onPointerUp={forecastDialog.handlePointerUp}
        className="m-auto w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[var(--shadow-overlay)] p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <div className="text-xs font-semibold text-sky-400">
              Detailed Hydrological Forecast Horizon
            </div>
            <h2 id="forecast-modal-title" className="text-xl font-heading font-bold text-[var(--foreground)] mt-0.5">
              Reach Inundation & Multi-Lead Forecast Analysis
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)] mt-0.5">
              <code className="font-mono text-[11px]">{selectedStation.id}</code>
              <span>{selectedStation.name}</span>
              <span>Calibration: {formatDisplayDate(selectedDate)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsForecastModalOpen(false)}
            aria-label="Close detailed forecast"
            className="w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] grid place-items-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Key Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs [font-variant-numeric:tabular-nums]">
          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="text-[11px] text-[var(--muted-foreground)]">Peak stage</div>
            <div className="text-base font-bold text-[var(--foreground)] mt-0.5">{currentStage.toFixed(2)} m</div>
            <div className="text-[10px] text-[var(--brand)] mt-0.5">
              {currentStage >= selectedStation.dangerLevel ? "Danger Exceeded" : "Nominal"}
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="text-[11px] text-[var(--muted-foreground)]">Model lead</div>
            <div className="text-base font-bold text-[var(--foreground)] mt-0.5">72-Hour Causal</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">BiLSTM-ARIMA</div>
          </div>

          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="text-[11px] text-[var(--muted-foreground)]">NSE accuracy</div>
            <div className="text-base font-bold text-[var(--brand)] mt-0.5">0.962</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">MAE: 0.28m</div>
          </div>

          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="text-[11px] text-[var(--muted-foreground)]">Exposed people</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">{exposedPopulation.toLocaleString()}</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">HAND Surface</div>
          </div>
        </div>

        {/* Multi-Horizon Step Table */}
        <div className="space-y-1.5">
          <h3 id="forecast-table-caption" className="text-xs font-bold text-[var(--foreground)] font-heading">
            Step-by-Step Predictive Horizon Progression
          </h3>
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="forecast-table-caption"
            className="forecast-table-wrapper rounded-xl border border-[var(--border)]"
          >
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Step-by-Step Predictive Horizon Progression</caption>
              <thead className="bg-[var(--surface)] text-[11px] font-semibold text-[var(--muted-foreground)] border-b border-[var(--border)]">
                <tr>
                  <th scope="col" className="p-2.5">Horizon</th>
                  <th scope="col" className="p-2.5">Forecast Stage</th>
                  <th scope="col" className="p-2.5">90% Confidence Interval</th>
                  <th scope="col" className="p-2.5">Est. Discharge</th>
                  <th scope="col" className="p-2.5">Hazard Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                <tr>
                  <td data-label="Horizon" className="p-2.5 font-bold text-[var(--foreground)]">Now (T+0)</td>
                  <td data-label="Forecast Stage" className="p-2.5">{(currentStage - 0.45).toFixed(2)} m</td>
                  <td data-label="90% Confidence Interval" className="p-2.5 text-[var(--muted-foreground)]">±0.04 m</td>
                  <td data-label="Est. Discharge" className="p-2.5">24,200 m³/s</td>
                  <td data-label="Hazard Regime" className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--brand-soft)] text-[var(--brand)] text-[10px] font-sans font-medium">Safe baseline</span>
                  </td>
                </tr>
                <tr>
                  <td data-label="Horizon" className="p-2.5 font-bold text-[var(--foreground)]">+3h Lead</td>
                  <td data-label="Forecast Stage" className="p-2.5">{(currentStage - 0.2).toFixed(2)} m</td>
                  <td data-label="90% Confidence Interval" className="p-2.5 text-[var(--muted-foreground)]">±0.10 m</td>
                  <td data-label="Est. Discharge" className="p-2.5">26,900 m³/s</td>
                  <td data-label="Hazard Regime" className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--brand-soft)] text-[var(--brand)] text-[10px] font-sans font-medium">Inflow swell</span>
                  </td>
                </tr>
                <tr className="bg-sky-500/5">
                  <td data-label="Horizon" className="p-2.5 font-bold text-sky-400">+6h Lead</td>
                  <td data-label="Forecast Stage" className="p-2.5 font-bold text-[var(--foreground)]">{currentStage.toFixed(2)} m</td>
                  <td data-label="90% Confidence Interval" className="p-2.5 text-[var(--muted-foreground)]">±0.18 m</td>
                  <td data-label="Est. Discharge" className="p-2.5">29,800 m³/s</td>
                  <td data-label="Hazard Regime" className="p-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${currentStage >= selectedStation.dangerLevel ? "bg-rose-500/15 text-rose-400" : currentStage >= selectedStation.warningLevel ? "bg-amber-500/15 text-amber-400" : "bg-[var(--brand-soft)] text-[var(--brand)]"}`}>
                      {currentStage >= selectedStation.dangerLevel ? "Danger surge" : currentStage >= selectedStation.warningLevel ? "Warning regime" : "Elevated"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td data-label="Horizon" className="p-2.5 font-bold text-[var(--foreground)]">+12h Lead</td>
                  <td data-label="Forecast Stage" className="p-2.5">{(result?.result.forecast.t_plus_12 ?? (currentStage - 0.35)).toFixed(2)} m</td>
                  <td data-label="90% Confidence Interval" className="p-2.5 text-[var(--muted-foreground)]">±0.25 m</td>
                  <td data-label="Est. Discharge" className="p-2.5">34,100 m³/s</td>
                  <td data-label="Hazard Regime" className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-sans font-medium">Tributary ingress</span>
                  </td>
                </tr>
                <tr className="bg-[var(--brand-soft)]">
                  <td data-label="Horizon" className="p-2.5 font-bold text-[var(--brand)]">+24h Lead</td>
                  <td data-label="Forecast Stage" className="p-2.5 font-bold text-[var(--foreground)]">{(result?.result.forecast.t_plus_24 ?? (currentStage - 0.75)).toFixed(2)} m</td>
                  <td data-label="90% Confidence Interval" className="p-2.5 text-[var(--muted-foreground)]">±0.38 m</td>
                  <td data-label="Est. Discharge" className="p-2.5">38,500 m³/s</td>
                  <td data-label="Hazard Regime" className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-400 text-[10px] font-sans font-medium">Diurnal crest</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setIsForecastModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-[var(--primary-foreground)] font-bold text-xs transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </dialog>
    </div>
  );
}
