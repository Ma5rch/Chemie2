import { SUGARS, type Sugar } from "./sugars";
import { KNOWN, composition, findGlycan, reducingEnds, validate, SUGAR_DE, type Glycan, type SugarKey } from "./glycan";
import { POLYMERS, findPolymer } from "./polymers";
import { findSugar } from "./sugars";
import type { TestId } from "./tests";

export type Rating = "positiv" | "negativ" | "bedingt" | "nicht geeignet";
export type Eligibility = { rating: Rating; reason: string; afterHydrolysis?: { rating: Rating; reason: string } };

export type Profile = {
  label: string;
  kind: "mono" | "glycan" | "polymer";
  ketose: boolean;
  isGlucose: boolean;
  reducing: boolean; // mindestens ein freies reduzierendes Ende (Polymere: nur Kettenenden)
  hasFructose: boolean;
  releases: SugarKey[]; // nach vollständiger Hydrolyse
  polymer?: "starch" | "amylose" | "amylopectin" | "glycogen" | "cellulose";
};

export function profileFromSugar(s: Sugar): Profile {
  return { label: s.de, kind: "mono", ketose: s.type === "ketose", isGlucose: s.id === "glucose", reducing: true, hasFructose: s.id === "fructose", releases: [] };
}

export function profileFromGlycan(g: Glycan, label: string): Profile | undefined {
  if (validate(g).length) return undefined;
  const comp = composition(g);
  if (g.residues.length === 1) {
    const s = SUGARS.find((x) => x.id === g.residues[0].sugar);
    return s ? profileFromSugar(s) : undefined;
  }
  const releases = (Object.keys(comp) as SugarKey[]).filter((k) => comp[k] > 0);
  return { label, kind: "glycan", ketose: false, isGlucose: false, reducing: reducingEnds(g).length > 0, hasFructose: comp.fructose > 0, releases };
}

export function profileFromPolymer(id: string): Profile | undefined {
  const p = POLYMERS.find((x) => x.id === id);
  if (!p) return undefined;
  return { label: p.title, kind: "polymer", ketose: false, isGlucose: false, reducing: false, hasFructose: false, releases: ["glucose"], polymer: p.id as Profile["polymer"] };
}

export function profileForName(name: string): Profile | undefined {
  const s = findSugar(name); if (s) return profileFromSugar(s);
  const k = findGlycan(name); if (k) return profileFromGlycan(k.glycan, k.de);
  const p = findPolymer(name); if (p) return profileFromPolymer(p.id);
  return undefined;
}

export const ALL_PROFILES: { key: string; profile: Profile }[] = [
  ...SUGARS.map((s) => ({ key: `s:${s.id}`, profile: profileFromSugar(s) })),
  ...KNOWN.map((k) => ({ key: `g:${k.id}`, profile: profileFromGlycan(k.glycan, k.de)! })),
  ...POLYMERS.map((p) => ({ key: `p:${p.id}`, profile: profileFromPolymer(p.id)! })),
];

const names = (p: Profile) => p.releases.map((k) => SUGAR_DE[k]).join(" und ");
const hasGlc = (p: Profile) => p.releases.includes("glucose");

/** Erwartetes Ergebnis bzw. Eignung eines Tests für ein Profil unter kontrollierten Schulbedingungen. */
export function evaluate(test: TestId, p: Profile): Eligibility {
  const E = (rating: Rating, reason: string, after?: Eligibility["afterHydrolysis"]): Eligibility => ({ rating, reason, afterHydrolysis: after });
  const reducingTest = (): Eligibility => {
    if (p.kind === "mono") return E("positiv", p.ketose ? "Reduzierend; die Ketose reagiert über eine alkalische Umlagerung." : "Freie Aldehydgruppe (über die offene Form) wirkt reduzierend.");
    if (p.kind === "glycan")
      return p.reducing
        ? E("positiv", "Mindestens ein freies reduzierendes Ende ist vorhanden.", { rating: "positiv", reason: `Nach Hydrolyse entstehen reduzierende Monosaccharide (${names(p)}).` })
        : E("negativ", "Alle anomeren C-Atome sind glykosidisch gebunden, es gibt kein reduzierendes Ende. Normalerweise negativ.", { rating: "positiv", reason: `Nach Hydrolyse entstehen reduzierende Monosaccharide (${names(p)}).` });
    return E("negativ", "Reduzierende Enden sind selten; kein charakteristischer Nachweis für dieses Polysaccharid.", { rating: "positiv", reason: "Nach vollständiger Hydrolyse entsteht Glucose." });
  };
  switch (test) {
    case "god":
      if (p.kind === "mono") return p.isGlucose ? E("positiv", "Freie Glucose, der Test ist gezielt dafür.") : E("negativ", "Der Test ist spezifisch für Glucose.");
      return E("negativ", "Keine freie Glucose; der Test erfasst nur freie Glucose.", hasGlc(p) ? { rating: "positiv", reason: "Nach Hydrolyse wird Glucose frei." } : { rating: "negativ", reason: "Bei der Hydrolyse entsteht keine Glucose." });
    case "seliwanoff":
      if (p.kind === "mono") return p.ketose ? E("positiv", "Ketose: schnelle kirschrote Färbung.") : E("bedingt", "Aldose: reagiert langsamer oder schwächer, bei langem Erhitzen ist eine Färbung möglich.");
      if (p.kind === "glycan") return p.hasFructose ? E("bedingt", "Die heiße Säure kann Fructose freisetzen; das Ergebnis hängt von Zeit und Temperatur ab.") : E("negativ", "Keine Ketose enthalten.");
      return E("negativ", "Kein charakteristischer Fructose-Nachweis; keine Ketose enthalten.");
    case "fehling":
    case "benedict":
      return reducingTest();
    case "barfoed":
      if (p.kind === "mono") return E("positiv", "Reduzierendes Monosaccharid: schnelle Reaktion.");
      if (p.kind === "glycan") return p.reducing ? E("bedingt", "Reduzierend, reagiert aber verzögert; bei kurzer kontrollierter Reaktion negativ.") : E("negativ", "Nicht reduzierend. Bei langem Kochen kann Säurehydrolyse ein falsches positives Ergebnis geben.");
      return E("negativ", "Normalerweise nicht schnell positiv.");
    case "iod":
      if (p.kind !== "polymer") return E("negativ", "Keine Amylose-Helix; keine charakteristische Färbung.");
      if (p.polymer === "amylose") return E("positiv", "Amylose bildet Helices: blauschwarze Färbung.");
      if (p.polymer === "starch") return E("positiv", "Charakteristisch positiv, abhängig vom Amylosegehalt.");
      if (p.polymer === "cellulose") return E("negativ", "Keine typische Amylose-Iod-Färbung.");
      return E("bedingt", "Verzweigt mit kurzen Ketten: schwächere, rotviolette bis rotbraune Färbung statt Blauschwarz.");
    case "molisch":
      return E("positiv", "Kohlenhydrat: violetter Ring. Keine Unterscheidung einzelner Zucker.");
    case "bial":
      return E("negativ", "Hexose(n): keine typische blaugrüne Pentose-Färbung.");
    case "hydrolyse":
      if (p.kind === "mono") return E("nicht geeignet", "Keine glykosidische Bindung vorhanden.");
      return E("positiv", `Spaltung setzt ${names(p)} frei.`);
  }
}

