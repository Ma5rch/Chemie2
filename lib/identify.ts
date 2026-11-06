import { evaluate, type Profile } from "./profile";
import { TEST_BY_ID, type TestId } from "./tests";

export type IdTest = Extract<TestId, "iod" | "god" | "seliwanoff" | "fehling" | "benedict" | "barfoed" | "molisch">;
export type Obs = "pos" | "mid" | "neg";

export const ID_TESTS: IdTest[] = ["iod", "god", "seliwanoff", "fehling", "benedict", "barfoed", "molisch"];

/** Mögliche Beobachtungen je Test (Beschriftung in der Oberfläche). */
export const OBS_LABELS: Record<IdTest, Partial<Record<Obs, string>>> = {
  iod: { pos: "Blauschwarze Färbung", mid: "Rotviolette bis rotbraune Färbung", neg: "Keine Färbung (gelbbraun bleibt)" },
  god: { pos: "Farbumschlag am Testfeld", neg: "Kein Farbumschlag" },
  seliwanoff: { pos: "Schnell kirschrote Färbung", mid: "Langsame oder schwache Rotfärbung", neg: "Keine Färbung" },
  fehling: { pos: "Ziegelroter bis rotbrauner Niederschlag", neg: "Keine Veränderung (blau bleibt)" },
  benedict: { pos: "Gelber bis rotbrauner Niederschlag", neg: "Keine Veränderung (blau bleibt)" },
  barfoed: { pos: "Schnell Niederschlag (wenige Minuten)", mid: "Erst spät Niederschlag", neg: "Kein Niederschlag" },
  molisch: { pos: "Violetter Ring", neg: "Kein Ring" },
};
/** Nur bei diesen Tests ist eine Probe nach Hydrolyse sinnvoll auswertbar. */
export const HYDROLYSIS_TESTS: IdTest[] = ["god", "fehling", "benedict"];

export type Entry = { test: IdTest; obs: Obs; hydrolysed: boolean };
export type Candidate = { key: string; profile: Profile };

/** Welche Beobachtungen sind für ein Profil unter Schulbedingungen vereinbar? */
export function allowedObs(test: IdTest, p: Profile, hydrolysed: boolean): { set: Set<Obs>; reason: string } {
  const e = evaluate(test, p);
  const use = hydrolysed && e.afterHydrolysis ? e.afterHydrolysis : e;
  let set: Set<Obs>;
  switch (use.rating) {
    case "positiv": set = new Set<Obs>(["pos"]); break;
    case "negativ": set = new Set<Obs>(test === "barfoed" ? ["neg", "mid"] : ["neg"]); break;
    case "bedingt":
      set = test === "seliwanoff" && p.hasFructose ? new Set<Obs>(["pos", "mid", "neg"]) : new Set<Obs>(["mid", "neg"]);
      break;
    default: set = new Set<Obs>(["pos", "mid", "neg"]);
  }
  // nur Beobachtungen zulassen, die der Test überhaupt anbietet
  for (const o of [...set]) if (!OBS_LABELS[test][o]) set.delete(o);
  if (set.size === 0) set = new Set<Obs>(["neg"]);
  return { set, reason: use.reason };
}

const labelOf = (t: IdTest, o: Obs) => OBS_LABELS[t][o] ?? o;
const entryName = (en: Entry) => TEST_BY_ID[en.test].name + (en.hydrolysed ? " (nach Hydrolyse)" : "");

export type Outcome = {
  state: "wahrscheinlich" | "mehrdeutig" | "unbekannt";
  contradiction: boolean;
  remaining: Candidate[];
  excluded: { cand: Candidate; reasons: string[] }[];
  suggestions: { test: IdTest; groups: { label: string; names: string[] }[] }[];
  confirm: string[];
};

export function identify(cands: Candidate[], entries: Entry[]): Outcome {
  const remaining: Candidate[] = [];
  const excluded: Outcome["excluded"] = [];
  for (const c of cands) {
    const reasons: string[] = [];
    for (const en of entries) {
      const { set, reason } = allowedObs(en.test, c.profile, en.hydrolysed);
      if (!set.has(en.obs)) {
        const expected = [...set].map((o) => labelOf(en.test, o)).join(" oder ");
        reasons.push(`${entryName(en)}: beobachtet „${labelOf(en.test, en.obs)}“, für ${c.profile.label} erwartet „${expected}“. ${reason}`);
      }
    }
    (reasons.length ? excluded.push({ cand: c, reasons }) : remaining.push(c));
  }

  const done = new Set(entries.filter((e) => !e.hydrolysed).map((e) => e.test));
  const suggestions: Outcome["suggestions"] = [];
  if (remaining.length > 1) {
    for (const t of ID_TESTS) {
      if (done.has(t)) continue;
      const groups = new Map<string, string[]>();
      for (const c of remaining) {
        const { set } = allowedObs(t, c.profile, false);
        const lab = [...set].map((o) => labelOf(t, o)).join(" oder ");
        groups.set(lab, [...(groups.get(lab) ?? []), c.profile.label]);
      }
      if (groups.size > 1) suggestions.push({ test: t, groups: [...groups].map(([label, names]) => ({ label, names })) });
    }
    suggestions.sort((a, b) => b.groups.length - a.groups.length);
  }

  const confirm: string[] = [];
  if (remaining.length === 1) {
    const r = remaining[0].profile;
    if (r.label.includes("Galactose")) confirm.push("Zur unabhängigen Bestätigung: enzymatischer Galactose-Nachweis oder Chromatographie. Galactose hat keinen eigenen, eindeutig spezifischen Schultest.");
    if (r.isGlucose && !done.has("god")) confirm.push("Der GOD-Test würde Glucose gezielt bestätigen.");
    if (r.hasFructose && r.kind === "glycan" && !entries.some((e) => e.hydrolysed)) confirm.push("Fehling oder Benedict vor und nach Hydrolyse vergleichen: nicht reduzierend vorher, reduzierend nachher.");
    confirm.push("Das Ergebnis gilt nur innerhalb der gewählten Kandidatenliste. Ein Stoff außerhalb der Liste wird so nicht erkannt.");
  }

  const contradiction = entries.length > 0 && remaining.length === 0;
  return { state: remaining.length === 1 ? "wahrscheinlich" : remaining.length === 0 && entries.length > 0 ? "unbekannt" : "mehrdeutig", contradiction, remaining, excluded, suggestions, confirm };
}
