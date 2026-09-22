export type CheckIn = {
  id: string;
  date: string;
  energy: number;
  stress: number;
  sleepHours: number;
  soreness: number;
  note: string;
};
export type DailyMetric = {
  date: string;
  sleepHours?: number;
  restingHeartRate?: number;
  steps?: number;
  bodyBattery?: number;
  source: "garmin";
};
export type Activity = {
  id: string;
  date: string;
  name: string;
  type: string;
  minutes: number;
  distanceKm?: number;
  source: "garmin" | "manual";
};
export type HealthProfile = { name: string; goal: string; minutes: number };
export type HealthState = {
  profile: HealthProfile;
  checkIns: CheckIn[];
  metrics: DailyMetric[];
  activities: Activity[];
  completed: string[];
};
export const emptyHealth: HealthState = {
  profile: { name: "", goal: "Build a sustainable routine", minutes: 30 },
  checkIns: [],
  metrics: [],
  activities: [],
  completed: [],
};
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function sampleHealth(): HealthState {
  const now = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    return dayKey(d);
  });
  return {
    profile: { name: "", goal: "Build a sustainable routine", minutes: 30 },
    completed: [],
    checkIns: [
      {
        id: "sample",
        date: dayKey(),
        energy: 3,
        stress: 3,
        sleepHours: 7.4,
        soreness: 3,
        note: "Legs feel a little heavy after yesterday’s run.",
      },
    ],
    metrics: dates.map((date, i) => ({
      date,
      sleepHours: [7.2, 8.1, 6.8, 7.5, 7.8, 6.5, 7.4][i],
      restingHeartRate: [50, 49, 53, 51, 50, 55, 52][i],
      steps: [8020, 10230, 6400, 9400, 7300, 12420, 6842][i],
      bodyBattery: [74, 87, 61, 78, 82, 58, 72][i],
      source: "garmin",
    })),
    activities: [
      {
        id: "sample-run",
        date: dates[5],
        name: "Afternoon run",
        type: "Running",
        minutes: 42,
        distanceKm: 6.8,
        source: "garmin",
      },
      {
        id: "sample-strength",
        date: dates[3],
        name: "Full body strength",
        type: "Strength",
        minutes: 35,
        source: "manual",
      },
      {
        id: "sample-walk",
        date: dates[1],
        name: "Morning walk",
        type: "Walking",
        minutes: 28,
        distanceKm: 2.4,
        source: "garmin",
      },
    ],
  };
}
/** Seven calendar days, oldest first. Missing days stay unknown, never zero-filled. */
export function dailyTrends(state: HealthState, today = dayKey()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today + "T12:00:00");
    date.setDate(date.getDate() - (6 - i));
    const key = dayKey(date);
    const check = state.checkIns.find(entry => entry.date === key);
    const metric = state.metrics.find(entry => entry.date === key);
    return {
      date: key,
      sleepHours: check?.sleepHours ?? metric?.sleepHours,
      restingHeartRate: metric?.restingHeartRate,
      steps: metric?.steps,
      energy: check?.energy,
    };
  });
}
export function dailyBriefing(state: HealthState, today = dayKey()) {
  const check = state.checkIns.find((x) => x.date === today);
  const metric = state.metrics.find((x) => x.date === today);
  const sleep = check?.sleepHours ?? metric?.sleepHours;
  const easy =
    (!!check &&
      (check.energy <= 2 || check.soreness >= 4 || check.stress >= 4)) ||
    (sleep !== undefined && sleep < 6);
  const hasData = !!check || sleep !== undefined;
  return {
    title: !hasData
      ? "Start with how you feel."
      : easy
        ? "Make today a gentler day."
        : "Make space for steady progress.",
    description: !hasData
      ? "A quick check-in gives your day a starting point. Add your sleep, energy, and anything on your mind."
      : easy
        ? `${check ? "Today’s check-in" : "Today’s Garmin sleep record"} points toward a lighter day. Choose a comfortable walk or rest, and adjust if something feels off.`
        : "Use your plan as a starting point, then adapt it to your energy and schedule. A wearable can add context; you get the final say.",
    label: !hasData
      ? "Your first step"
      : easy
        ? "Keep it easy"
        : "Find your rhythm",
    reasons: [
      ...(sleep !== undefined ? [`${check ? "Self-reported" : "Garmin"} sleep: ${sleep.toFixed(1)} hours`] : []),
      ...(check
        ? [`Energy ${check.energy}/5`, `Stress ${check.stress}/5`, `Soreness ${check.soreness}/5`]
        : []),
    ],
    plan: [
      {
        id: "move",
        title: easy ? "A comfortable walk" : "Move with intention",
        detail: easy
          ? "10–20 minutes, or rest if you need it."
          : `${state.profile.minutes} minutes of movement you enjoy.`,
        kind: "Movement",
      },
      {
        id: "recover",
        title: "Protect your wind-down",
        detail: "Set aside a quiet stretch before bed.",
        kind: "Recovery",
      },
      {
        id: "reflect",
        title: "Check in with yourself",
        detail: "Notice your energy, stress, and how your body feels.",
        kind: "Reflection",
      },
    ],
  };
}
export function validateHealth(value: unknown): HealthState {
  if (!value || typeof value !== "object")
    throw new Error("Health data must be an object.");
  const s = value as HealthState;
  if (
    !s.profile ||
    typeof s.profile.name !== "string" ||
    s.profile.name.length > 60 ||
    typeof s.profile.goal !== "string" ||
    s.profile.goal.length > 240 ||
    !Number.isInteger(s.profile.minutes) ||
    s.profile.minutes < 5 ||
    s.profile.minutes > 180
  )
    throw new Error("Choose a name, goal, and 5–180 available minutes.");
  if (
    !Array.isArray(s.checkIns) ||
    s.checkIns.length > 366 ||
    !Array.isArray(s.activities) ||
    s.activities.length > 1000 ||
    !Array.isArray(s.metrics) ||
    s.metrics.length > 366 ||
    !Array.isArray(s.completed) ||
    s.completed.length > 1500
  )
    throw new Error("Health history exceeds the supported limit.");
  const date = (x: unknown) =>
    typeof x === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(x) &&
    !Number.isNaN(Date.parse(x)) &&
    new Date(x).toISOString().slice(0, 10) === x;
  const num = (x: unknown, min: number, max: number) =>
    typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
  for (const c of s.checkIns)
    if (
      !c ||
      typeof c.id !== "string" ||
      c.id.length > 100 ||
      !date(c.date) ||
      ![c.energy, c.stress, c.soreness].every(
        (x) => num(x, 1, 5) && Number.isInteger(x),
      ) ||
      !num(c.sleepHours, 0, 24) ||
      typeof c.note !== "string" ||
      c.note.length > 2000
    )
      throw new Error("Invalid check-in.");
  for (const a of s.activities)
    if (
      !a ||
      typeof a.id !== "string" ||
      a.id.length > 100 ||
      !date(a.date) ||
      typeof a.name !== "string" ||
      a.name.length > 120 ||
      typeof a.type !== "string" ||
      a.type.length > 60 ||
      !num(a.minutes, 1, 1440) ||
      (a.distanceKm !== undefined && !num(a.distanceKm, 0, 1000)) ||
      !["garmin", "manual"].includes(a.source)
    )
      throw new Error("Invalid activity.");
  for (const m of s.metrics)
    if (
      !m ||
      !date(m.date) ||
      m.source !== "garmin" ||
      (m.sleepHours !== undefined && !num(m.sleepHours, 0, 24)) ||
      (m.restingHeartRate !== undefined && !num(m.restingHeartRate, 20, 250)) ||
      (m.steps !== undefined && !num(m.steps, 0, 200000)) ||
      (m.bodyBattery !== undefined && !num(m.bodyBattery, 0, 100))
    )
      throw new Error("Invalid wearable data.");
  if (s.completed.some((x) => typeof x !== "string" || x.length > 60))
    throw new Error("Invalid plan history.");
  // Explicitly pick supported fields to avoid persisting arbitrary input.
  return {
    profile: {
      name: s.profile.name,
      goal: s.profile.goal,
      minutes: s.profile.minutes,
    },
    checkIns: s.checkIns
      .map(({ id, date, energy, stress, sleepHours, soreness, note }) => ({
        id,
        date,
        energy,
        stress,
        sleepHours,
        soreness,
        note,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    activities: s.activities
      .map(({ id, date, name, type, minutes, distanceKm, source }) => ({
        id,
        date,
        name,
        type,
        minutes,
        distanceKm,
        source,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    metrics: s.metrics
      .map(
        ({
          date,
          sleepHours,
          restingHeartRate,
          steps,
          bodyBattery,
          source,
        }) => ({
          date,
          sleepHours,
          restingHeartRate,
          steps,
          bodyBattery,
          source,
        }),
      )
      .sort((a, b) => a.date.localeCompare(b.date)),
    completed: s.completed,
  };
}
