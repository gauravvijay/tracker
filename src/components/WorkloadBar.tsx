import React, { useState } from "react";
import { useAppState } from "../store";
import { MEMBER_COLORS, TEAM_MEMBERS } from "../types";
import { getWorkloadSummary } from "../scheduler";
import { ChevronRight } from "./Icons";

export default function WorkloadBar(): React.ReactElement {
  const { tasks } = useAppState();
  const summary = getWorkloadSummary(tasks);
  const [collapsed, setCollapsed] = useState(true);

  const totalPending = Array.from(summary.values()).reduce((s, v) => s + v.pending, 0);
  const totalDone = Array.from(summary.values()).reduce((s, v) => s + v.done, 0);

  return (
    <div className="workload-section">
      <button className="workload-toggle" onClick={() => setCollapsed(!collapsed)}>
        <ChevronRight className={`chevron ${collapsed ? "" : "open"}`} />
        <span className="workload-toggle-title">Team Workload</span>
        <span className="workload-toggle-summary">
          {totalPending}d remaining · {totalDone}d done
        </span>
      </button>
      {!collapsed && (
        <div className="workload-bar">
          {TEAM_MEMBERS.filter((m) => m !== "Unassigned").map((m) => {
            const s = summary.get(m)!;
            const pct = s.total > 0 ? (s.done / s.total) * 100 : 0;
            return (
              <div className="workload-card" key={m}>
                <div className="name" style={{ color: MEMBER_COLORS[m] }}>{m}</div>
                <div className="stats">
                  <span className="big-num">{s.pending}</span>
                  <span className="unit">days remaining</span>
                </div>
                <div className="workload-progress">
                  <div
                    className="fill"
                    style={{
                      width: `${pct}%`,
                      background: MEMBER_COLORS[m],
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: "var(--text-light)" }}>
                  {s.done}/{s.total} days done
                </div>
              </div>
            );
          })}
          {/* Show unassigned if any */}
          {(summary.get("Unassigned")?.total ?? 0) > 0 && (
            <div className="workload-card">
              <div className="name" style={{ color: MEMBER_COLORS["Unassigned"] }}>Unassigned</div>
              <div className="stats">
                <span className="big-num">{summary.get("Unassigned")!.pending}</span>
                <span className="unit">days remaining</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
