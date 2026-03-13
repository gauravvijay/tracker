import React, { useMemo } from "react";
import { useAppState } from "../store";
import { computeSchedule, getDeliveryDate } from "../scheduler";
import { MEMBER_COLORS } from "../types";
import type { ScheduledTask } from "../types";

const DAY_MS = 86400000;
const COL_W = 28;

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function dateDiffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function formatDate(d: Date) {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export default function GanttChart(): React.ReactElement {
  const { tasks, epics, unavailable } = useAppState();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const scheduled = useMemo(
    () => computeSchedule(tasks, epics, unavailable, today),
    [tasks, epics, unavailable, today]
  );

  const delivery = useMemo(() => getDeliveryDate(scheduled), [scheduled]);

  // Filter to only tasks with remaining effort for Gantt display
  const pendingScheduled = useMemo(
    () => scheduled.filter((s) => s.task.status !== "done" && s.task.effortDays > 0),
    [scheduled]
  );

  if (pendingScheduled.length === 0) {
    return (
      <div className="gantt-container">
        <div className="gantt-header-bar">
          <h3>📊 Gantt Chart</h3>
        </div>
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>No pending tasks to schedule. Mark tasks as &quot;To Do&quot; or &quot;In Progress&quot; to see them here.</p>
        </div>
      </div>
    );
  }

  // Compute timeline range
  const minDate = new Date(
    Math.min(today.getTime(), ...pendingScheduled.map((s) => s.startDate.getTime()))
  );
  const maxDate = new Date(
    Math.max(today.getTime(), ...pendingScheduled.map((s) => s.endDate.getTime()))
  );
  // Add a few buffer days
  const timelineStart = new Date(minDate);
  timelineStart.setDate(timelineStart.getDate() - 1);
  const timelineEnd = new Date(maxDate);
  timelineEnd.setDate(timelineEnd.getDate() + 3);
  const totalDays = dateDiffDays(timelineStart, timelineEnd) + 1;

  // Build day columns
  const days: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(timelineStart);
    d.setDate(d.getDate() + i);
    days.push(d);
}

  const todayOffset = dateDiffDays(timelineStart, today);

  // Group by epic
  const grouped: { epicTitle: string; items: ScheduledTask[] }[] = [];
  const epicOrder = [...epics].sort((a, b) => a.order - b.order);
  for (const epic of epicOrder) {
    const items = pendingScheduled.filter((s) => s.task.epicId === epic.id);
    if (items.length > 0) {
      grouped.push({ epicTitle: epic.title, items });
    }
  }

  return (
    <div className="gantt-container">
      <div className="gantt-header-bar">
        <h3>📊 Gantt Chart</h3>
        {delivery && (
          <div className="delivery-badge">
            <span className="dot" />
            Est. delivery: {formatDate(delivery)}
          </div>
        )}
      </div>

      <div className="gantt-scroll">
        <div className="gantt-chart" style={{ width: totalDays * COL_W + 200 }}>
          {/* Timeline header */}
          <div className="gantt-timeline">
            {days.map((d, i) => {
              const isWE = d.getDay() === 0 || d.getDay() === 6;
              const showMonth = i === 0 || d.getDate() === 1;
              return (
                <div
                  key={i}
                  className={`gantt-day ${isWE ? "weekend" : ""}`}
                  style={{ width: COL_W }}
                >
                  {showMonth && (
                    <div style={{ fontSize: 8, fontWeight: 600 }}>
                      {MONTH_SHORT[d.getMonth()]}
                    </div>
                  )}
                  <div className="day-num">{d.getDate()}</div>
                  <div>{WEEKDAY_SHORT[d.getDay()]}</div>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          <div style={{ position: "relative" }}>
            {/* Today line */}
            {todayOffset >= 0 && todayOffset < totalDays && (
              <div
                className="gantt-today-line"
                style={{ left: 200 + todayOffset * COL_W + COL_W / 2 }}
              >
                <div className="gantt-today-label">Today</div>
              </div>
            )}

            {grouped.map((group, gi) => (
              <React.Fragment key={gi}>
                <div className="gantt-epic-separator">{group.epicTitle}</div>
                {group.items.map((item) => {
                  const startOff = dateDiffDays(timelineStart, item.startDate);
                  const duration = dateDiffDays(item.startDate, item.endDate) + 1;
                  const color = MEMBER_COLORS[item.task.owner];
                  return (
                    <div className="gantt-row" key={item.task.id}>
                      <div className="gantt-label">
                        <span className="task-name">{item.task.title}</span>
                        <span className="owner-name">({item.task.owner})</span>
                      </div>
                      <div className="gantt-bars">
                        {/* spacer */}
                        <div style={{ width: startOff * COL_W, flexShrink: 0 }} />
                        <div
                          className="gantt-bar"
                          style={{
                            width: duration * COL_W - 4,
                            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                          }}
                          title={`${item.task.title} (${item.task.owner})\n${formatDate(item.startDate)} → ${formatDate(item.endDate)}\n${item.task.effortDays}d remaining`}
                        >
                          {duration >= 3 && `${item.task.effortDays}d`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
