"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lock, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, MapPin, Phone } from "lucide-react";

interface SOSItem {
  id: string;
  citizen_name: string;
  contact_phone: string;
  urgency: string;
  description: string;
  location_name: string;
  status: string;
  created_at: string;
}

export default function AdminSosQueuePage() {
  const [queue, setQueue] = useState<SOSItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/flood/sos", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "The assistance queue is unavailable.");
      setQueue(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The assistance queue is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/flood/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to update status.");

      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      setSuccessToast(`Ticket #${id.slice(0, 8).toUpperCase()} updated to ${newStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-zinc-900 border border-emerald-500/40 text-xs font-mono text-emerald-300 shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold mb-1">
            Operations Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Emergency Assistance Queue
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Triage, incident review, and field dispatch desk for citizen flood assistance requests.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Alert Banner */}
      <div className="p-4 rounded-xl border border-white/10 bg-zinc-950 text-zinc-300 flex items-start gap-3.5">
        <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <strong className="text-white font-semibold block">Restricted Operations Console</strong>
          <p className="text-zinc-400 leading-relaxed">
            Records shown here are submitted directly by citizens in flood-affected sectors. Update status flags to coordinate with ground response teams.
          </p>
        </div>
      </div>

      {/* Incoming Requests Table Panel */}
      <div className="p-6 rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Active Queue Overview</h3>
          <span className="text-xs font-mono text-zinc-400">
            <span className="text-red-400 font-bold">{queue.filter((q) => q.status === "OPEN").length} Open</span> ·{" "}
            <span className="text-amber-400 font-bold">{queue.filter((q) => q.status === "IN_REVIEW").length} In Review</span> ·{" "}
            {queue.length} Total
          </span>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && queue.length === 0 && (
          <div className="py-12 text-center text-xs text-zinc-500">
            No active assistance requests in the queue.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Ticket ID</th>
                <th className="py-3 px-3">Citizen & Contact</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Urgency & Description</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-mono text-white font-bold text-xs">
                    #{item.id.slice(0, 8).toUpperCase()}
                    <div className="text-[10px] font-normal text-zinc-500">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-white font-medium">{item.citizen_name}</div>
                    <a
                      href={`tel:${item.contact_phone.replace(/[^0-9+() -]/g, "")}`}
                      className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" /> {item.contact_phone}
                    </a>
                  </td>
                  <td className="py-3 px-3 text-zinc-300 max-w-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{item.location_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-zinc-300 max-w-sm">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold mb-1 ${
                        item.urgency === "HIGH"
                          ? "bg-red-500/20 text-red-300"
                          : item.urgency === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {item.urgency} URGENCY
                    </span>
                    <div className="text-[11px] text-zinc-400 leading-relaxed whitespace-normal">
                      {item.description}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.status === "OPEN"
                          ? "bg-red-500/15 text-red-400 border-red-500/30"
                          : item.status === "IN_REVIEW"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : item.status === "DISPATCHED"
                          ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-900 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="OPEN">Mark Open</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DISPATCHED">Dispatched</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
