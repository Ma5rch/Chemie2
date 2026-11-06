import { hillFormula } from "./detect";

// Minimale Typen für die benötigten Teile der RDKit.js-API.
export interface RDMol {
  is_valid(): boolean;
  get_smiles(): string;
  get_inchi(): string;
  get_json(): string;
  get_descriptors(): string;
  get_num_atoms(): number;
  get_stereo_tags?: () => string;
  delete(): void;
}
export interface RDModule {
  get_mol(input: string): RDMol | null;
  get_inchikey_for_inchi?: (inchi: string) => string;
}
declare global {
  interface Window {
    initRDKitModule?: (opts?: object) => Promise<RDModule>;
  }
}

let loading: Promise<RDModule> | null = null;

/** Lädt RDKit.js (WebAssembly) einmalig aus /rdkit. Läuft komplett im Browser. */
export function loadRDKit(): Promise<RDModule> {
  if (!loading) {
    loading = new Promise<RDModule>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "/rdkit/RDKit_minimal.js";
      s.onload = () =>
        window.initRDKitModule!({ locateFile: (f: string) => `/rdkit/${f}` }).then(resolve, reject);
      s.onerror = () => reject(new Error("RDKit.js konnte nicht geladen werden."));
      document.head.appendChild(s);
    });
    loading.catch(() => { loading = null; });
  }
  return loading;
}

const SYMBOLS = [
  "", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar",
  "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr",
  "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe",
];

export type LocalAnalysis =
  | { valid: false; empty?: boolean; error: string }
  | {
      valid: true;
      smiles: string;
      inchi?: string;
      inchikey?: string;
      formula?: string;
      charged: boolean;
      mass?: number;
      heavyAtoms: number;
      cipCenters?: number;
    };

function formulaFromJson(json: string): { formula?: string; charged: boolean } {
  try {
    const mol = JSON.parse(json).molecules?.[0];
    if (!mol?.atoms) return { charged: false };
    const counts: Record<string, number> = {};
    let charged = false;
    for (const a of mol.atoms) {
      const sym = SYMBOLS[a.z];
      if (!sym) return { charged: false };
      counts[sym] = (counts[sym] ?? 0) + 1;
      if (a.impHs) counts.H = (counts.H ?? 0) + a.impHs;
      if (a.chg) charged = true;
    }
    return { formula: hillFormula(counts), charged };
  } catch {
    return { charged: false };
  }
}

/** Prüft und berechnet eine Struktur lokal mit RDKit.js (Molfile oder SMILES). */
export async function analyzeLocal(structure: string): Promise<LocalAnalysis> {
  const rd = await loadRDKit();
  let mol: RDMol | null = null;
  try {
    mol = rd.get_mol(structure);
    if (!mol || !mol.is_valid())
      return { valid: false, error: "Die Struktur ist chemisch ungültig oder unvollständig (z. B. Valenzfehler, ungültige Atomkombination)." };
    const heavyAtoms = mol.get_num_atoms();
    if (heavyAtoms === 0) return { valid: false, empty: true, error: "Es ist noch keine Struktur gezeichnet." };

    const smiles = mol.get_smiles();
    const { formula, charged } = formulaFromJson(mol.get_json());
    let mass: number | undefined;
    try { mass = JSON.parse(mol.get_descriptors()).amw; } catch { /* optional */ }
    let inchi: string | undefined, inchikey: string | undefined;
    try {
      inchi = mol.get_inchi() || undefined;
      if (inchi && rd.get_inchikey_for_inchi) inchikey = rd.get_inchikey_for_inchi(inchi);
    } catch { /* InChI optional */ }
    let cipCenters: number | undefined;
    try {
      if (mol.get_stereo_tags) cipCenters = JSON.parse(mol.get_stereo_tags()).CIP_atoms?.length;
    } catch { /* optional */ }
    return { valid: true, smiles, inchi, inchikey, formula, charged, mass, heavyAtoms, cipCenters };
  } catch (e) {
    return { valid: false, error: "RDKit konnte die Struktur nicht verarbeiten: " + (e instanceof Error ? e.message : String(e)) };
  } finally {
    mol?.delete();
  }
}
