import type { SheetData } from "./Sheet";
export type Report = { ok: boolean; xp: number; right: number; total: number; sheet: SheetData; meter?: number };
export type StepProps<S> = { step: S; report: (r: Report) => void; locked: boolean };
