// Glykan-Datenmodell: Bausteine (Residues) und glykosidische Bindungen (Links).
// Chemie: Jede glykosidische Bindung entsteht durch Kondensation (Verlust von 1 H2O).
// Alle Werte werden aus dem Modell berechnet; es gibt keine hinterlegten Summenformeln für Oligosaccharide.

export type SugarKey = "glucose" | "galactose" | "mannose" | "fructose";
export type RingForm = "pyranose" | "furanose";
export type Anom = "alpha" | "beta" | "free";
export type Counts = Record<string, number>;

export type Residue = { id: string; sugar: SugarKey; ring: RingForm; anomer: Anom };
/** donor = Baustein, dessen anomeres C-Atom (donorPos) bindet; acceptor = Baustein, dessen OH (acceptorPos) reagiert. */
export type Linkage = { donor: string; acceptor: string; donorPos: number; acceptorPos: number };
export type Glycan = { residues: Residue[]; links: Linkage[] };

export const SUGAR_INFO: Record<SugarKey, { abbr: string; stem: string; en: string; type: "aldose" | "ketose"; defaultRing: RingForm }> = {
  glucose: { abbr: "Glc", stem: "glucose", en: "glucose", type: "aldose", defaultRing: "pyranose" },
  galactose: { abbr: "Gal", stem: "galactose", en: "galactose", type: "aldose", defaultRing: "pyranose" },
  mannose: { abbr: "Man", stem: "mannose", en: "mannose", type: "aldose", defaultRing: "pyranose" },
  fructose: { abbr: "Fru", stem: "fructose", en: "fructose", type: "ketose", defaultRing: "furanose" },
};
export const SUGAR_DE: Record<SugarKey, string> = { glucose: "Glucose", galactose: "Galactose", mannose: "Mannose", fructose: "Fructose" };

const HEXOSE: Counts = { C: 6, H: 12, O: 6 };
const WATER: Counts = { H: 2, O: 1 };
const WEIGHTS: Record<string, number> = { C: 12.011, H: 1.008, O: 15.999 };

export const anomericPos = (r: Residue) => (SUGAR_INFO[r.sugar].type === "aldose" ? 1 : 2);

export function addCounts(a: Counts, b: Counts, factor = 1): Counts {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v * factor;
  return out;
}
export function formulaString(c: Counts): string {
  const order = ["C", "H", ...Object.keys(c).filter((k) => k !== "C" && k !== "H").sort()];
  return order.filter((k) => c[k]).map((k) => k + (c[k] > 1 ? c[k] : "")).join("");
}
export function molarMass(c: Counts): number {
  return Object.entries(c).reduce((s, [k, v]) => s + (WEIGHTS[k] ?? NaN) * v, 0);
}

// ---------- Berechnungen ----------
export function composition(g: Glycan): Record<SugarKey, number> {
  const out = { glucose: 0, galactose: 0, mannose: 0, fructose: 0 } as Record<SugarKey, number>;
  g.residues.forEach((r) => { out[r.sugar]++; });
  return out;
}

/** Summenformel: Summe der freien Monosaccharide minus ein Wasser je Bindung. */
export function formulaOf(g: Glycan): Counts {
  let c: Counts = {};
  g.residues.forEach(() => { c = addCounts(c, HEXOSE); });
  return addCounts(c, WATER, -g.links.length);
}

export function isFreeAnomeric(g: Glycan, r: Residue): boolean {
  const pos = anomericPos(r);
  const asDonor = g.links.some((l) => l.donor === r.id);
  const asAcceptorAtAnomeric = g.links.some((l) => l.acceptor === r.id && l.acceptorPos === pos);
  return !asDonor && !asAcceptorAtAnomeric;
}
export const reducingEnds = (g: Glycan) => g.residues.filter((r) => isFreeAnomeric(g, r));

/** Wurzel = Baustein, der nie Donor ist. */
export function rootOf(g: Glycan): Residue | undefined {
  return g.residues.find((r) => !g.links.some((l) => l.donor === r.id));
}
export const childrenOf = (g: Glycan, id: string) =>
  g.links.filter((l) => l.acceptor === id).sort((a, b) => a.acceptorPos - b.acceptorPos);

export function depths(g: Glycan): Record<string, number> {
  const root = rootOf(g);
  const d: Record<string, number> = {};
  if (!root) return d;
  const walk = (id: string, n: number) => { d[id] = n; childrenOf(g, id).forEach((l) => walk(l.donor, n + 1)); };
  walk(root.id, 0);
  return d;
}

export function validate(g: Glycan): string[] {
  const errors: string[] = [];
  if (g.residues.length === 0) return ["Es ist noch kein Baustein vorhanden."];
  const byId = new Map(g.residues.map((r) => [r.id, r]));
  const usedAcc = new Set<string>();
  const donors = new Set<string>();
  for (const l of g.links) {
    const d = byId.get(l.donor), a = byId.get(l.acceptor);
    if (!d || !a) { errors.push("Eine Bindung verweist auf einen nicht vorhandenen Baustein."); continue; }
    if (donors.has(l.donor)) errors.push("Ein Baustein kann sein anomeres C-Atom nur einmal binden.");
    donors.add(l.donor);
    if (l.donorPos !== anomericPos(d)) errors.push("Die Bindung muss am anomeren C-Atom des Donors ansetzen.");
    if (d.anomer === "free") errors.push("Ein gebundener Donor braucht eine α- oder β-Konfiguration.");
    if (!allowedPositions(a).includes(l.acceptorPos)) errors.push(`C${l.acceptorPos} von ${SUGAR_DE[a.sugar]} kann im ${a.ring === "pyranose" ? "Pyranose" : "Furanose"}-Ring nicht verknüpft werden.`);
    if (l.acceptorPos === anomericPos(a) && a.anomer === "free") errors.push("Ein Akzeptor, der am anomeren C-Atom gebunden ist, braucht eine α- oder β-Konfiguration.");
    const key = `${l.acceptor}:${l.acceptorPos}`;
    if (usedAcc.has(key)) errors.push(`C${l.acceptorPos} ist bereits besetzt.`);
    usedAcc.add(key);
  }
  if (g.links.length !== g.residues.length - 1) errors.push("Die Struktur ist nicht zusammenhängend oder enthält einen Ring.");
  else {
    const root = rootOf(g);
    if (!root || Object.keys(depths(g)).length !== g.residues.length) errors.push("Die Struktur ist nicht zusammenhängend oder enthält einen Ring.");
  }
  return [...new Set(errors)];
}

/** Positionen mit einer OH-Gruppe, die im Ring noch zur Verfügung steht (Ringschluss-C-Atom ausgenommen). */
export function allowedPositions(_r: Residue): number[] {
  // Aldose-Pyranose und Ketose-Furanose: C5 trägt den Ringsauerstoff und hat keine freie OH-Gruppe.
  return [1, 2, 3, 4, 6];
}
/** Freie, wählbare Positionen für einen neuen Donor an diesem Akzeptor. */
export function freePositions(g: Glycan, r: Residue): number[] {
  const used = new Set(g.links.filter((l) => l.acceptor === r.id).map((l) => l.acceptorPos));
  const asDonor = g.links.some((l) => l.donor === r.id);
  return allowedPositions(r).filter((p) => {
    if (used.has(p)) return false;
    if (p === anomericPos(r) && asDonor) return false;
    return true;
  });
}

// ---------- Namen ----------
const sym = (a: Anom) => (a === "alpha" ? "α" : a === "beta" ? "β" : "");
const ringWord = (r: RingForm) => (r === "pyranose" ? "pyranose" : "furanose");

function label(r: Residue): string {
  const p = r.anomer === "free" ? "" : sym(r.anomer) + "-";
  return `${p}D-${SUGAR_INFO[r.sugar].abbr}${r.ring === "pyranose" ? "p" : "f"}`;
}

/** Kurzschreibweise (IUPAC-condensed-ähnlich): nichtreduzierendes Ende links, Wurzel rechts. */
export function condensed(g: Glycan): string {
  const root = rootOf(g);
  if (!root) return "";
  const render = (r: Residue): string => {
    const kids = childrenOf(g, r.id);
    if (!kids.length) return label(r);
    const parts = kids.map((l) => `${render(g.residues.find((x) => x.id === l.donor)!)}-(${l.donorPos}→${l.acceptorPos})`);
    const main = parts.pop()!;
    return `${parts.map((p) => `[${p}]-`).join("")}${main}-${label(r)}`;
  };
  return render(root);
}

/** Systematischer Name, z. B. α-D-Glucopyranosyl-(1→2)-β-D-fructofuranosid. */
export function systematicName(g: Glycan): string {
  const root = rootOf(g);
  if (!root) return "";
  const render = (r: Residue, isRoot: boolean): string => {
    const base = SUGAR_INFO[r.sugar].stem.replace(/ose$/, "o") + ringWord(r.ring); // z. B. glucopyranose
    const kids = childrenOf(g, r.id);
    let own: string;
    if (!isRoot) own = `${sym(r.anomer)}-D-${base.replace(/e$/, "")}yl`; // glucopyranosyl
    else if (isFreeAnomeric(g, r)) own = `D-${base}`;
    else own = `${sym(r.anomer)}-D-${base.replace(/e$/, "")}id`; // fructofuranosid
    if (!kids.length) return own;
    const parts = kids.map((l) => `${render(g.residues.find((x) => x.id === l.donor)!, false)}-(${l.donorPos}→${l.acceptorPos})`);
    const main = parts.pop()!;
    return `${parts.map((p) => `[${p}]-`).join("")}${main}-${own}`;
  };
  return render(root, true).replace(/D-([a-z])/, (_m, c: string) => "D-" + c.toUpperCase());
}

/** Eindeutige Zeichenfolge für den Strukturvergleich (unabhängig von IDs und Reihenfolge). */
export function canonical(g: Glycan): string {
  return condensed(g);
}

// ---------- Hydrolyse ----------
export type Fragment = { glycan: Glycan; formula: Counts; mass: number };

/** Spaltet die angegebenen Bindungen. Je Spaltung wird ein Wasser verbraucht; der Donor erhält ein freies anomeres OH. */
export function hydrolyze(g: Glycan, cut: Linkage[]): Fragment[] {
  const cutKey = (l: Linkage) => `${l.donor}>${l.acceptor}:${l.acceptorPos}`;
  const cutSet = new Set(cut.map(cutKey));
  const remaining = g.links.filter((l) => !cutSet.has(cutKey(l)));
  const freed = new Set(g.links.filter((l) => cutSet.has(cutKey(l))).map((l) => l.donor));
  const parent = new Map<string, string>();
  const find = (x: string): string => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x)!)), parent.get(x)!));
  g.residues.forEach((r) => parent.set(r.id, r.id));
  remaining.forEach((l) => parent.set(find(l.donor), find(l.acceptor)));
  const groups = new Map<string, Residue[]>();
  g.residues.forEach((r) => {
    const root = find(r.id);
    const copy: Residue = freed.has(r.id) ? { ...r, anomer: "free" } : { ...r };
    groups.set(root, [...(groups.get(root) ?? []), copy]);
  });
  return [...groups.values()].map((residues) => {
    const ids = new Set(residues.map((r) => r.id));
    const sub: Glycan = { residues, links: remaining.filter((l) => ids.has(l.donor)) };
    const formula = formulaOf(sub);
    return { glycan: sub, formula, mass: molarMass(formula) };
  });
}

// ---------- Wissensbasis (Angaben nach Vorgabe des Projekts) ----------
const R = (id: string, sugar: SugarKey, anomer: Anom): Residue => ({ id, sugar, ring: SUGAR_INFO[sugar].defaultRing, anomer });
const L = (donor: string, acceptor: string, donorPos: number, acceptorPos: number): Linkage => ({ donor, acceptor, donorPos, acceptorPos });

export type KnownGlycan = { id: string; de: string; aliases: string[]; klass: string; glycan: Glycan };

export const KNOWN: KnownGlycan[] = [
  { id: "maltose", de: "Maltose", aliases: ["maltose", "malzzucker"], klass: "Disaccharid", glycan: { residues: [R("a", "glucose", "alpha"), R("b", "glucose", "free")], links: [L("a", "b", 1, 4)] } },
  { id: "lactose", de: "Lactose", aliases: ["lactose", "laktose", "milchzucker"], klass: "Disaccharid", glycan: { residues: [R("a", "galactose", "beta"), R("b", "glucose", "free")], links: [L("a", "b", 1, 4)] } },
  { id: "sucrose", de: "Saccharose", aliases: ["saccharose", "sucrose", "sacharose", "rohrzucker", "haushaltszucker"], klass: "Disaccharid", glycan: { residues: [R("a", "glucose", "alpha"), R("b", "fructose", "beta")], links: [L("a", "b", 1, 2)] } },
  { id: "cellobiose", de: "Cellobiose", aliases: ["cellobiose", "zellobiose"], klass: "Disaccharid", glycan: { residues: [R("a", "glucose", "beta"), R("b", "glucose", "free")], links: [L("a", "b", 1, 4)] } },
  { id: "isomaltose", de: "Isomaltose", aliases: ["isomaltose"], klass: "Disaccharid", glycan: { residues: [R("a", "glucose", "alpha"), R("b", "glucose", "free")], links: [L("a", "b", 1, 6)] } },
  { id: "trehalose", de: "Trehalose", aliases: ["trehalose"], klass: "Disaccharid", glycan: { residues: [R("a", "glucose", "alpha"), R("b", "glucose", "alpha")], links: [L("a", "b", 1, 1)] } },
  { id: "maltotriose", de: "Maltotriose", aliases: ["maltotriose"], klass: "Trisaccharid (Oligosaccharid)", glycan: { residues: [R("a", "glucose", "alpha"), R("b", "glucose", "alpha"), R("c", "glucose", "free")], links: [L("a", "b", 1, 4), L("b", "c", 1, 4)] } },
  { id: "raffinose", de: "Raffinose", aliases: ["raffinose"], klass: "Trisaccharid (Oligosaccharid)", glycan: { residues: [R("a", "galactose", "alpha"), R("b", "glucose", "alpha"), R("c", "fructose", "beta")], links: [L("a", "b", 1, 6), L("b", "c", 1, 2)] } },
];

export const findGlycan = (input: string) => KNOWN.find((k) => k.aliases.includes(input.trim().toLowerCase()));
export const matchKnown = (g: Glycan) => KNOWN.find((k) => canonical(k.glycan) === canonical(g));

/** Liest ein gespeichertes Glykan streng validiert ein (null bei ungültigen Daten). */
export function parseGlycan(json: string): Glycan | null {
  try {
    const g = JSON.parse(json);
    if (!g || !Array.isArray(g.residues) || !Array.isArray(g.links) || g.residues.length > 200 || g.links.length > 200) return null;
    const residues: Residue[] = [];
    for (const r of g.residues) {
      if (typeof r?.id !== "string" || !(r.sugar in SUGAR_INFO) || !["pyranose", "furanose"].includes(r.ring) || !["alpha", "beta", "free"].includes(r.anomer)) return null;
      residues.push({ id: r.id, sugar: r.sugar, ring: r.ring, anomer: r.anomer });
    }
    const links: Linkage[] = [];
    for (const l of g.links) {
      if (typeof l?.donor !== "string" || typeof l?.acceptor !== "string" || !Number.isInteger(l.donorPos) || !Number.isInteger(l.acceptorPos)) return null;
      links.push({ donor: l.donor, acceptor: l.acceptor, donorPos: l.donorPos, acceptorPos: l.acceptorPos });
    }
    const out = { residues, links };
    return validate(out).length ? null : out;
  } catch { return null; }
}
