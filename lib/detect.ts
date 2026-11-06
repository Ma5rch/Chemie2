const ELEMENTS = new Set(
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr".split(" ")
);

export type InputKind = "inchi" | "smiles" | "formula" | "name";
export type Detected = { kind: InputKind; value: string };

/** Zerlegt eine Summenformel; null, wenn sie keine gültige Formel ist. */
export function parseFormula(s: string): Record<string, number> | null {
  const re = /([A-Z][a-z]?)(\d*)/g;
  const counts: Record<string, number> = {};
  let consumed = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index !== consumed || !ELEMENTS.has(m[1])) return null;
    consumed += m[0].length;
    counts[m[1]] = (counts[m[1]] ?? 0) + (m[2] ? parseInt(m[2], 10) : 1);
  }
  return consumed === s.length && s.length > 0 ? counts : null;
}

/** Hill-Notation (C, H, dann alphabetisch). */
export function hillFormula(counts: Record<string, number>): string {
  const keys = Object.keys(counts);
  const rest = keys.filter((k) => k !== "C" && k !== "H").sort();
  const order = counts.C ? ["C", ...(counts.H ? ["H"] : []), ...rest] : keys.sort();
  return order.map((k) => k + (counts[k] > 1 ? counts[k] : "")).join("");
}

export function detectInput(raw: string): Detected {
  const s = raw.trim();
  if (/^InChI=/i.test(s)) return { kind: "inchi", value: s };

  const smilesChars = /^[A-Za-z0-9@+\-\[\]()\\/=#$:.%]+$/.test(s);
  const looksSmiles =
    smilesChars &&
    (/[=#\[\]@/\\]/.test(s) || (/\d/.test(s) && /[()]/.test(s))) &&
    !/[a-z]{3,}/.test(s.replace(/c/g, "").replace(/n/g, ""));
  if (looksSmiles) return { kind: "smiles", value: s };

  const counts = parseFormula(s);
  const hasDigit = /\d/.test(s);
  if (counts && (hasDigit || Object.keys(counts).length === 1) && /^[A-Z]/.test(s)) {
    return { kind: "formula", value: hillFormula(counts) };
  }
  return { kind: "name", value: s };
}
