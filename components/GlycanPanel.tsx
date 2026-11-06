"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SUGAR_DE, SUGAR_INFO, anomericPos, childrenOf, composition, condensed, depths, formulaOf, formulaString,
  hydrolyze, isFreeAnomeric, matchKnown, molarMass, reducingEnds, systematicName, validate,
  type Glycan, type Linkage, type SugarKey,
} from "@/lib/glycan";
import GlycanSvg from "./GlycanSvg";

const sym = (a: string) => (a === "alpha" ? "α" : a === "beta" ? "β" : "frei");
const linkKey = (l: Linkage) => `${l.donor}>${l.acceptor}:${l.acceptorPos}`;
const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
const sub = (s: string) => s.replace(/\d/g, (d) => SUB[d]);

function fragmentName(g: Glycan): string {
  const known = matchKnown(g);
  if (known) return known.de;
  if (g.residues.length === 1) return `${SUGAR_DE[g.residues[0].sugar]} (${condensed(g)})`;
  return condensed(g);
}

export default function GlycanPanel({
  glycan, title, klass, selectedId, onSelectId,
}: { glycan: Glycan; title?: string; klass?: string; selectedId?: string | null; onSelectId?: (id: string) => void }) {
  const [inner, setInner] = useState<string | null>(null);
  const controlled = onSelectId !== undefined;
  const selected = controlled ? selectedId ?? null : inner;
  const setSelected = (id: string) => (controlled ? onSelectId!(id) : setInner(id));
  const [cut, setCut] = useState<Set<string>>(new Set());
  const errors = useMemo(() => validate(glycan), [glycan]);
  useEffect(() => { setCut(new Set()); if (!controlled) setInner(null); }, [glycan, controlled]);

  if (errors.length) return <p role="alert" className="rounded-xl border border-warn p-3 text-sm text-warn">{errors.join(" ")}</p>;

  const comp = composition(glycan);
  const formula = formulaOf(glycan);
  const red = reducingEnds(glycan);
  const known = matchKnown(glycan);
  const d = depths(glycan);
  const sel = glycan.residues.find((r) => r.id === selected);
  const n = glycan.residues.length;
  const cls = klass ?? (n === 1 ? "Monosaccharid" : n === 2 ? "Disaccharid" : n <= 10 ? "Oligosaccharid" : "Polysaccharid (nach üblicher Einteilung)");
  const fragments = hydrolyze(glycan, glycan.links.filter((l) => cut.has(linkKey(l))));
  const branches = glycan.residues.filter((r) => childrenOf(glycan, r.id).length > 1);
  const total = molarMass(formula);

  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5" aria-label="Glykan-Analyse">
      <h3 className="text-lg font-semibold">{title ?? (known ? known.de : "Eigene Struktur")}</h3>
      <p className="text-sm text-muted">{cls}</p>
      {!known && n > 1 && (
        <p className="mt-2 rounded-xl border border-warn p-3 text-sm text-warn">Keine Übereinstimmung mit einem Eintrag der eingebauten Wissensbasis. Es wird kein Trivialname vergeben, nur berechnete Werte werden gezeigt.</p>
      )}

      <div className="mt-3 overflow-x-auto"><GlycanSvg glycan={glycan} selected={selected} onSelect={(id) => setSelected(id)} /></div>
      <p className="text-xs text-muted">Bausteine anklicken für Details. Farben nach SNFG, zusätzlich mit Kürzel beschriftet.</p>

      {sel && (
        <div className="mt-3 rounded-xl border border-accent p-3 text-sm">
          <p className="font-medium">{sym(sel.anomer) === "frei" ? "" : sym(sel.anomer) + "-"}D-{SUGAR_DE[sel.sugar]}{sel.ring === "pyranose" ? "pyranose" : "furanose"}-Rest</p>
          <ul className="mt-1 list-disc pl-5 text-muted">
            <li>Freies Monosaccharid: {sub(formulaString({ C: 6, H: 12, O: 6 }))}</li>
            <li>Abstand vom Wurzelbaustein: {d[sel.id]} Bindung(en){d[sel.id] === 0 ? " (Wurzelbaustein)" : ""}</li>
            <li>Ringform: {sel.ring === "pyranose" ? "Pyranose" : "Furanose"}; Konfiguration am anomeren C{anomericPos(sel)}: {sym(sel.anomer) === "frei" ? "frei (α/β im Gleichgewicht)" : sym(sel.anomer)}</li>
            <li>{isFreeAnomeric(glycan, sel) ? "Anomeres C-Atom frei: reduzierendes Ende" : "Anomeres C-Atom glykosidisch gebunden"}</li>
            {glycan.links.filter((l) => l.donor === sel.id || l.acceptor === sel.id).map((l) => {
              const other = glycan.residues.find((r) => r.id === (l.donor === sel.id ? l.acceptor : l.donor))!;
              const donor = glycan.residues.find((r) => r.id === l.donor)!;
              return <li key={linkKey(l)}>Bindung {sym(donor.anomer)}-({l.donorPos}→{l.acceptorPos}) {l.donor === sel.id ? "zu" : "von"} {SUGAR_DE[other.sugar]}</li>;
            })}
          </ul>
        </div>
      )}

      <dl className="mt-4 grid gap-x-6 text-sm sm:grid-cols-2">
        {([
          ["Summenformel (berechnet)", sub(formulaString(formula))],
          ["Molare Masse (berechnet)", `${total.toFixed(3)} g/mol`],
          ["Zuckerbausteine", `${n}: ${(Object.keys(comp) as SugarKey[]).filter((k) => comp[k]).map((k) => `${comp[k]}× ${SUGAR_DE[k]}`).join(", ")}`],
          ["Glykosidische Bindungen", `${glycan.links.length} (je 1 H₂O abgespalten)`],
          ["Reduzierende Enden", red.length ? `${red.length} (${red.map((r) => SUGAR_INFO[r.sugar].abbr).join(", ")})` : "0, nicht reduzierend"],
          ["Verzweigungen", branches.length ? String(branches.length) : "keine, linear"],
          ["Kurzschreibweise", condensed(glycan)],
          ["Systematischer Name (generiert)", systematicName(glycan)],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} className="border-b border-line py-2 sm:col-span-1 last:border-0">
            <dt className="text-muted">{k}</dt><dd className="m-0 break-words font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-1 text-xs text-muted">Alle Werte sind berechnet aus dem Baustein- und Bindungsmodell. Namen und Bindungen der bekannten Oligosaccharide stammen aus der eingebauten Wissensbasis, nicht aus einer Datenbankabfrage.</p>

      {glycan.links.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium">Hydrolyse simulieren</h4>
          <ul className="mt-2 grid gap-1 text-sm">
            {glycan.links.map((l) => {
              const dn = glycan.residues.find((r) => r.id === l.donor)!;
              const ac = glycan.residues.find((r) => r.id === l.acceptor)!;
              const k = linkKey(l);
              return (
                <li key={k}>
                  <label className="flex min-h-10 items-center gap-2">
                    <input type="checkbox" className="h-5 w-5" checked={cut.has(k)} onChange={() => { const next = new Set(cut); next.has(k) ? next.delete(k) : next.add(k); setCut(next); }} />
                    {SUGAR_DE[dn.sugar]} {sym(dn.anomer)}-({l.donorPos}→{l.acceptorPos}) {SUGAR_DE[ac.sugar]} spalten
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 flex gap-2">
            <button type="button" onClick={() => setCut(new Set(glycan.links.map(linkKey)))} className="min-h-10 rounded-xl border border-line px-4 text-sm">Alle spalten</button>
            <button type="button" onClick={() => setCut(new Set())} className="min-h-10 rounded-xl border border-line px-4 text-sm">Zurücksetzen</button>
          </div>
          {cut.size > 0 && (
            <div className="mt-3 text-sm">
              <p>Verbrauchtes Wasser: {cut.size} H₂O. Produkte (Gesamtmasse {fragments.reduce((s, f) => s + f.mass, 0).toFixed(3)} g/mol = {total.toFixed(3)} + {cut.size} × 18,015):</p>
              <ul className="mt-1 grid gap-1">
                {fragments.map((f, i) => {
                  const nowReducing = reducingEnds(f.glycan).length;
                  return (
                    <li key={i} className="rounded-xl border border-line p-2">
                      <span className="font-medium">{fragmentName(f.glycan)}</span>: {sub(formulaString(f.formula))}, {f.mass.toFixed(3)} g/mol, {nowReducing > 0 ? "reduzierend" : "nicht reduzierend"}
                      {f.glycan.residues.length > 1 && <span className="block text-xs text-muted">{condensed(f.glycan)}</span>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-1 text-muted">Ausgangsstoff: {red.length ? "reduzierend" : "nicht reduzierend"}. Nach der Spaltung entstehen {fragments.reduce((s, f) => s + reducingEnds(f.glycan).length, 0)} reduzierende Ende(n) insgesamt.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
