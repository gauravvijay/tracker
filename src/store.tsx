import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { initialEpics, initialTasks, initialUnavailable } from "./initialData";
import type { Epic, Task, UnavailableRange } from "./types";

// ─── State ───

export interface AppState {
  epics: Epic[];
  tasks: Task[];
  unavailable: UnavailableRange[];
}

const STORAGE_KEY = "tracker-app-state";

/**
 * Migrate old tasks that lack the new effort-tracking fields.
 * This ensures existing localStorage data keeps working after the schema change.
 */
function migrateTask(raw: Record<string, unknown>): Task {
  const today = new Date().toISOString().slice(0, 10);
  const t = raw as Partial<Task>;
  return {
    id: t.id ?? `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: t.title ?? "Untitled",
    description: t.description,
    owner: t.owner ?? "Unassigned",
    effortDays: typeof t.effortDays === "number" ? t.effortDays : 1,
    initialEffortDays: typeof t.initialEffortDays === "number" ? t.initialEffortDays : (typeof t.effortDays === "number" ? t.effortDays : 1),
    effortSetDate: typeof t.effortSetDate === "string" ? t.effortSetDate : today,
    epicId: t.epicId ?? "",
    order: typeof t.order === "number" ? t.order : 0,
    status: t.status ?? "todo",
  } as Task;
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { epics?: Epic[]; tasks?: Record<string, unknown>[]; unavailable?: UnavailableRange[] };
      // Migrate tasks that may lack the new fields
      return {
        epics: Array.isArray(parsed.epics) ? parsed.epics : initialEpics,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(migrateTask) : initialTasks,
        unavailable: Array.isArray(parsed.unavailable) ? parsed.unavailable : initialUnavailable,
      };
    }
  } catch { /* ignore */ }
  // First-ever load: seed from initial data
  return {
    epics: initialEpics,
    tasks: initialTasks,
    unavailable: initialUnavailable,
  };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Actions ───

export type Action =
  | { type: "ADD_TASK"; task: Task }
  | { type: "UPDATE_TASK"; id: string; changes: Partial<Task> }
  | { type: "DELETE_TASK"; id: string }
  | { type: "MOVE_TASK_UP"; id: string; epicId: string }
  | { type: "MOVE_TASK_DOWN"; id: string; epicId: string }
  | { type: "MOVE_TASK_TO_EPIC"; taskId: string; targetEpicId: string }
  | { type: "ADD_EPIC"; epic: Epic }
  | { type: "UPDATE_EPIC"; id: string; changes: Partial<Epic> }
  | { type: "DELETE_EPIC"; id: string }
  | { type: "MOVE_EPIC_UP"; id: string }
  | { type: "MOVE_EPIC_DOWN"; id: string }
  | { type: "TOGGLE_EPIC_COLLAPSE"; id: string }
  | { type: "ADD_UNAVAILABLE"; entry: UnavailableRange }
  | { type: "DELETE_UNAVAILABLE"; id: string }
  | { type: "SET_TASK_STATUS"; id: string; status: Task["status"] }
  | { type: "REORDER_TASK"; taskId: string; epicId: string; newOrder: number }
  | { type: "RESET_DATA" };

function reducer(state: AppState, action: Action): AppState {
  let next: AppState;

  switch (action.type) {
    case "ADD_TASK":
      next = { ...state, tasks: [...state.tasks, action.task] };
      break;

    case "UPDATE_TASK":
      next = {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, ...action.changes } : t
        ),
      };
      break;

    case "DELETE_TASK":
      next = { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
      break;

    case "MOVE_TASK_UP": {
      const epicTasks = state.tasks
        .filter((t) => t.epicId === action.epicId)
        .sort((a, b) => a.order - b.order);
      const idx = epicTasks.findIndex((t) => t.id === action.id);
      if (idx <= 0) { next = state; break; }
      const above = epicTasks[idx - 1];
      const current = epicTasks[idx];
      next = {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id === current.id) return { ...t, order: above.order };
          if (t.id === above.id) return { ...t, order: current.order };
          return t;
        }),
      };
      break;
    }

    case "MOVE_TASK_DOWN": {
      const epicTasks = state.tasks
        .filter((t) => t.epicId === action.epicId)
        .sort((a, b) => a.order - b.order);
      const idx = epicTasks.findIndex((t) => t.id === action.id);
      if (idx < 0 || idx >= epicTasks.length - 1) { next = state; break; }
      const below = epicTasks[idx + 1];
      const current = epicTasks[idx];
      next = {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id === current.id) return { ...t, order: below.order };
          if (t.id === below.id) return { ...t, order: current.order };
          return t;
        }),
      };
      break;
    }

    case "MOVE_TASK_TO_EPIC": {
      const targetTasks = state.tasks.filter((t) => t.epicId === action.targetEpicId);
      const maxOrder = targetTasks.length > 0 ? Math.max(...targetTasks.map((t) => t.order)) + 1 : 0;
      next = {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, epicId: action.targetEpicId, order: maxOrder }
            : t
        ),
      };
      break;
    }

    case "REORDER_TASK": {
      const { taskId, epicId, newOrder } = action;
      // Get all tasks in the target epic, sorted
      const epicTasks = state.tasks
        .filter((t) => t.epicId === epicId && t.id !== taskId)
        .sort((a, b) => a.order - b.order);
      // Insert at new position
      epicTasks.splice(newOrder, 0, state.tasks.find((t) => t.id === taskId)!);
      const updatedIds = new Map(epicTasks.map((t, i) => [t.id, i]));
      next = {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id === taskId) return { ...t, epicId, order: newOrder };
          if (updatedIds.has(t.id)) return { ...t, order: updatedIds.get(t.id)! };
          return t;
        }),
      };
      break;
    }

    case "ADD_EPIC":
      next = { ...state, epics: [...state.epics, action.epic] };
      break;

    case "UPDATE_EPIC":
      next = {
        ...state,
        epics: state.epics.map((e) =>
          e.id === action.id ? { ...e, ...action.changes } : e
        ),
      };
      break;

    case "DELETE_EPIC":
      next = {
        ...state,
        epics: state.epics.filter((e) => e.id !== action.id),
        tasks: state.tasks.filter((t) => t.epicId !== action.id),
      };
      break;

    case "MOVE_EPIC_UP": {
      const sorted = [...state.epics].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((e) => e.id === action.id);
      if (idx <= 0) { next = state; break; }
      const above = sorted[idx - 1];
      const current = sorted[idx];
      next = {
        ...state,
        epics: state.epics.map((e) => {
          if (e.id === current.id) return { ...e, order: above.order };
          if (e.id === above.id) return { ...e, order: current.order };
          return e;
        }),
      };
      break;
    }

    case "MOVE_EPIC_DOWN": {
      const sorted = [...state.epics].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((e) => e.id === action.id);
      if (idx < 0 || idx >= sorted.length - 1) { next = state; break; }
      const below = sorted[idx + 1];
      const current = sorted[idx];
      next = {
        ...state,
        epics: state.epics.map((e) => {
          if (e.id === current.id) return { ...e, order: below.order };
          if (e.id === below.id) return { ...e, order: current.order };
          return e;
        }),
      };
      break;
    }

    case "TOGGLE_EPIC_COLLAPSE":
      next = {
        ...state,
        epics: state.epics.map((e) =>
          e.id === action.id ? { ...e, collapsed: !e.collapsed } : e
        ),
      };
      break;

    case "ADD_UNAVAILABLE":
      next = { ...state, unavailable: [...state.unavailable, action.entry] };
      break;

    case "DELETE_UNAVAILABLE":
      next = { ...state, unavailable: state.unavailable.filter((u) => u.id !== action.id) };
      break;

    case "SET_TASK_STATUS":
      next = {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, status: action.status } : t
        ),
      };
      break;

    case "RESET_DATA":
      next = { epics: initialEpics, tasks: initialTasks, unavailable: initialUnavailable };
      break;

    default:
      next = state;
  }

  saveState(next);
  return next;
}

// ─── Context ───

const StateCtx = createContext<AppState>(null!);
const DispatchCtx = createContext<Dispatch<Action>>(null!);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState() {
  return useContext(StateCtx);
}

export function useAppDispatch() {
  return useContext(DispatchCtx);
}

