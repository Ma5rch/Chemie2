import * as pc from "./pubchem";
import type { Compound } from "./pubchem";
import type { State } from "./state";
import type { LocalAnalysis } from "./rdkit";

export type StructureMatch = {
  /** A = bekanntes Molekül, B = bekanntes Stereoisomer/Anomer (gleiche Verknüpfung), C = unbekannte Struktur */
  category: "A" | "B" | "C";
  state: State;
  compounds: Compound[];
  reasons: string[];
};

/** Gleicht eine gültige, lokal berechnete Struktur mit PubChem ab. Vergibt nie selbst einen Namen. */
export async function matchStructure(local: Extract<LocalAnalysis, { valid: true }>): Promise<StructureMatch> {
  // A: exakte Übereinstimmung inklusive Stereochemie
  if (local.inchi) {
    const exact = await pc.byInchi(local.inchi);
    if (exact.length > 0) {
      const hit = exact[0];
      if (hit.undefinedStereo === 0)
        return {
          category: "A",
          state: "eindeutig",
          compounds: [hit],
          reasons: ["Die Struktur stimmt exakt mit einem PubChem-Eintrag überein, dessen Stereozentren vollständig definiert sind."],
        };
      return {
        category: "A",
        state: "wahrscheinlich",
        compounds: [hit],
        reasons: [
          "Die Struktur stimmt mit einem PubChem-Eintrag überein, aber Stereoelemente sind nicht (vollständig) definiert.",
          "Die räumliche Konfiguration an einem oder mehreren Stereozentren ist nicht vollständig bestimmt.",
        ],
      };
    }
  }
  // B: gleiche Atomverknüpfung, andere oder fehlende Stereochemie
  const cids = await pc.cidsSameConnectivity(local.smiles);
  if (cids.length > 0) {
    return {
      category: "B",
      state: "mehrdeutig",
      compounds: await pc.byCids(cids.slice(0, 6)),
      reasons: [
        "Die Atomverknüpfung stimmt mit bekannten Molekülen überein, die räumliche Konfiguration passt aber zu keinem Eintrag exakt oder ist nicht vollständig angegeben.",
        "Es wird kein Name vergeben. Die Einträge unten sind Stereoisomere oder Anomere mit gleicher Verknüpfung.",
      ],
    };
  }
  // C: unbekannt
  return {
    category: "C",
    state: "unbekannt",
    compounds: [],
    reasons: ["Für diese Struktur wurde kein PubChem-Eintrag gefunden. Es wird kein Name vergeben; angezeigt werden nur berechnete Werte."],
  };
}
