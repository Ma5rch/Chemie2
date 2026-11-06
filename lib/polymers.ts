// Natürliche Polymere haben keine einheitliche Summenformel und keine feste Kette.
// Daher wird hier nur dokumentiertes Strukturwissen gezeigt – keine erfundene Molekülkette.
export type KnowledgeState = "bekannt" | "variabel" | "unbekannt";
export type PolymerEntry = {
  id: string;
  names: string[];
  title: string;
  kind: string;
  facts: { label: string; value: string; state: KnowledgeState }[];
  note: string;
  /** Optional: Wiederholungseinheit für die Modellrechnung. */
  model?: { repeat: string; branched: boolean };
};

const unknownChain = {
  label: "Kettenlänge der konkreten Probe",
  value: "nicht bekannt",
  state: "unbekannt" as const,
};

export const POLYMERS: PolymerEntry[] = [
  {
    id: "starch",
    names: ["stärke", "staerke", "starch"],
    title: "Stärke",
    kind: "Polysaccharid, Gemisch aus Amylose und Amylopektin",
    facts: [
      { label: "Baustein", value: "α-D-Glucose", state: "bekannt" },
      { label: "Zusammensetzung", value: "Amylose und Amylopektin (Verhältnis variiert)", state: "variabel" },
      { label: "Bindungen", value: "α-(1→4); an Verzweigungen α-(1→6)", state: "bekannt" },
      unknownChain,
      { label: "Verzweigungsstruktur der Probe", value: "nicht bekannt", state: "unbekannt" },
    ],
    note: "Stärke besteht aus Amylose und Amylopektin. Die exakte Zusammensetzung, Kettenlänge und Verzweigungsstruktur der konkreten Probe ist nicht bekannt. Es gibt keine universelle Summenformel.",
  },
  {
    id: "amylose",
    names: ["amylose"],
    title: "Amylose",
    kind: "Polysaccharid, überwiegend unverzweigt",
    facts: [
      { label: "Baustein", value: "α-D-Glucose", state: "bekannt" },
      { label: "Bindungen", value: "hauptsächlich α-(1→4)", state: "bekannt" },
      { label: "Raumstruktur", value: "kann eine Helix bilden", state: "bekannt" },
      unknownChain,
    ],
    note: "Die Kettenlänge ist variabel; es wird keine feste Struktur erzeugt.",
    model: { repeat: "[→4)-α-D-Glcp-(1→]n", branched: false },
  },
  {
    id: "amylopectin",
    names: ["amylopektin", "amylopectin"],
    title: "Amylopektin",
    kind: "Polysaccharid, verzweigt",
    facts: [
      { label: "Baustein", value: "α-D-Glucose", state: "bekannt" },
      { label: "Bindungen", value: "α-(1→4) in den Ketten, α-(1→6) an Verzweigungen", state: "bekannt" },
      unknownChain,
      { label: "Verzweigungsstruktur der Probe", value: "nicht bekannt", state: "unbekannt" },
    ],
    note: "Verzweigungsgrad und Kettenlängen variieren; es wird keine feste Struktur erzeugt.",
    model: { repeat: "Ketten aus [→4)-α-D-Glcp-(1→]n, Verzweigungen über α-(1→6)", branched: true },
  },
  {
    id: "glycogen",
    names: ["glykogen", "glycogen"],
    title: "Glykogen",
    kind: "Polysaccharid, stark verzweigt, Energiespeicher",
    facts: [
      { label: "Baustein", value: "α-D-Glucose", state: "bekannt" },
      { label: "Bindungen", value: "α-(1→4); Verzweigungen α-(1→6)", state: "bekannt" },
      unknownChain,
    ],
    note: "Der Verzweigungsgrad der konkreten Probe ist nicht bekannt.",
    model: { repeat: "Ketten aus [→4)-α-D-Glcp-(1→]n, Verzweigungen über α-(1→6)", branched: true },
  },
  {
    id: "cellulose",
    names: ["cellulose", "zellulose"],
    title: "Cellulose",
    kind: "Polysaccharid, linear, Bestandteil der pflanzlichen Zellwand",
    facts: [
      { label: "Baustein", value: "β-D-Glucose", state: "bekannt" },
      { label: "Bindungen", value: "β-(1→4)", state: "bekannt" },
      { label: "Zwischen den Ketten", value: "Wasserstoffbrücken", state: "bekannt" },
      unknownChain,
    ],
    note: "Die Kettenlänge ist variabel; es wird keine feste Struktur erzeugt.",
    model: { repeat: "[→4)-β-D-Glcp-(1→]n", branched: false },
  },
];

export function findPolymer(input: string): PolymerEntry | undefined {
  const q = input.trim().toLowerCase();
  return POLYMERS.find((p) => p.names.includes(q));
}
