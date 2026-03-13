import type {
  Epic,
  ScheduledTask,
  Task,
  TeamMember,
  UnavailableRange,
} from "./types";
import { TEAM_MEMBERS } from "./types";

// ─── Date utilities ───

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isUnavailable(
  member: TeamMember,
  date: Date,
  unavailable: UnavailableRange[]
): boolean {
  const iso = isoDate(date);
  return unavailable.some(
    (u) => u.member === member && iso >= u.startDate && iso <= u.endDate
  );
}

/** Advance to the next working day for a member, skipping weekends and unavailable ranges. */
function nextWorkingDay(
  member: TeamMember,
  from: Date,
  unavailable: UnavailableRange[]
): Date {
  let d = new Date(from);
  while (isWeekend(d) || isUnavailable(member, d, unavailable)) {
    d = addDays(d, 1);
  }
  return d;
}

// ─── Scheduler ───

/**
 * Compute a Gantt-style schedule for all non-done tasks.
 *
 * `effortDays` on each task is the user-managed "remaining effort".
 * The scheduler uses it directly — no auto-decay. Users update it
 * themselves when they finish work or re-estimate.
 *
 * Strategy:
 *  – Tasks are processed in priority order (epic order, then task order within epic).
 *  – Each team member has a "cursor" date tracking when they are next free.
 *  – For each task, the member's cursor is advanced past weekends & unavailable days,
 *    then the effort-days are scheduled (also skipping non-working days).
 */
export function computeSchedule(
  tasks: Task[],
  epics: Epic[],
  unavailable: UnavailableRange[],
  startDate: Date = new Date()
): ScheduledTask[] {
  // Build epic ordering map
  const epicOrder = new Map(epics.map((e) => [e.id, e.order]));
  const epicTitle = new Map(epics.map((e) => [e.id, e.title]));

  // Sort all non-done tasks in priority order for scheduling
  const pending = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const ea = epicOrder.get(a.epicId) ?? 999;
      const eb = epicOrder.get(b.epicId) ?? 999;
      if (ea !== eb) return ea - eb;
      return a.order - b.order;
    });

  // Member cursors – each starts at the given startDate
  const cursors = new Map<TeamMember, Date>();
  for (const m of TEAM_MEMBERS) {
    cursors.set(m, new Date(startDate));
  }

  const scheduled: ScheduledTask[] = [];

  for (const task of pending) {
    const member = task.owner;
    let cursor = cursors.get(member) ?? new Date(startDate);
    const effortLeft = task.effortDays;

    // Advance cursor to next working day
    cursor = nextWorkingDay(member, cursor, unavailable);
    const start = new Date(cursor);

    if (effortLeft <= 0) {
      // 0 remaining but not marked done — show at cursor date
      scheduled.push({
        task,
        epicTitle: epicTitle.get(task.epicId) ?? "Unknown",
        startDate: start,
        endDate: start,
      });
      continue;
    }

    // Walk through effort-days, skipping non-working days
    let rem = effortLeft;
    while (rem > 0) {
      if (!isWeekend(cursor) && !isUnavailable(member, cursor, unavailable)) {
        rem--;
      }
      if (rem > 0) {
        cursor = addDays(cursor, 1);
      }
    }

    const end = new Date(cursor);
    scheduled.push({
      task,
      epicTitle: epicTitle.get(task.epicId) ?? "Unknown",
      startDate: start,
      endDate: end,
    });

    // Set cursor to the day after end for this member
    cursors.set(member, addDays(cursor, 1));
  }
  return scheduled;
}

/** Get the overall delivery date (last end date across all scheduled tasks). */
export function getDeliveryDate(scheduled: ScheduledTask[]): Date | null {
  if (scheduled.length === 0) return null;
  return scheduled.reduce(
    (latest, s) => (s.endDate > latest ? s.endDate : latest),
    scheduled[0].endDate
  );
}

/** Summarise workload per member. */
export function getWorkloadSummary(
  tasks: Task[]
): Map<TeamMember, { total: number; done: number; pending: number }> {
  const map = new Map<
    TeamMember,
    { total: number; done: number; pending: number }
  >();
  for (const m of TEAM_MEMBERS) {
    map.set(m, { total: 0, done: 0, pending: 0 });
  }
  for (const t of tasks) {
    const entry = map.get(t.owner)!;
    entry.total += t.initialEffortDays;
    if (t.status === "done") entry.done += t.initialEffortDays;
    else entry.pending += t.effortDays;
  }
  return map;
}
