// Selbsttest der Rechen- und Wissenslogik: npm run selftest
// Prüft ohne Browser und ohne Netzwerk die Kernfunktionen gegen die Vorgaben des Pflichtenhefts.
import assert from "node:assert/strict";
import { detectInput } from "../lib/detect";
import { findSugar, haworth } from "../lib/sugars";
import {
  KNOWN, findGlycan, formulaOf, formulaString, hydrolyze, matchKnown, molarMass, parseGlycan, reducingEnds, systematicName, validate,
} from "../lib/glycan";
import { ALL_PROFILES, evaluate, type Profile } from "../lib/profile";
import { identify, type Entry } from "../lib/identify";
import { TOPICS, generate } from "../lib/quiz";
import { buildItems, PAIRS, compareRows } from "../lib/compare";

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log("  ✓", name); };
const profile = (key: string): Profile => ALL_PROFILES.find((p) => p.key === key)!.profile;

console.log("Eingabeerkennung");
test("Name, Formel (Hill-Notation), SMILES, InChI", () => {
  assert.equal(detectInput("Glucose").kind, "name");
  assert.deepEqual(detectInput("H12C6O6"), { kind: "formula", value: "C6H12O6" });
  assert.equal(detectInput("C12H22O11").kind, "formula");
  assert.equal(detectInput("OCC1OC(O)C(O)C(O)C1O").kind, "smiles");
  assert.equal(detectInput("InChI=1S/CH4/h1H4").kind, "inchi");
  assert.equal(detectInput("D-Glucose").kind, "name");
});

console.log("Glykane");
test("Summenformeln (Kondensation, -H2O je Bindung)", () => {
  for (const id of ["maltose", "lactose", "sucrose", "cellobiose", "isomaltose", "trehalose"]) assert.equal(formulaString(formulaOf(findGlycan(id)!.glycan)), "C12H22O11", id);
  for (const id of ["raffinose", "maltotriose"]) assert.equal(formulaString(formulaOf(findGlycan(id)!.glycan)), "C18H32O16", id);
});
test("Systematischer Name der Saccharose wie in der Vorgabe", () => {
  assert.equal(systematicName(findGlycan("sucrose")!.glycan), "α-D-Glucopyranosyl-(1→2)-β-D-fructofuranosid");
});
test("Reduzierende Enden: Maltose, Lactose, Maltotriose 1; Saccharose, Raffinose 0", () => {
  const n = (id: string) => reducingEnds(findGlycan(id)!.glycan).length;
  assert.deepEqual(["maltose", "lactose", "maltotriose", "sucrose", "raffinose"].map(n), [1, 1, 1, 0, 0]);
});
test("Alle Wissensbasis-Einträge sind gültig und eindeutig", () => {
  for (const k of KNOWN) { assert.deepEqual(validate(k.glycan), [], k.id); assert.equal(matchKnown(k.glycan)?.id, k.id); }
});
test("Hydrolyse erhält die Masse (Produkte = Edukt + n × H2O)", () => {
  const water = molarMass({ H: 2, O: 1 });
  for (const k of KNOWN) {
    const g = k.glycan;
    const sum = hydrolyze(g, g.links).reduce((s, f) => s + f.mass, 0);
    assert.ok(Math.abs(sum - (molarMass(formulaOf(g)) + g.links.length * water)) < 1e-6, k.id);
  }
});
test("Gespeicherte Glykane werden streng geprüft", () => {
  const g = findGlycan("maltotriose")!.glycan;
  assert.ok(parseGlycan(JSON.stringify(g)));
  assert.equal(parseGlycan(JSON.stringify({ ...g, links: [...g.links, { donor: "c", acceptor: "a", donorPos: 1, acceptorPos: 2 }] })), null);
  assert.equal(parseGlycan("kein json"), null);
});

console.log("Haworth-Stereochemie (D-Reihe)");
test("β-Glucose: OH an C1 oben, C2 unten, C3 oben, C4 unten; Galactose C4 oben; Mannose C2 oben", () => {
  const b = haworth(findSugar("glucose")!, "pyranose", "beta");
  assert.deepEqual([b[1].up, b[2].down, b[3].up, b[4].down, b[5].up], ["OH", "OH", "OH", "OH", "CH2OH"]);
  assert.equal(haworth(findSugar("galactose")!, "pyranose", "beta")[4].up, "OH");
  assert.equal(haworth(findSugar("mannose")!, "pyranose", "beta")[2].up, "OH");
  assert.equal(haworth(findSugar("glucose")!, "pyranose", "alpha")[1].down, "OH");
});

console.log("Nachweisreaktionen (Ergebnismatrix aus dem Pflichtenheft)");
test("Glucose, Fructose, Galactose, Saccharose, Stärke", () => {
  const want: Record<string, Record<string, string>> = {
    "s:glucose": { iod: "negativ", god: "positiv", seliwanoff: "bedingt", fehling: "positiv", benedict: "positiv", barfoed: "positiv", molisch: "positiv" },
    "s:fructose": { iod: "negativ", god: "negativ", seliwanoff: "positiv", fehling: "positiv", benedict: "positiv", barfoed: "positiv", molisch: "positiv" },
    "s:galactose": { iod: "negativ", god: "negativ", seliwanoff: "bedingt", fehling: "positiv", benedict: "positiv", barfoed: "positiv", molisch: "positiv" },
    "g:sucrose": { iod: "negativ", god: "negativ", seliwanoff: "bedingt", fehling: "negativ", benedict: "negativ", barfoed: "negativ", molisch: "positiv" },
    "p:starch": { iod: "positiv", god: "negativ", seliwanoff: "negativ", fehling: "negativ", benedict: "negativ", barfoed: "negativ", molisch: "positiv" },
  };
  for (const [key, tests] of Object.entries(want)) for (const [t, r] of Object.entries(tests)) assert.equal(evaluate(t as never, profile(key)).rating, r, `${key} ${t}`);
});
test("Saccharose: Fehling direkt negativ, nach Hydrolyse positiv", () => {
  const e = evaluate("fehling", profile("g:sucrose"));
  assert.equal(e.rating, "negativ");
  assert.equal(e.afterHydrolysis?.rating, "positiv");
});

console.log("Identifikator");
const five = ["s:glucose", "p:starch", "s:fructose", "g:sucrose", "s:galactose"].map((k) => ({ key: k, profile: profile(k) }));
const E = (test: Entry["test"], obs: Entry["obs"], hydrolysed = false): Entry => ({ test, obs, hydrolysed });
test("Eingrenzung bis Fructose bzw. Galactose bzw. Saccharose", () => {
  assert.deepEqual(identify(five, [E("iod", "neg"), E("fehling", "pos"), E("seliwanoff", "pos")]).remaining.map((c) => c.key), ["s:fructose"]);
  assert.deepEqual(identify(five, [E("iod", "neg"), E("fehling", "pos"), E("seliwanoff", "neg"), E("god", "neg")]).remaining.map((c) => c.key), ["s:galactose"]);
  assert.deepEqual(identify(five, [E("iod", "neg"), E("fehling", "neg"), E("seliwanoff", "pos")]).remaining.map((c) => c.key), ["g:sucrose"]);
});
test("Widersprüche führen zu keiner Identifizierung", () => {
  const o = identify(five, [E("iod", "pos"), E("molisch", "neg")]);
  assert.equal(o.remaining.length, 0);
  assert.ok(o.contradiction);
});

console.log("Lernmodus");
test("Alle Aufgaben haben eindeutige Optionen und eine gültige Antwort", () => {
  for (const t of TOPICS) for (let seed = 1; seed <= 200; seed++) {
    const q = generate(t.id, seed);
    assert.equal(new Set(q.options).size, q.options.length, `${t.id} ${seed}`);
    assert.ok(q.correct >= 0 && q.correct < q.options.length && q.options.length >= 2 && q.explanation.length > 10, `${t.id} ${seed}`);
  }
});

console.log("Vergleich");
test("Die sieben Standardpaare lassen sich vergleichen und unterscheiden sich", () => {
  const items = buildItems();
  for (const p of PAIRS) {
    const chosen = p.keys.map((k) => items.find((i) => i.key === k)!);
    assert.ok(chosen.every(Boolean), p.label);
    assert.ok(compareRows(chosen).some((r) => r.differs), p.label);
  }
});

console.log(`\n${passed} Testgruppen bestanden.`);
