// ─── Core domain types ───

export type TeamMember =
  | "Gaurav"
  | "Shiva"
  | "Satyam"
  | "Jabou"
  | "Mustafa"
  | "Siva"
  | "Toheed"
  | "Harsha"
  | "Varsha"
  | "Amruta"
  | "Anurag"
  | "Jasbir"
  | "Unassigned";

export const TEAM_MEMBERS: TeamMember[] = [
  "Gaurav",
  "Shiva",
  "Satyam",
  "Jabou",
  "Mustafa",
  "Siva",
  "Toheed",
  "Harsha",
  "Varsha",
  "Amruta",
  "Anurag",
  "Jasbir",
  "Unassigned",
];

export const MEMBER_COLORS: Record<TeamMember, string> = {
  Gaurav: "#4C90F0",
  Shiva: "#D13913",
  Satyam: "#0F9960",
  Jabou: "#BF7326",
  Mustafa: "#7157D9",
  Siva: "#C22762",
  Toheed: "#00A99D",
  Harsha: "#E76F51",
  Varsha: "#2A9D8F",
  Amruta: "#E9C46A",
  Anurag: "#264653",
  Jasbir: "#F4A261",
  Unassigned: "#9ca3af",
};

export interface Task {
  id: string;
  title: string;
  description?: string; // optional rich description / notes
  owner: TeamMember;
  effortDays: number; // remaining effort in working days (user-editable)
  initialEffortDays: number; // original estimate (set once when estimate is first given)
  effortSetDate: string; // ISO date (YYYY-MM-DD) when the estimate was first set
  epicId: string;
  order: number; // priority within epic (lower = higher priority)
  status: "todo" | "in-progress" | "done";
}

export interface Epic {
  id: string;
  title: string; // the "why"
  order: number;
  collapsed?: boolean;
}

/** A day range when a team member is unavailable */
export interface UnavailableRange {
  id: string;
  member: TeamMember;
  startDate: string; // ISO date string  YYYY-MM-DD
  endDate: string; // ISO date string  YYYY-MM-DD
  reason?: string;
}

/** Computed schedule entry for the Gantt chart */
export interface ScheduledTask {
  task: Task;
  epicTitle: string;
  startDate: Date;
  endDate: Date;
}
