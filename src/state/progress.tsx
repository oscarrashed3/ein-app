import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { lessons } from "../content/level1";

/**
 * Progress lives on the device for the prototype. In the real app the same shape
 * syncs to Supabase, so the manager view (completion, practice) can read it.
 */
export type Done = { at: string; right: number; total: number; xp: number };
export type State = {
  onboarded: boolean;
  name: string;
  reminder: "morning" | "lunch" | "evening";
  done: Record<string, Done>;
  days: string[]; // YYYY-MM-DD, days with at least one lesson
  xp: Record<string, number>; // XP earned per day
  look: Look; // how the learner has dressed Leon
  mapAt: string | null; // the node Leon was last seen standing on (drives the hop after a lesson)
  zones: number[]; // zones whose arrival moment has played
  earnedSeen: number[]; // modules whose colour unlock has been celebrated
  intros?: number[]; // levels whose opening explanation has been shown
  chests?: string[]; // days whose daily-quest chest was opened
  tod: "auto" | "dawn" | "day" | "dusk" | "night"; // prototype: force the map's time of day
  unlockAll?: boolean; // prototype: open every wardrobe item
  map?: "3d" | "simple"; // Journey drawn as the 3D world (default) or the flat map
};

/** Leon's look. Colour is earned: gold, purple and mint arrive with modules 1, 2 and 3. */
export type Skin = "unaware" | "gold" | "purple" | "mint" | "all";
export type Look = { skin: Skin; crest: "fins" | "round" | "spikes"; pattern: "hatch" | "dots" | "scales"; tip: "ink" | "white" | "gold"; acc: "none" | "scarf" | "satchel" | "hat" };
export const defaultLook: Look = { skin: "unaware", crest: "fins", pattern: "hatch", tip: "ink", acc: "none" };
export const ACC_AT: Record<Look["acc"], number> = { none: 0, scarf: 3, satchel: 7, hat: 14 };

const KEY = "ein.progress.v3";
const OLD = "ein.progress.v2";
export const DAILY_GOAL = 40;
const blank: State = { onboarded: false, name: "", reminder: "morning", done: {}, days: [], xp: {}, look: defaultLook, mapAt: null, zones: [], earnedSeen: [], tod: "auto" };

export const dayKey = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Consecutive days with a lesson, counting back from today (or yesterday, if today isn't done yet). */
export function streakOf(days: string[], today = new Date()) {
  const set = new Set(days);
  let cur = set.has(dayKey(today)) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(dayKey(cur))) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

export function bestStreakOf(days: string[]) {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && dayKey(addDays(new Date(prev + "T12:00:00"), 1)) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Daily quests: three small goals that reset each day; finishing all three opens a chest. */
export const CHEST_XP = 20;
export function questsOf(s: State, today = dayKey()) {
  const todays = Object.values(s.done).filter((d) => d.at === today);
  const xp = s.xp[today] ?? 0;
  return [
    { k: "lesson", label: "Finish a lesson", have: Math.min(1, todays.length), need: 1 },
    { k: "clean", label: "Get every check right in one lesson", have: todays.some((d) => d.total > 0 && d.right === d.total) ? 1 : 0, need: 1 },
    { k: "xp", label: `Earn ${DAILY_GOAL} XP`, have: Math.min(DAILY_GOAL, xp), need: DAILY_GOAL },
  ];
}
/** Streak freezes: one to start, one more for every 7-day streak, at most 2. A freeze covers one missed day. */
export const freezesOf = (best: number) => Math.min(2, 1 + Math.floor(best / 7));

/** Monday to Sunday of this week, with whether each day has a lesson. */
export function weekOf(days: string[], today = new Date()) {
  const set = new Set(days);
  const mon = addDays(today, -((today.getDay() + 6) % 7));
  return ["M", "T", "W", "T", "F", "S", "S"].map((l, i) => {
    const d = addDays(mon, i);
    return { l, on: set.has(dayKey(d)), today: dayKey(d) === dayKey(today), future: d > today && dayKey(d) !== dayKey(today) };
  });
}

type Ctx = {
  s: State;
  ready: boolean;
  set: (p: Partial<State>) => void;
  complete: (id: string, r: { right: number; total: number; xp: number }) => { streak: number; extended: boolean; prev: number; todayXp: number };
  totalXp: number;
  next: () => string | null;
  unlocked: (id: string) => boolean;
  demo: (k?: number) => void;
  reset: () => void;
  /** Modules finished, in order. Each one gives Leon a colour. */
  earned: number[];
  streak: number;
};
const C = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(blank);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(async (raw) => raw ?? (await AsyncStorage.getItem(OLD)))
      .then((raw) => {
        if (!raw) return;
        const v = JSON.parse(raw);
        setS({ ...blank, ...v, look: { ...defaultLook, ...(v.look ?? {}) } });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const save = useCallback((n: State) => {
    setS(n);
    AsyncStorage.setItem(KEY, JSON.stringify(n)).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(() => {
    const next = () => lessons.find((l) => !s.done[l.id])?.id ?? null;
    return {
      s,
      ready,
      set: (p) => save({ ...s, ...p }),
      complete: (id, r) => {
        const today = dayKey();
        const had = s.days.includes(today);
        const days = had ? s.days : [...s.days, today];
        const todayXp = (s.xp[today] ?? 0) + r.xp;
        save({ ...s, days, xp: { ...s.xp, [today]: todayXp }, done: { ...s.done, [id]: { at: today, ...r } } });
        return { streak: streakOf(days), extended: !had, prev: streakOf(s.days), todayXp };
      },
      earned: [1, 2, 3].filter((m) => lessons.filter((l) => l.module === m).every((l) => s.done[l.id])),
      streak: streakOf(s.days),
      totalXp: Object.values(s.xp).reduce((a, b) => a + b, 0),
      next,
      // Lessons open one after another; finished ones stay open to rewatch.
      unlocked: (id) => !!s.done[id] || id === next(),
      demo: (k = 5) => {
        // Prototype: pretend k lessons are done. Leon stands on the last one, so the map plays the hop to the next.
        const today = new Date();
        const days = [4, 3, 2, 1].map((n) => dayKey(addDays(today, -n)));
        const done: Record<string, Done> = {};
        const xp: Record<string, number> = {};
        lessons.slice(0, k).forEach((l, i) => {
          const at = days[Math.min(i, 3)];
          done[l.id] = { at, right: 2, total: 2, xp: 35 };
          xp[at] = (xp[at] ?? 0) + 35;
        });
        const mods = [1, 2, 3].filter((m) => lessons.filter((l) => l.module === m).every((l) => done[l.id]));
        const lastMod = k ? lessons[k - 1].module : 1;
        // The module just finished (if any) still gets its colour moment.
        const seen = mods.filter((m) => m !== lastMod || lessons[k]?.module === lastMod);
        const zones = [...new Set(lessons.slice(0, k).map((l) => l.module))];
        save({ ...s, onboarded: true, name: s.name || "Oscar", done, days, xp, mapAt: k ? lessons[k - 1].id : null, zones: zones.length ? zones : [], earnedSeen: seen });
      },
      reset: () => save(blank),
    };
  }, [s, ready, save]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

/** Leon's saved look, or null outside the provider (Leon can draw himself anywhere). */
export const useLookMaybe = () => useContext(C)?.s.look ?? null;
/** How grown-up Leon is: one step per module finished, more with each level. */
export const useStageMaybe = () => useContext(C)?.earned.length ?? 0;

export const useProgress = () => {
  const v = useContext(C);
  if (!v) throw new Error("useProgress outside ProgressProvider");
  return v;
};
