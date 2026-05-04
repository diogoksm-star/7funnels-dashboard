"use client";

import { demoState } from "@/lib/demo-data";
import { normalizeMetricRows } from "@/lib/parser";
import type { AppState } from "@/lib/types";

const key = "ads-report-dashboard-state-v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return demoState;
  const stored = window.localStorage.getItem(key);
  if (!stored) return demoState;
  try {
    const parsed = JSON.parse(stored) as AppState;
    const rows = Array.isArray(parsed.rows) ? repairRows(parsed.rows) : demoState.rows;
    return {
      clients: Array.isArray(parsed.clients) ? parsed.clients : demoState.clients,
      imports: Array.isArray(parsed.imports) ? parsed.imports : demoState.imports,
      rows,
      mappings: Array.isArray(parsed.mappings) ? parsed.mappings : demoState.mappings,
    };
  } catch {
    return demoState;
  }
}

export function saveState(state: AppState) {
  window.localStorage.setItem(key, JSON.stringify(state));
}

function repairRows(rows: AppState["rows"]) {
  return rows.map((row) => {
    if (!row.raw || Object.keys(row.raw).length === 0) return row;
    const [recomputed] = normalizeMetricRows([row.raw], row.importId, row.clientId, row.level);
    return {
      ...recomputed,
      id: row.id,
    };
  });
}
