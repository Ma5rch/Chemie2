// Konfigurationsmodell für D-Monosaccharide (Lehrbuchwissen, keine Datenbankwerte).
// Fischer-Projektion: "R" = OH rechts, "L" = OH links.
// Aldosen: Stereozentren C2..C5. Ketosen: C3..C5.
// Haworth (D-Reihe, Ringsauerstoff hinten rechts): OH rechts in Fischer -> unten, links -> oben.
export type Ring = "open" | "pyranose" | "furanose";
export type Anomer = "alpha" | "beta";
export type Side = "R" | "L";

export type Sugar = {
  id: string;
  de: string;
  en: string;
  type: "aldose" | "ketose";
  fischer: Side[];
  rings: Ring[];
  aliases: string[];
};

export const SUGARS: Sugar[] = [
  { id: "glucose", de: "D-Glucose", en: "D-glucose", type: "aldose", fischer: ["R", "L", "R", "R"], rings: ["open", "pyranose"], aliases: ["glucose", "glukose", "d-glucose", "d-glukose", "traubenzucker"] },
  { id: "galactose", de: "D-Galactose", en: "D-galactose", type: "aldose", fischer: ["R", "L", "L", "R"], rings: ["open", "pyranose"], aliases: ["galactose", "galaktose", "d-galactose", "d-galaktose"] },
  { id: "mannose", de: "D-Mannose", en: "D-mannose", type: "aldose", fischer: ["L", "L", "R", "R"], rings: ["open", "pyranose"], aliases: ["mannose", "d-mannose"] },
  { id: "fructose", de: "D-Fructose", en: "D-fructose", type: "ketose", fischer: ["L", "R", "R"], rings: ["open", "furanose"], aliases: ["fructose", "fruktose", "d-fructose", "d-fruktose", "fruchtzucker"] },
];

export function findSugar(input: string): Sugar | undefined {
  const q = input.trim().toLowerCase();
  return SUGARS.find((s) => s.aliases.includes(q));
}

export type Substituents = Record<number, { up: string; down: string }>;

/** Bestimmt für jedes Ringatom, welche Gruppe oben und welche unten steht. */
export function haworth(s: Sugar, ring: Exclude<Ring, "open">, anomer: Anomer): Substituents {
  const place = (side: Side) => (side === "R" ? { up: "H", down: "OH" } : { up: "OH", down: "H" });
  const out: Substituents = {};
  if (s.type === "aldose") {
    if (ring !== "pyranose") throw new Error("Furanose von Aldohexosen ist noch nicht implementiert.");
    // C1 (anomer): alpha = OH entgegengesetzt zu CH2OH (unten), beta = OH auf derselben Seite (oben)
    out[1] = anomer === "alpha" ? { up: "H", down: "OH" } : { up: "OH", down: "H" };
    s.fischer.slice(0, 3).forEach((side, i) => { out[i + 2] = place(side); });
    out[5] = { up: "CH2OH", down: "H" };
  } else {
    if (ring !== "furanose") throw new Error("Pyranose der Ketohexosen ist noch nicht implementiert.");
    // C2 (anomer): alpha = OH unten, CH2OH (C1) oben; beta = OH oben, CH2OH unten
    out[2] = anomer === "alpha" ? { up: "CH2OH", down: "OH" } : { up: "OH", down: "CH2OH" };
    out[3] = place(s.fischer[0]);
    out[4] = place(s.fischer[1]);
    out[5] = { up: "CH2OH", down: "H" };
  }
  return out;
}

/** Name für den PubChem-Abgleich (nur zur Gegenprüfung, nicht als Quelle der Darstellung). */
export function pubchemName(s: Sugar, ring: Ring, anomer: Anomer): string {
  const base = s.en.replace("D-", "");
  if (ring === "open") return s.type === "aldose" ? `aldehydo-D-${base}` : `keto-D-${base}`;
  return `${anomer}-D-${base.replace(/ose$/, "o")}${ring}`;
}
