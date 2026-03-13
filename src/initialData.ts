import type { Epic, Task, UnavailableRange } from "./types";

// ─── Seed data faithfully pulled from team notepad (2026-03-02) ───
// Task order, owners, descriptions, and epic placement exactly match the document.

let _id = 0;
const uid = () => `task-${++_id}`;

// All seed tasks were estimated on 2026-03-02
const SEED_DATE = "2026-03-02";

export const initialEpics: Epic[] = [
  {
    id: "epic-p0",
    title:
      "P0 – Show P&ID tool is the most cost-effective way to contextualize and improve P&ID quality",
    order: 0,
  },
  {
    id: "epic-p1",
    title:
      "P1 – Show P&ID speeds up citizen development and maintenance persona",
    order: 1,
  },
  {
    id: "epic-p2",
    title: "P2 – Create Compass Agent and UI",
    order: 2,
  },
  {
    id: "epic-p3",
    title: "P3 – Deliver BOTEC Replacement",
    order: 3,
  },
  {
    id: "epic-chores",
    title: "Chores – Miscellaneous engineering chores",
    order: 4,
  },
];

export const initialTasks: Task[] = [
  // ═══════════════════════════════════════════
  // P0 Epic – listed in document order
  // ═══════════════════════════════════════════
  {
    id: uid(),
    epicId: "epic-p0",
    order: 0,
    status: "in-progress",
    title: "🔥 Report the current recall numbers",
    owner: "Satyam",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "URGENT – Baseline numbers needed before improvement work begins. This is a blocker for measuring progress on P0-2, P0-3, P0-4.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 1,
    status: "todo",
    title: "Improve Rotterdam recall to 80% (against created golden P&IDs)",
    owner: "Jabou",
    effortDays: 5,
    initialEffortDays: 5,
    effortSetDate: SEED_DATE,
    description:
      "Measure against the golden P&IDs that have been manually created for Rotterdam.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 2,
    status: "todo",
    title: "Improve Whiting recall to 80% (against LTTS-detected P&IDs)",
    owner: "Jabou",
    effortDays: 5,
    initialEffortDays: 5,
    effortSetDate: SEED_DATE,
    description: "Benchmark is LTTS-detected P&IDs for the Whiting site.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 3,
    status: "in-progress",
    title:
      "Run the Castellón pipeline against the same P&IDs as LTTS and improve recall to 80%",
    owner: "Mustafa",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description:
      "Ensure apples-to-apples comparison with LTTS by using the exact same P&ID set. Mostly done.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 4,
    status: "in-progress",
    title: "Update dashboard for latest numbers",
    owner: "Mustafa",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "Dashboard should visualize recall metrics, quality trends, and enable side-by-side comparisons.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 5,
    status: "todo",
    title:
      "Cherrypoint maintenance doesn't seem to be connected to any equipment",
    owner: "Satyam",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "Cherrypoint maintenance doesn't seem to be connected to any equipment. Needs investigation.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 6,
    status: "todo",
    title: "Must not match 4 digit numbers without contextualization",
    owner: "Satyam",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "Prevent false matches on bare 4-digit numbers that lack contextual cues.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 7,
    status: "todo",
    title:
      "Auto-infer types of potential equipment using LLM-detected pre-assigned types via ENS, then show in review & search mode, compare against ALIM and report inconsistencies",
    owner: "Unassigned",
    effortDays: 5,
    initialEffortDays: 5,
    effortSetDate: SEED_DATE,
    description:
      "Use LLM to detect equipment types and cross-reference with ENS (Equipment Naming Standard) to auto-assign types. Show in review mode and search mode, then compare against ALIM and report inconsistencies.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 8,
    status: "in-progress",
    title:
      "Must not match regexes where there is a large gap between first part of text and second part of text like MW 1210 or filter out larger than average bounding boxes",
    owner: "Satyam",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "Must not match regexes where there is a large gap between first part of text and second part of text like MW 1210, or filter out larger than average bounding boxes.",
  },
  {
    id: uid(),
    epicId: "epic-p0",
    order: 9,
    status: "todo",
    title: "Fix P&ID hierarchy issue in contextualization",
    owner: "Satyam",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "P&ID hierarchy issue in contextualization needs to be resolved.",
  },

  // ═══════════════════════════════════════════
  // P1 Epic – listed in document order
  // ═══════════════════════════════════════════
  {
    id: uid(),
    epicId: "epic-p1",
    order: 0,
    status: "todo",
    title: "Align with leadership on the path forward",
    owner: "Gaurav",
    effortDays: 1,
    initialEffortDays: 1,
    effortSetDate: SEED_DATE,
    description:
      "Strategic alignment needed before deep investment in screens.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 1,
    status: "todo",
    title:
      "Talk with Sergio — get feedback on tooling, understand screens/tools in use, and discovery plans",
    owner: "Gaurav",
    effortDays: 1,
    initialEffortDays: 1,
    effortSetDate: SEED_DATE,
    description:
      "Key stakeholder feedback loop. Understand current tool usage and future plans.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 2,
    status: "todo",
    title: "Infer connections/flow from P&IDs",
    owner: "Mustafa",
    effortDays: 5,
    initialEffortDays: 5,
    effortSetDate: SEED_DATE,
    description:
      "Automatically detect and infer piping/signal connections between equipment on P&IDs.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 3,
    status: "todo",
    title: "Move to Aize UI for search",
    owner: "Shiva",
    effortDays: 5,
    initialEffortDays: 5,
    effortSetDate: SEED_DATE,
    description: `In the document view, instead of showing the equipment and the related details in the right hand side pane we need to create a floating card over the P&ID. There needs to be a floating panel for layers, where there can be a work order layer, equipment layer etc. For work order layer the document view should show filterable list (by priority, finish date) of work orders planned (collapsed view) on the tag. Instead of showing the bounding box we should show a hand icon indicating what part of the PDF is clickable. The popover must display equipment details, related work orders, notifications, related engineering tags, related sensor tags.\n\nAllow users to select group of annotations to see together (this could be for task lists, or isolation planning reasons — show all of their work orders, notifications together with a way to reference that back into the P&ID).\n\nRef: https://app.aize.io/T947297421/49/5861824618450606/board`,
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 4,
    status: "todo",
    title:
      "In search results, inferred text match should show the text being matched and highlight PID-only search",
    owner: "Shiva",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "Inferred text match should show the text being matched, and should highlight that we are searching inside PID and not all documents.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 5,
    status: "todo",
    title:
      "In Cintoo view, allow user to set unit/site before searching, show equipment details in results, show Cintoo view",
    owner: "Shiva",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description:
      "In Cintoo view, allow user to set unit, site before searching in all equipments, and show equipment details in the search results, and also show up the view in Cintoo.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 6,
    status: "todo",
    title:
      "Need a way to filter just rejected, just approved, to be able to undo some of them",
    owner: "Shiva",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "Need a way to filter just rejected, just approved, and be able to undo some of them.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 7,
    status: "todo",
    title:
      "Link to drawing annotation (click-through from work order/equipment → P&ID with equipment zoomed in & selected)",
    owner: "Shiva",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description:
      "Deep-linking from work orders or equipment objects to the specific annotation on the P&ID.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 8,
    status: "todo",
    title: "Get ESRI embedded into P&ID viewer",
    owner: "Gaurav",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description:
      "Map 3D spatial data to notifications that are currently missing location context.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 9,
    status: "todo",
    title:
      "Get LTTS to validate equipment mapped against frequently used work orders",
    owner: "Gaurav",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description: "External validation step with LTTS.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 10,
    status: "todo",
    title: "Add 'all document' search capability",
    owner: "Unassigned",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description: "Enable users to search across all documents.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 11,
    status: "todo",
    title: "Move all of the Mediasets used by us into the project folder",
    owner: "Satyam",
    effortDays: 1,
    initialEffortDays: 1,
    effortSetDate: SEED_DATE,
    description:
      "Code cleanup – consolidate all Mediasets into the project folder.",
  },
  {
    id: uid(),
    epicId: "epic-p1",
    order: 12,
    status: "todo",
    title: "Validate tag mapping for engineering assets",
    owner: "Satyam",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description:
      "Review and update tag mapping rules to ensure engineering assets are categorized correctly.",
  },

  // ═══════════════════════════════════════════
  // P2 Epic
  // ═══════════════════════════════════════════
  {
    id: uid(),
    epicId: "epic-p2",
    order: 0,
    status: "todo",
    title: "Create the first POC and define subsequent tasks",
    owner: "Gaurav",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description:
      "Build an initial prototype and use it to define follow-up work items.",
  },

  // ═══════════════════════════════════════════
  // P3 Epic
  // ═══════════════════════════════════════════
  {
    id: uid(),
    epicId: "epic-p3",
    order: 0,
    status: "todo",
    title: "Align everyone on the path for BOTEC replacement",
    owner: "Gaurav",
    effortDays: 1,
    initialEffortDays: 1,
    effortSetDate: SEED_DATE,
    description: "Cross-team alignment on strategy and scope.",
  },
  {
    id: uid(),
    epicId: "epic-p3",
    order: 1,
    status: "todo",
    title: "Align on the latency path for process engineering data",
    owner: "Satyam",
    effortDays: 2,
    initialEffortDays: 2,
    effortSetDate: SEED_DATE,
    description:
      "Define acceptable latency targets and architecture for real-time or near-real-time data.",
  },
  {
    id: uid(),
    epicId: "epic-p3",
    order: 2,
    status: "todo",
    title: "Contextualize schematics from BOTEC against the ontology",
    owner: "Satyam",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description:
      "Map BOTEC schematics to ontology objects. Scheduled for the following sprint.",
  },

  // ═══════════════════════════════════════════
  // Chores
  // ═══════════════════════════════════════════
  {
    id: uid(),
    epicId: "epic-chores",
    order: 0,
    status: "todo",
    title: "Evaluate embedding external widgets",
    owner: "Siva",
    effortDays: 3,
    initialEffortDays: 3,
    effortSetDate: SEED_DATE,
    description:
      "Explore options for embedding third-party widgets and apps into the tracker UI.",
  },
];

export const initialUnavailable: UnavailableRange[] = [];
