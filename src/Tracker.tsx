import React, { useCallback, useMemo, useState } from "react";
import { useAppState, useAppDispatch } from "./store";
import { computeSchedule, getDeliveryDate } from "./scheduler";
import { MEMBER_COLORS, TEAM_MEMBERS } from "./types";
import type { TeamMember, ScheduledTask } from "./types";
import WorkloadBar from "./components/WorkloadBar";
import BoardView from "./components/BoardView";
import GanttChart from "./components/GanttChart";
import UnavailabilityPanel from "./components/UnavailabilityPanel";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(d: Date) {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

type Tab = "board" | "gantt" | "availability" | "timeline";

export default function Tracker(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [hideDone, setHideDone] = useState(false);
  const state = useAppState();
  const dispatch = useAppDispatch();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const scheduled = useMemo(
    () => computeSchedule(state.tasks, state.epics, state.unavailable, today),
    [state.tasks, state.epics, state.unavailable, today]
  );
  const delivery = useMemo(() => getDeliveryDate(scheduled), [scheduled]);

  const totalRemaining = state.tasks
    .filter((t) => t.status !== "done")
    .reduce((s, t) => s + t.effortDays, 0);

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <h1>
          <span className="logo">T</span>
          P&amp;ID Tracker
        </h1>
        <div className="header-right">
          {delivery && (
            <div className="delivery-badge">
              <span className="dot" />
              Est. delivery: {formatDate(delivery)}
            </div>
          )}
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {totalRemaining}d remaining · {state.tasks.length} tasks · {state.epics.length} epics
          </span>
          <button
            className={`btn btn-sm ${hideDone ? "btn-primary" : ""}`}
            onClick={() => setHideDone(!hideDone)}
            title={hideDone ? "Show done tasks" : "Hide done tasks"}
          >
            {hideDone ? "Show Done" : "Hide Done"}
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (confirm("Reset all data to defaults? This cannot be undone.")) {
                dispatch({ type: "RESET_DATA" });
              }
            }}
          >
            Reset Data
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "board" ? "active" : ""}`}
          onClick={() => setActiveTab("board")}
        >
          📋 Board
        </button>
        <button
          className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          📅 Timeline
        </button>
        <button
          className={`tab-btn ${activeTab === "gantt" ? "active" : ""}`}
          onClick={() => setActiveTab("gantt")}
        >
          📊 Gantt
        </button>
        <button
          className={`tab-btn ${activeTab === "availability" ? "active" : ""}`}
          onClick={() => setActiveTab("availability")}
        >
          🗓 Availability
        </button>
      </nav>

      {/* Content */}
      <main className="main-content">
        <WorkloadBar />

        {activeTab === "board" && <BoardView hideDone={hideDone} />}
        {activeTab === "timeline" && <TimelineView scheduled={scheduled} hideDone={hideDone} />}
        {activeTab === "gantt" && <GanttChart />}
        {activeTab === "availability" && <UnavailabilityPanel />}
      </main>
    </div>
  );
}

// ─── Timeline View: "When will each task finish?" ───

function TimelineView({
  scheduled,
  hideDone = false,
}: {
  scheduled: ScheduledTask[];
  hideDone?: boolean;
}): React.ReactElement {
  const { epics } = useAppState();
  const [groupBy, setGroupBy] = useState<"epic" | "owner" | "finish">("owner");
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);

  const sorted = useMemo(() => {

    let items = [...scheduled];
    if (hideDone) {
      items = items.filter((s) => s.task.status !== "done");
    }
    switch (groupBy) {
      case "finish":
        items.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
        break;
      case "owner":
        items.sort((a, b) => {
          const oc = a.task.owner.localeCompare(b.task.owner);
          if (oc !== 0) return oc;
          return a.endDate.getTime() - b.endDate.getTime();
        });
        break;
      case "epic":
        // keep original order (already epic-ordered from scheduler)
        break;
    }
    return items;
  }, [scheduled, groupBy]);

  // Build text summary for a member
  const buildMemberText = useCallback((member: TeamMember) => {
    const epicOrder = new Map(epics.map((e) => [e.id, e.order]));
    const memberItems = scheduled
      .filter((s) => s.task.owner === member)
      .sort((a, b) => {
        const ea = epicOrder.get(a.task.epicId) ?? 999;
        const eb = epicOrder.get(b.task.epicId) ?? 999;
        if (ea !== eb) return ea - eb;
        return a.task.order - b.task.order;
      });

    if (memberItems.length === 0) return null;

    const lines: string[] = [`Tasks for ${member}`, ""];
    let lastEpic = "";
    for (const item of memberItems) {
      if (item.epicTitle !== lastEpic) {
        if (lastEpic) lines.push("");
        lines.push(`── ${item.epicTitle} ──`);
        lastEpic = item.epicTitle;
      }
      const status = item.task.status === "done" ? "✅" : item.task.status === "in-progress" ? "🔵" : "⬜";
      const dates = item.task.status === "done"
        ? "Done"
        : `${formatDate(item.startDate)} → ${formatDate(item.endDate)}`;
      lines.push(`${status} ${item.task.title || "(untitled)"} — ${item.task.effortDays}d — ${dates}`);
      if (item.task.description?.trim()) {
        // Indent description lines
        const descLines = item.task.description.trim().split("\n");
        for (const dl of descLines) {
          lines.push(`    ${dl}`);
        }
      }
    }
    return lines.join("\n");
  }, [scheduled, epics]);

  const handleCopyMember = useCallback(async (member: TeamMember) => {
    const text = buildMemberText(member);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsg(member);
      setTimeout(() => setCopiedMsg(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedMsg(member);
      setTimeout(() => setCopiedMsg(null), 2000);
    }
  }, [buildMemberText]);

  const handleCopyAll = useCallback(async () => {
    const allLines: string[] = [];
    for (const m of TEAM_MEMBERS) {
      const text = buildMemberText(m);
      if (text) {
        if (allLines.length > 0) allLines.push("", "═".repeat(50), "");
        allLines.push(text);
      }
    }
    const full = allLines.join("\n");
    try {
      await navigator.clipboard.writeText(full);
      setCopiedMsg("all");
      setTimeout(() => setCopiedMsg(null), 2000);
    } catch { /* ignore */ }
  }, [buildMemberText]);

  if (sorted.length === 0) {
    return (
      <div className="timeline-container">
        <div className="gantt-header-bar">
          <h3>📅 Timeline – Estimated Finish Dates</h3>
        </div>
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>No pending tasks to schedule.</p>
        </div>
      </div>
    );
  }

  // Get unique members in the data
  const members = [...new Set(sorted.map((s) => s.task.owner))];

  // Group rows with headers
  let lastGroup = "";
  const rows: { header?: string; headerMember?: TeamMember; item?: ScheduledTask }[] = [];
  for (const item of sorted) {
    let currentGroup = "";
    if (groupBy === "owner") currentGroup = item.task.owner;
    else if (groupBy === "epic") currentGroup = item.epicTitle;
    else currentGroup = formatDate(item.endDate);

    if (currentGroup !== lastGroup) {
      rows.push({
        header: currentGroup,
        headerMember: groupBy === "owner" ? item.task.owner as TeamMember : undefined,
      });
      lastGroup = currentGroup;
    }
    rows.push({ item });
  }

  return (
    <div className="timeline-container">
      <div className="gantt-header-bar" style={{ marginBottom: 0 }}>
        <h3>📅 Timeline – Estimated Finish Dates</h3>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className={`btn btn-sm ${groupBy === "owner" ? "btn-primary" : ""}`} onClick={() => setGroupBy("owner")}>By Owner</button>
          <button className={`btn btn-sm ${groupBy === "finish" ? "btn-primary" : ""}`} onClick={() => setGroupBy("finish")}>By Finish Date</button>
          <button className={`btn btn-sm ${groupBy === "epic" ? "btn-primary" : ""}`} onClick={() => setGroupBy("epic")}>By Epic</button>
          <span style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
          <button className="btn btn-sm" onClick={handleCopyAll} title="Copy all tasks to clipboard">
            {copiedMsg === "all" ? "✅ Copied!" : "📋 Copy All"}
          </button>
        </div>
      </div>

      {/* Per-member copy buttons strip */}
      {groupBy === "owner" && (
        <div className="timeline-copy-strip">
          {members.map((m) => (
            <button
              key={m}
              className="copy-member-btn"
              style={{ borderLeftColor: MEMBER_COLORS[m] }}
              onClick={() => handleCopyMember(m)}
              title={`Copy ${m}'s tasks + descriptions to clipboard`}
            >
              <span className="copy-icon">📋</span>
              <span>{copiedMsg === m ? "Copied!" : m}</span>
            </button>
          ))}
        </div>
      )}

      <div className="timeline-table-scroll">
        <table className="timeline-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Task</th>
              <th>Owner</th>
              <th>Est</th>
              <th>Rem</th>
              <th>Starts</th>
              <th>Finishes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.header) {
                return (
                  <tr key={`h-${i}`} className="timeline-group-header">
                    <td colSpan={7}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{row.header}</span>
                        {row.headerMember && (
                          <button
                            className="copy-inline-btn"
                            onClick={() => handleCopyMember(row.headerMember!)}
                            title={`Copy ${row.headerMember}'s tasks to clipboard`}
                          >
                            {copiedMsg === row.headerMember ? "✅ Copied!" : "📋 Copy"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
              const item = row.item!;
              const color = MEMBER_COLORS[item.task.owner];
              return (
                <tr key={item.task.id}>
                  <td className="task-name-cell">
                    <span className="color-dot" style={{ background: color }} />
                    <span>{item.task.title || "(untitled)"}</span>
                  </td>
                  <td>
                    <span className="owner-pill" style={{ background: color }}>{item.task.owner}</span>
                  </td>
                  <td className="num-cell">{item.task.initialEffortDays}d</td>
                  <td className="num-cell">{item.task.effortDays}d</td>
                  <td>{item.task.status === "done" ? "—" : formatDate(item.startDate)}</td>
                  <td><strong>{item.task.status === "done" ? "Done" : formatDate(item.endDate)}</strong></td>
                  <td>
                    <span className={`status-pill ${item.task.status}`}>
                      {item.task.status === "in-progress" ? "In Progress" : item.task.status === "todo" ? "To Do" : "Done"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
