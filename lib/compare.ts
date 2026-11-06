import { SUGARS, haworth, type Anomer, type Ring, type Sugar } from "./sugars";
import {
  KNOWN, SUGAR_DE, SUGAR_INFO, childrenOf, composition, condensed, formulaOf, formulaString, molarMass, reducingEnds,
  type Glycan, type SugarKey,
} from "./glycan";
import { POLYMERS, type PolymerEntry } from "./polymers";
import { ALL_PROFILES, evaluate, type Profile } from "./profile";
import { TESTS } from "./tests";
import { de, sub } from "./format";

export type Visual =
  | { type: "fischer"; sugar: Sugar }
  | { type: "haworth"; sugar: Sugar; ring: "pyranose" | "furanose"; anomer: Anomer }
  | { type: "glycan"; glycan: Glycan }
  | null;

export type Item = { key: string; label: string; group: string; rows: Record<string, string>; visual: Visual };

const HEXOSE = { C: 6, H: 12, O: 6 };
const RATING = { positiv: "Positiv", negativ: "Negativ", bedingt: "Bedingt", "nicht geeignet": "Nicht geeignet" } as const;
const sym = (a: string) => (a === "alpha" ? "α" : a === "beta" ? "β" : "");
const sideDe = (s: string) => (s === "R" ? "rechts" : "links");

function testRows(p: Profile): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of TESTS) out[`Test: ${t.name}`] = RATING[evaluate(t.id, p).rating];
  return out;
}
const profileOf = (key: string) => ALL_PROFILES.find((p) => p.key === key)!.profile;
const ringDe = (r: string) => (r === "pyranose" ? "Pyranose (Sechsring)" : "Furanose (Fünfring)");

function monoItem(s: Sugar): Item {
  const f = formulaString(HEXOSE);
  return {
    key: `s:${s.id}`, label: s.de, group: "Monosaccharide",
    visual: { type: "fischer", sugar: s },
    rows: {
      "Typ": s.type === "aldose" ? "Monosaccharid, Aldohexose" : "Monosaccharid, Ketohexose",
      "Summenformel": sub(f), "Molare Masse": `${de(molarMass(HEXOSE))} g/mol`,
      "Zuckerbausteine": `1× ${SUGAR_DE[s.id as SugarKey]}`, "Aufbau": "einzelner Zucker",
      "Glykosidische Bindungen": "keine", "Verzweigung": "keine",
      "Stereochemie": `D-Reihe; Fischer-Projektion, OH an ${s.type === "aldose" ? "C2–C5" : "C3–C5"}: ${s.fischer.map(sideDe).join(", ")}`,
      "Ringform": "Gleichgewicht aus offener Form und Ringformen", "Reduzierende Enden": "1 (freies anomeres C-Atom)",
      ...testRows(profileOf(`s:${s.id}`)),
    },
  };
}

function formItem(s: Sugar, ring: "pyranose" | "furanose", anomer: Anomer): Item {
  const f = formulaString(HEXOSE);
  const pos = s.type === "aldose" ? "C1" : "C2";
  const sub2 = haworth(s, ring, anomer)[s.type === "aldose" ? 1 : 2];
  const oh = sub2.up === "OH" ? "oben" : "unten";
  const base = s.id.replace(/ose$/, "o") + ring;
  return {
    key: `f:${s.id}:${ring}:${anomer}`, label: `${sym(anomer)}-D-${base.charAt(0).toUpperCase()}${base.slice(1)}`, group: "Anomere (Ringformen)",
    visual: { type: "haworth", sugar: s, ring, anomer },
    rows: {
      "Typ": `${s.type === "aldose" ? "Aldohexose" : "Ketohexose"}, ${anomer === "alpha" ? "α" : "β"}-Anomer`,
      "Summenformel": sub(f), "Molare Masse": `${de(molarMass(HEXOSE))} g/mol`,
      "Zuckerbausteine": `1× ${SUGAR_DE[s.id as SugarKey]}`, "Aufbau": "einzelner Zucker",
      "Glykosidische Bindungen": "keine", "Verzweigung": "keine",
      "Stereochemie": `${sym(anomer)}-Form: OH am anomeren ${pos} steht in der Haworth-Darstellung ${oh}; übrige Zentren wie D-${SUGAR_DE[s.id as SugarKey]}`,
      "Ringform": ringDe(ring), "Reduzierende Enden": "1 (freies anomeres C-Atom)",
      ...testRows(profileOf(`s:${s.id}`)),
    },
  };
}

function glycanItem(k: (typeof KNOWN)[number]): Item {
  const g = k.glycan;
  const comp = composition(g);
  const kinds = (Object.keys(comp) as SugarKey[]).filter((x) => comp[x] > 0);
  const ringTypes = new Set(g.residues.map((r) => r.ring));
  const rings = ringTypes.size === 1
    ? [ringDe([...ringTypes][0])]
    : [...new Set(g.residues.map((r) => `${r.ring === "pyranose" ? "Pyranose" : "Furanose"} (${SUGAR_INFO[r.sugar].abbr})`))];
  const branches = g.residues.filter((r) => childrenOf(g, r.id).length > 1).length;
  const f = formulaOf(g);
  const red = reducingEnds(g).length;
  return {
    key: `g:${k.id}`, label: k.de, group: "Oligosaccharide",
    visual: { type: "glycan", glycan: g },
    rows: {
      "Typ": k.klass,
      "Summenformel": sub(formulaString(f)), "Molare Masse": `${de(molarMass(f))} g/mol`,
      "Zuckerbausteine": kinds.map((x) => `${comp[x]}× ${SUGAR_DE[x]}`).join(", "),
      "Aufbau": kinds.length === 1 ? `homogen (nur ${SUGAR_DE[kinds[0]]})` : `gemischt (${kinds.map((x) => SUGAR_DE[x]).join(", ")})`,
      "Glykosidische Bindungen": g.links.map((l) => `${sym(g.residues.find((r) => r.id === l.donor)!.anomer)}-(${l.donorPos}→${l.acceptorPos})`).join(", "),
      "Verzweigung": branches ? `${branches} Verzweigung(en)` : "keine, linear",
      "Stereochemie": condensed(g),
      "Ringform": rings.join(", "), "Reduzierende Enden": red ? String(red) : "0 (nicht reduzierend)",
      ...testRows(profileOf(`g:${k.id}`)),
    },
  };
}

const BRANCH: Record<string, string> = {
  starch: "Gemisch aus unverzweigter Amylose und verzweigtem Amylopektin; Anteil variabel",
  amylose: "überwiegend unverzweigt",
  amylopectin: "verzweigt, Verzweigungen über α-(1→6)",
  glycogen: "stark verzweigt, Verzweigungen über α-(1→6)",
  cellulose: "linear, weitgehend unverzweigt",
};
const fact = (p: PolymerEntry, label: string) => p.facts.find((f) => f.label === label)?.value;

function polymerItem(p: PolymerEntry): Item {
  const extra = ["Raumstruktur", "Zwischen den Ketten"].map((l) => fact(p, l)).filter(Boolean);
  const stereo = `${fact(p, "Baustein") ?? "unbekannt"}-Einheiten${extra.length ? "; " + extra.join("; ") : ""}`;
  return {
    key: `p:${p.id}`, label: p.title, group: "Polysaccharide", visual: null,
    rows: {
      "Typ": p.kind,
      "Summenformel": p.model ? `variabel; im Modell ${sub("(C6H10O5)n")}·H₂O` : "keine einheitliche Summenformel",
      "Molare Masse": "abhängig von Kettenlänge und Zusammensetzung",
      "Zuckerbausteine": `${fact(p, "Baustein") ?? "unbekannt"} (Anzahl variabel)`,
      "Aufbau": "Homopolysaccharid (nur Glucose)",
      "Glykosidische Bindungen": fact(p, "Bindungen") ?? "unbekannt",
      "Verzweigung": BRANCH[p.id] ?? "unbekannt",
      "Stereochemie": stereo,
      "Ringform": "Pyranose (Sechsring)", "Reduzierende Enden": "1 je Molekül, Anteil an der Gesamtmasse gering",
      ...testRows(profileOf(`p:${p.id}`)),
    },
  };
}

export function buildItems(): Item[] {
  const forms: Item[] = [];
  for (const s of SUGARS) for (const ring of s.rings.filter((r): r is Exclude<Ring, "open"> => r !== "open")) for (const a of ["alpha", "beta"] as Anomer[]) forms.push(formItem(s, ring, a));
  return [...SUGARS.map(monoItem), ...forms, ...KNOWN.map(glycanItem), ...POLYMERS.map(polymerItem)];
}

export const PAIRS: { label: string; keys: string[] }[] = [
  { label: "Glucose und Fructose", keys: ["s:glucose", "s:fructose"] },
  { label: "Glucose und Galactose", keys: ["s:glucose", "s:galactose"] },
  { label: "α- und β-Glucose", keys: ["f:glucose:pyranose:alpha", "f:glucose:pyranose:beta"] },
  { label: "Maltose und Lactose", keys: ["g:maltose", "g:lactose"] },
  { label: "Amylose und Amylopektin", keys: ["p:amylose", "p:amylopectin"] },
  { label: "Stärke und Glykogen", keys: ["p:starch", "p:glycogen"] },
  { label: "Stärke und Cellulose", keys: ["p:starch", "p:cellulose"] },
];

export type CompareRow = { label: string; values: string[]; differs: boolean };
export function compareRows(items: Item[]): CompareRow[] {
  if (items.length === 0) return [];
  return Object.keys(items[0].rows).map((label) => {
    const values = items.map((i) => i.rows[label] ?? "–");
    return { label, values, differs: new Set(values).size > 1 };
  });
}
