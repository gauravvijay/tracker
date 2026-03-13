import React, { useCallback, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppState } from "../store";
import type { Epic, Task } from "../types";
import { MEMBER_COLORS, TEAM_MEMBERS } from "../types";
import { computeSchedule } from "../scheduler";
import type { ScheduledTask } from "../types";
import { ChevronRight, ArrowUp, ArrowDown, Plus, Trash } from "./Icons";

// ─── Drag-and-drop context shared across epic cards ───
// Module-level variable so drag can cross epic boundaries.
let draggedTaskId: string | null = null;

/** Today as ISO string YYYY-MM-DD */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  epic: Epic;
  hideDone?: boolean;
}

export default function EpicCard({ epic, hideDone = false }: Props): React.ReactElement {
  const { tasks, epics, unavailable } = useAppState();
  const dispatch = useAppDispatch();

  const allEpicTasks = tasks
    .filter((t) => t.epicId === epic.id)
    .sort((a, b) => a.order - b.order);

  const epicTasks = hideDone
    ? allEpicTasks.filter((t) => t.status !== "done")
    : allEpicTasks;

  const doneCount = allEpicTasks.filter((t) => t.status === "done").length;
  const hiddenCount = hideDone ? doneCount : 0;

  // Schedule lookup: task id → { startDate, endDate }
  const scheduleMap = useMemo(() => {
    const scheduled = computeSchedule(tasks, epics, unavailable);
    const map = new Map<string, ScheduledTask>();
    for (const s of scheduled) {
      map.set(s.task.id, s);
    }
    return map;
  }, [tasks, epics, unavailable]);

  const totalInitial = allEpicTasks.reduce((s, t) => s + t.initialEffortDays, 0);
  const doneEffort = allEpicTasks.filter((t) => t.status === "done").reduce((s, t) => s + t.initialEffortDays, 0);
  const pendingEffort = allEpicTasks
    .filter((t) => t.status !== "done")
    .reduce((s, t) => s + t.effortDays, 0);

  const toggle = useCallback(() => {
    dispatch({ type: "TOGGLE_EPIC_COLLAPSE", id: epic.id });
  }, [dispatch, epic.id]);

  const addTask = useCallback(() => {
    const maxOrder = epicTasks.length > 0 ? Math.max(...epicTasks.map((t) => t.order)) + 1 : 0;
    const now = todayIso();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "",
      owner: "Gaurav",
      effortDays: 1,
      initialEffortDays: 1,
      effortSetDate: now,
      epicId: epic.id,
      order: maxOrder,
      status: "todo",
    };
    dispatch({ type: "ADD_TASK", task: newTask });
    if (epic.collapsed) dispatch({ type: "TOGGLE_EPIC_COLLAPSE", id: epic.id });
  }, [dispatch, epic, epicTasks]);

  // ─── Drop onto epic (when list is empty or at the end) ───
  const handleEpicDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleEpicDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedTaskId) return;
      const maxOrder = epicTasks.length > 0 ? Math.max(...epicTasks.map((t) => t.order)) + 1 : 0;
      dispatch({ type: "REORDER_TASK", taskId: draggedTaskId, epicId: epic.id, newOrder: maxOrder });
      draggedTaskId = null;
    },
    [dispatch, epic.id, epicTasks]
  );

  return (
    <div className="epic-card">
      {/* Header */}
      <div className={`epic-header ${epic.collapsed ? "" : "open"}`} onClick={toggle}>
        <ChevronRight className={`chevron ${epic.collapsed ? "" : "open"}`} />
        <div className="epic-title">
          <input
            value={epic.title}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              dispatch({ type: "UPDATE_EPIC", id: epic.id, changes: { title: e.target.value } })
            }
          />
        </div>
        <span className="epic-badge">
          {allEpicTasks.length} tasks · {pendingEffort.toFixed(1).replace(/\.0$/, "")}d remaining
          {doneEffort > 0 && ` · ${doneEffort}d done`}
          {" · "}est. {totalInitial}d total
          {hiddenCount > 0 && ` · ${hiddenCount} done hidden`}
        </span>
        <div className="epic-actions" onClick={(e) => e.stopPropagation()}>
          <button className="icon-btn" title="Move up" onClick={() => dispatch({ type: "MOVE_EPIC_UP", id: epic.id })}><ArrowUp /></button>
          <button className="icon-btn" title="Move down" onClick={() => dispatch({ type: "MOVE_EPIC_DOWN", id: epic.id })}><ArrowDown /></button>
          <button className="icon-btn danger" title="Delete epic" onClick={() => { if (confirm(`Delete "${epic.title}" and all its tasks?`)) dispatch({ type: "DELETE_EPIC", id: epic.id }); }}><Trash /></button>
        </div>
      </div>

      {/* Tasks */}
      {!epic.collapsed && (
        <div className="task-list" onDragOver={handleEpicDragOver} onDrop={handleEpicDrop}>
          {epicTasks.map((task, idx) => (
            <TaskRow key={task.id} task={task} index={idx} epic={epic} allEpics={epics} scheduleMap={scheduleMap} />
          ))}
          <div className="add-task-row">
            <button className="add-task-btn" onClick={addTask}><Plus /> Add task</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Row with drag-and-drop + description ───

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function TaskRow({
  task,
  index,
  epic,
  allEpics,
  scheduleMap,
}: {
  task: Task;
  index: number;
  epic: Epic;
  allEpics: Epic[];
  scheduleMap: Map<string, ScheduledTask>;
}) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<"above" | "below" | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // ─── Drag handlers ───
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      draggedTaskId = task.id;
      e.dataTransfer.effectAllowed = "move";
      // Make the dragged element semi-transparent
      if (rowRef.current) {
        requestAnimationFrame(() => {
          rowRef.current?.classList.add("dragging");
        });
      }
    },
    [task.id]
  );

  const handleDragEnd = useCallback(() => {
    draggedTaskId = null;
    rowRef.current?.classList.remove("dragging");
    setDropIndicator(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      if (draggedTaskId === task.id) {
        setDropIndicator(null);
        return;
      }
      // Determine above/below based on mouse Y within the row
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) {
        const midY = rect.top + rect.height / 2;
        setDropIndicator(e.clientY < midY ? "above" : "below");
      }
    },
    [task.id]
  );

  const handleDragLeave = useCallback(() => {
    setDropIndicator(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDropIndicator(null);
      if (!draggedTaskId || draggedTaskId === task.id) return;
      const rect = rowRef.current?.getBoundingClientRect();
      let targetOrder = index;
      if (rect && e.clientY >= rect.top + rect.height / 2) {
        targetOrder = index + 1;
      }
      dispatch({
        type: "REORDER_TASK",
        taskId: draggedTaskId,
        epicId: epic.id,
        newOrder: targetOrder,
      });
      draggedTaskId = null;
    },
    [dispatch, epic.id, task.id, index]
  );

  const hasDescription = !!(task.description && task.description.trim());

  /** When the user changes the "remaining" effort, update effortDays (the manual override). */
  const handleEffortChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newRemaining = Math.max(0, Number(e.target.value));
      dispatch({
        type: "UPDATE_TASK",
        id: task.id,
        changes: { effortDays: newRemaining },
      });
    },
    [dispatch, task.id]
  );

  /** When the user changes the initial estimate, reset effortSetDate to today. */
  const handleInitialChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newInitial = Math.max(0.5, Number(e.target.value));
      dispatch({
        type: "UPDATE_TASK",
        id: task.id,
        changes: {
          initialEffortDays: newInitial,
          effortDays: newInitial,
          effortSetDate: todayIso(),
        },
      });
    },
    [dispatch, task.id]
  );

  return (
    <div
      ref={rowRef}
      className={`task-row-wrapper ${dropIndicator === "above" ? "drop-above" : ""} ${dropIndicator === "below" ? "drop-below" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`task-row ${task.status === "done" ? "done" : ""}`}>
        {/* Drag handle */}
        <div className="drag-handle" title="Drag to reorder">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="4" cy="2.5" r="1.2" /><circle cx="8" cy="2.5" r="1.2" />
            <circle cx="4" cy="6" r="1.2" /><circle cx="8" cy="6" r="1.2" />
            <circle cx="4" cy="9.5" r="1.2" /><circle cx="8" cy="9.5" r="1.2" />
          </svg>
        </div>

        {/* Title + expand toggle */}
        <div className="task-title-cell">
          <button
            className={`desc-toggle ${expanded ? "open" : ""} ${hasDescription ? "has-desc" : ""}`}
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Hide description" : "Show / add description"}
          >
            <ChevronRight className={`chevron-sm ${expanded ? "open" : ""}`} />
          </button>
          <input
            value={task.title}
            placeholder="Enter task name…"
            onChange={(e) =>
              dispatch({ type: "UPDATE_TASK", id: task.id, changes: { title: e.target.value } })
            }
          />
        </div>

        {/* Owner */}
        <select
          className="owner-select"
          value={task.owner}
          style={{ background: MEMBER_COLORS[task.owner] }}
          onChange={(e) =>
            dispatch({
              type: "UPDATE_TASK",
              id: task.id,
              changes: { owner: e.target.value as Task["owner"] },
            })
          }
        >
          {TEAM_MEMBERS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Effort: initial estimate + auto-remaining */}
        <div className="effort-group" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            className="effort-input"
            type="number"
            min={0.5}
            step={0.5}
            value={task.initialEffortDays}
            title="Initial estimate (days)"
            onChange={handleInitialChange}
          />
          <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>est</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>/</span>
          <input
            className="effort-input"
            type="number"
            min={0}
            step={0.5}
            value={task.effortDays}
            title="Remaining effort (days). Reduce as you make progress."
            onChange={handleEffortChange}
            style={{
              color: task.effortDays < task.initialEffortDays ? "var(--green, #0F9960)" : undefined,
            }}
          />
          <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>rem</span>
        </div>

        {/* Scheduled dates */}
        {(() => {
          const sched = scheduleMap.get(task.id);
          if (task.status === "done") {
            return <span className="schedule-dates done-label">Done</span>;
          }
          if (!sched) {
            return <span className="schedule-dates">—</span>;
          }
          return (
            <span className="schedule-dates" title={`Starts ${sched.startDate.toDateString()} · Finishes ${sched.endDate.toDateString()}`}>
              {fmtDate(sched.startDate)} → {fmtDate(sched.endDate)}
            </span>
          );
        })()}

        {/* Status */}
        <select
          className={`status-select ${task.status}`}
          value={task.status}
          onChange={(e) =>
            dispatch({
              type: "SET_TASK_STATUS",
              id: task.id,
              status: e.target.value as Task["status"],
            })
          }
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {/* Move to epic */}
        <select
          className="epic-move-select"
          value={task.epicId}
          onChange={(e) =>
            dispatch({ type: "MOVE_TASK_TO_EPIC", taskId: task.id, targetEpicId: e.target.value })
          }
        >
          {allEpics
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.title.length > 25 ? ep.title.slice(0, 25) + "…" : ep.title}
              </option>
            ))}
        </select>

        {/* Delete */}
        <button className="icon-btn danger" title="Delete task" onClick={() => dispatch({ type: "DELETE_TASK", id: task.id })}><Trash /></button>
      </div>

      {/* Description panel */}
      {expanded && (
        <div className="task-description">
          <textarea
            placeholder="Add a description or notes…"
            value={task.description ?? ""}
            onChange={(e) =>
              dispatch({ type: "UPDATE_TASK", id: task.id, changes: { description: e.target.value } })
            }
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
