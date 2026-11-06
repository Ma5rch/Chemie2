// Lernmodus: Aufgaben werden deterministisch aus dem Wissensmodell der App erzeugt (keine KI, keine Kosten).
// Richtige Antworten und Erklärungen werden aus denselben Daten berechnet wie die übrigen Seiten.
import { SUGARS, haworth, type Anomer, type Sugar } from "./sugars";
import { KNOWN, addCounts, condensed, formulaOf, formulaString, reducingEnds } from "./glycan";
import { TESTS, TEST_BY_ID } from "./tests";
import { ALL_PROFILES } from "./profile";
import { ID_TESTS, OBS_LABELS, allowedObs, identify, type Entry } from "./identify";
import { sub } from "./format";
import type { Visual } from "./compare";

export type Topic = "struktur" | "formel" | "isomere" | "projektion" | "anomere" | "bindungen" | "polysaccharide" | "nachweise" | "ergebnisse";
export const TOPICS: { id: Topic; label: string }[] = [
  { id: "struktur", label: "Moleküle erkennen" },
  { id: "formel", label: "Summenformeln" },
  { id: "isomere", label: "Isomere unterscheiden" },
  { id: "projektion", label: "Fischer und Haworth" },
  { id: "anomere", label: "α- und β-Anomere" },
  { id: "bindungen", label: "Glykosidische Bindungen" },
  { id: "polysaccharide", label: "Polysaccharide" },
  { id: "nachweise", label: "Nachweisreaktionen zuordnen" },
  { id: "ergebnisse", label: "Testergebnisse interpretieren" },
];

export type Question = { topic: Topic; prompt: string; visuals: Visual[]; options: string[]; correct: number; explanation: string };

export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type R = () => number;
const pick = <T,>(r: R, a: T[]): T => a[Math.floor(r() * a.length)];
function shuffle<T>(r: R, a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
function build(r: R, base: Omit<Question, "options" | "correct" | "visuals"> & { visuals?: Visual[] }, correct: string, distractors: string[], max = 4): Question {
  const uniq = shuffle(r, [...new Set(distractors.filter((d) => d !== correct))]).slice(0, max - 1);
  const options = shuffle(r, [correct, ...uniq]);
  return { ...base, visuals: base.visuals ?? [], options, correct: options.indexOf(correct) };
}

const sym = (a: string) => (a === "alpha" ? "α" : "β");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const formName = (s: Sugar, ring: string, a: Anomer) => `${sym(a)}-D-${cap(s.id.replace(/ose$/, "o") + ring)}`;
const aldoses = SUGARS.filter((s) => s.type === "aldose");
const ringOf = (s: Sugar) => (s.type === "aldose" ? "pyranose" : "furanose") as "pyranose" | "furanose";
const epimerPos = (a: Sugar, b: Sugar): number | null => {
  const diff = a.fischer.map((x, i) => (x !== b.fischer[i] ? i : -1)).filter((i) => i >= 0);
  return diff.length === 1 ? diff[0] + (a.type === "aldose" ? 2 : 3) : null;
};

// ---------- Generatoren ----------
function qStruktur(r: R): Question {
  if (r() < 0.5) {
    const s = pick(r, SUGARS);
    return build(r, {
      topic: "struktur", prompt: "Welcher Zucker ist hier als Fischer-Projektion (offenkettig) gezeichnet?", visuals: [{ type: "fischer", sugar: s }],
      explanation: `${s.de} ist eine ${s.type === "aldose" ? "Aldose (Aldehydgruppe an C1)" : "Ketose (Ketogruppe an C2)"}. Die OH-Gruppen an ${s.type === "aldose" ? "C2–C5" : "C3–C5"} stehen: ${s.fischer.map((x) => (x === "R" ? "rechts" : "links")).join(", ")}.`,
    }, s.de, SUGARS.filter((x) => x.id !== s.id).map((x) => x.de));
  }
  const k = pick(r, KNOWN);
  return build(r, {
    topic: "struktur", prompt: "Welches Oligosaccharid zeigt dieses Schema? Farben (SNFG): blau = Glucose, gelb = Galactose, grün = Fructose. Die Beschriftung an den Linien gibt Konfiguration und Bindungsstelle an.",
    visuals: [{ type: "glycan", glycan: k.glycan }],
    explanation: `${k.de}: ${condensed(k.glycan)}.`,
  }, k.de, KNOWN.filter((x) => x.id !== k.id).map((x) => x.de));
}

function qFormel(r: R): Question {
  const k = pick(r, KNOWN);
  const g = k.glycan, n = g.residues.length;
  const correct = sub(formulaString(formulaOf(g)));
  const hex = { C: 6, H: 12, O: 6 };
  const noLoss = sub(formulaString(addCounts({}, hex, n)));
  const tooMuch = sub(formulaString(addCounts(addCounts({}, hex, n), { H: 2, O: 1 }, -n)));
  const others = KNOWN.map((x) => sub(formulaString(formulaOf(x.glycan)))).concat(sub(formulaString(hex)));
  return build(r, {
    topic: "formel", prompt: `Welche Summenformel hat ${k.de}?`,
    explanation: `${n} Monosaccharide (je C₆H₁₂O₆) ergeben ${sub(formulaString(addCounts({}, hex, n)))}. ${n - 1 === 1 ? "Die glykosidische Bindung entsteht" : `Jede der ${n - 1} glykosidischen Bindungen entsteht`} durch Kondensation und spaltet ein Wasser ab. Ergebnis: ${correct}.`,
  }, correct, [noLoss, tooMuch, ...others]);
}

const EPI_OPTIONS = ["Anomere", "Epimere an C2", "Epimere an C4", "Konstitutionsisomere (Aldose und Ketose)"];
function qIsomere(r: R): Question {
  if (r() < 0.65) {
    const glc = SUGARS[0];
    const variants: { a: Visual; b: Visual; correct: string; why: string }[] = [
      { a: { type: "fischer", sugar: glc }, b: { type: "fischer", sugar: SUGARS[3] }, correct: "Konstitutionsisomere (Aldose und Ketose)", why: "Beide haben die Summenformel C₆H₁₂O₆, aber unterschiedliche funktionelle Gruppen: Glucose ist eine Aldose, Fructose eine Ketose." },
      { a: { type: "fischer", sugar: glc }, b: { type: "fischer", sugar: SUGARS[1] }, correct: `Epimere an C${epimerPos(glc, SUGARS[1])}`, why: "Beide sind Aldohexosen und unterscheiden sich in der Konfiguration an genau einem Stereozentrum." },
      { a: { type: "fischer", sugar: glc }, b: { type: "fischer", sugar: SUGARS[2] }, correct: `Epimere an C${epimerPos(glc, SUGARS[2])}`, why: "Beide sind Aldohexosen und unterscheiden sich in der Konfiguration an genau einem Stereozentrum." },
      { a: { type: "haworth", sugar: glc, ring: "pyranose", anomer: "alpha" }, b: { type: "haworth", sugar: glc, ring: "pyranose", anomer: "beta" }, correct: "Anomere", why: "α- und β-D-Glucopyranose unterscheiden sich nur in der Konfiguration am anomeren C1 (Ringschluss)." },
    ];
    const v = pick(r, variants);
    return build(r, { topic: "isomere", prompt: "Wie stehen die beiden dargestellten Zucker zueinander?", visuals: [v.a, v.b], explanation: v.why }, v.correct, EPI_OPTIONS);
  }
  const base = pick(r, KNOWN.filter((k) => k.glycan.residues.length === 2));
  const f = (x: typeof KNOWN[number]) => formulaString(formulaOf(x.glycan));
  const iso = KNOWN.filter((x) => x.id !== base.id && f(x) === f(base));
  const non = KNOWN.filter((x) => f(x) !== f(base));
  const correct = pick(r, iso);
  return build(r, {
    topic: "isomere", prompt: `Welcher Stoff ist ein Isomer von ${base.de}?`,
    explanation: `${base.de} und ${correct.de} haben beide die Summenformel ${sub(f(base))}, unterscheiden sich aber in Bausteinen oder Bindung. ${non.slice(0, 2).map((x) => `${x.de} hat ${sub(f(x))}`).join("; ")}; ein einzelner Zucker hat C₆H₁₂O₆.`,
  }, correct.de, [...non.map((x) => x.de), "D-Glucose", "D-Fructose"]);
}

function qProjektion(r: R): Question {
  if (r() < 0.5) {
    const glc = SUGARS[0], other = pick(r, [SUGARS[1], SUGARS[2]]);
    const pos = epimerPos(glc, other)!;
    return build(r, {
      topic: "projektion", prompt: `Wie unterscheiden sich D-Glucose und ${other.de} in der Fischer-Projektion?`,
      visuals: [{ type: "fischer", sugar: glc }, { type: "fischer", sugar: other }],
      explanation: `Nur an C${pos} steht die OH-Gruppe auf der anderen Seite. Alle übrigen Stereozentren stimmen überein.`,
    }, `Nur an C${pos} steht OH auf der anderen Seite`, [2, 3, 4, 5].map((p) => `Nur an C${p} steht OH auf der anderen Seite`));
  }
  const s = pick(r, aldoses), c = pick(r, [2, 3, 4]);
  const up = haworth(s, "pyranose", "beta")[c].up === "OH";
  return build(r, {
    topic: "projektion", prompt: `Auf welcher Seite des Rings steht die OH-Gruppe an C${c} der β-D-${cap(s.id.replace(/ose$/, "o"))}pyranose (Haworth-Projektion)?`,
    explanation: `In der Fischer-Projektion steht die OH-Gruppe an C${c} ${s.fischer[c - 2] === "R" ? "rechts" : "links"}. Bei D-Zuckern gilt für die Haworth-Darstellung: rechts wird unten, links wird oben. Also steht sie ${up ? "oben" : "unten"}.`,
  }, up ? "Oben" : "Unten", ["Oben", "Unten"], 2);
}

function qAnomere(r: R): Question {
  const s = pick(r, SUGARS), ring = ringOf(s), a = pick(r, ["alpha", "beta"] as Anomer[]);
  const other = pick(r, SUGARS.filter((x) => x.id !== s.id));
  const c = s.type === "aldose" ? "C1" : "C2";
  return build(r, {
    topic: "anomere", prompt: "Welche Form ist in der Haworth-Projektion dargestellt?", visuals: [{ type: "haworth", sugar: s, ring, anomer: a }],
    explanation: `Bei D-Zuckern steht in der α-Form die OH-Gruppe am anomeren ${c} entgegengesetzt zur CH2OH-Gruppe an C5 (unten), in der β-Form auf derselben Seite (oben). Hier steht sie ${a === "alpha" ? "unten, also α" : "oben, also β"}.`,
  }, formName(s, ring, a), [formName(s, ring, a === "alpha" ? "beta" : "alpha"), formName(other, ringOf(other), a), formName(other, ringOf(other), a === "alpha" ? "beta" : "alpha")]);
}

function qBindungen(r: R): Question {
  if (r() < 0.55) {
    const k = pick(r, KNOWN.filter((x) => x.glycan.residues.length === 2));
    const l = k.glycan.links[0];
    const donor = k.glycan.residues.find((x) => x.id === l.donor)!;
    const label = (an: string, d: number, ac: number) => `${sym(an)}-(${d}→${ac})`;
    const correct = label(donor.anomer, l.donorPos, l.acceptorPos);
    const all: string[] = [];
    for (const an of ["alpha", "beta"]) for (const pos of [1, 2, 4, 6]) all.push(label(an, 1, pos));
    return build(r, {
      topic: "bindungen", prompt: `Welche glykosidische Bindung verknüpft die beiden Bausteine in ${k.de}?`,
      explanation: `${k.de}: ${condensed(k.glycan)}. Gelesen wird von der Konfiguration des Donors (α oder β), dem anomeren C-Atom des Donors und dem C-Atom des Akzeptors.`,
    }, correct, all);
  }
  const k = pick(r, KNOWN);
  const red = reducingEnds(k.glycan).length;
  return build(r, {
    topic: "bindungen", prompt: "Hat dieses Oligosaccharid ein reduzierendes Ende? Tipp: Ein reduzierendes Ende hat ein anomeres C-Atom, das nicht gebunden ist.", visuals: [{ type: "glycan", glycan: k.glycan }],
    explanation: `${k.de}: ${red ? "Das anomere C-Atom des Wurzelbausteins ist frei, daher ein reduzierendes Ende." : "Alle anomeren C-Atome sind glykosidisch gebunden, daher nicht reduzierend."}`,
  }, red ? "Ja, ein reduzierendes Ende" : "Nein, nicht reduzierend", ["Ja, ein reduzierendes Ende", "Nein, nicht reduzierend"], 2);
}

const POLY_DESC: Record<string, { name: string; text: string }> = {
  starch: { name: "Stärke", text: "Gemisch aus zwei Polysacchariden, aufgebaut aus α-D-Glucose" },
  amylose: { name: "Amylose", text: "α-D-Glucose mit α-(1→4)-Bindungen, überwiegend unverzweigt, kann eine Helix bilden" },
  amylopectin: { name: "Amylopektin", text: "α-D-Glucose mit α-(1→4)- und α-(1→6)-Bindungen, verzweigt, neben Amylose Bestandteil der Stärke" },
  glycogen: { name: "Glykogen", text: "α-D-Glucose mit α-(1→4)- und α-(1→6)-Bindungen, stark verzweigt, Energiespeicher" },
  cellulose: { name: "Cellulose", text: "β-D-Glucose mit β-(1→4)-Bindungen, lineare Ketten, Bestandteil der pflanzlichen Zellwand" },
};
function qPoly(r: R): Question {
  const id = pick(r, Object.keys(POLY_DESC));
  const d = POLY_DESC[id];
  return build(r, {
    topic: "polysaccharide", prompt: `Welches Polysaccharid wird beschrieben? ${d.text}.`,
    explanation: `${d.name}: ${d.text}. Natürliche Polysaccharide haben keine einheitliche Kettenlänge; die Angaben beschreiben das Bauprinzip.`,
  }, d.name, Object.keys(POLY_DESC).filter((k) => k !== id).map((k) => POLY_DESC[k].name));
}

function qNachweise(r: R): Question {
  if (r() < 0.6) {
    const pool = TESTS.filter((t) => !["benedict", "hydrolyse"].includes(t.id));
    const t = pick(r, pool);
    return build(r, {
      topic: "nachweise", prompt: `Welche Nachweisreaktion passt zu diesem Zweck? „${t.purpose}“`,
      explanation: `${t.name}: ${t.principle} Sie weist ${t.scope === "Molekül" ? "ein bestimmtes Molekül" : "eine Stoffgruppe"} nach: ${t.scopeText}`,
    }, t.name, pool.filter((x) => x.id !== t.id).map((x) => x.name));
  }
  const ids = ["seliwanoff", "iod", "molisch", "bial"] as const;
  const t = TEST_BY_ID[pick(r, [...ids])];
  return build(r, {
    topic: "nachweise", prompt: `Welche Beobachtung ist für ein positives Ergebnis der ${t.name} typisch?`,
    explanation: `${t.name}: ${t.colour} ${t.principle}`,
  }, t.colour, ids.filter((x) => x !== t.id).map((x) => TEST_BY_ID[x].colour));
}

const FIVE = ["s:glucose", "p:starch", "s:fructose", "g:sucrose", "s:galactose"].map((k) => ALL_PROFILES.find((p) => p.key === k)!);
function qErgebnisse(r: R): Question {
  for (let attempt = 0; attempt < 60; attempt++) {
    const target = pick(r, FIVE);
    const tests = shuffle(r, ID_TESTS).slice(0, 2 + Math.floor(r() * 2));
    const entries: Entry[] = [];
    for (const t of tests) {
      const { set } = allowedObs(t, target.profile, false);
      if (set.size === 1) entries.push({ test: t, obs: [...set][0], hydrolysed: false });
    }
    if (entries.length < 2) continue;
    const out = identify(FIVE, entries);
    if (out.remaining.length !== 1 || out.remaining[0].key !== target.key) continue;
    const text = entries.map((e) => `${TEST_BY_ID[e.test].name}: ${OBS_LABELS[e.test][e.obs]}`).join("; ");
    const why = out.excluded.map((x) => `${x.cand.profile.label}: ${x.reasons[0].split(". ")[0]}`).join(" | ");
    return build(r, {
      topic: "ergebnisse", prompt: `Eine unbekannte Probe ist Glucose, Stärke, Fructose, Saccharose oder Galactose. Ergebnisse: ${text}. Welcher Stoff ist am wahrscheinlichsten?`,
      explanation: `Übrig bleibt ${target.profile.label}. Ausgeschlossen: ${why}. Das gilt nur innerhalb der Kandidatenliste und unter kontrollierten Bedingungen.`,
    }, target.profile.label, FIVE.map((p) => p.profile.label), 4);
  }
  throw new Error("Keine eindeutige Aufgabe gefunden.");
}

const GEN: Record<Topic, (r: R) => Question> = {
  struktur: qStruktur, formel: qFormel, isomere: qIsomere, projektion: qProjektion, anomere: qAnomere,
  bindungen: qBindungen, polysaccharide: qPoly, nachweise: qNachweise, ergebnisse: qErgebnisse,
};

export function generate(topic: Topic | "mix", seed: number): Question {
  const r = makeRng(seed);
  const t = topic === "mix" ? pick(r, TOPICS).id : topic;
  return GEN[t](r);
}
