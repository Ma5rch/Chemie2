"use client";

import { useMemo, useState } from "react";
import { PAIRS, buildItems, compareRows, type Item } from "@/lib/compare";
import StructureVisual from "@/components/StructureVisual";

export default function Vergleich() {
  const items = useMemo(() => buildItems(), []);
  const [keys, setKeys] = useState<string[]>(PAIRS[0].keys);
  const chosen = keys.map((k) => items.find((i) => i.key === k)).filter((i): i is Item => !!i);
  const rows = compareRows(chosen);
  const diff = rows.filter((r) => r.differs);
  const same = rows.filter((r) => !r.differs);
  const groups = [...new Set(items.map((i) => i.group))];

  function setAt(idx: number, key: string) {
    setKeys((prev) => { const n = [...prev]; if (key === "") n.splice(idx, 1); else n[idx] = key; return n; });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Molekülvergleich</h1>
      <p className="text-sm text-muted">Vergleiche zwei oder drei Stoffe. Unterschiede sind markiert (≠).</p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Typische Vergleiche">
        {PAIRS.map((p) => (
          <button key={p.label} type="button" onClick={() => setKeys(p.keys)} aria-pressed={p.keys.join() === keys.join()}
            className={`min-h-10 rounded-full border px-3 text-sm ${p.keys.join() === keys.join() ? "border-accent bg-accent text-paper" : "border-line"}`}>{p.label}</button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((idx) => (
          <select key={idx} aria-label={`Stoff ${idx + 1}`} value={keys[idx] ?? ""} onChange={(e) => setAt(idx, e.target.value)} disabled={idx > keys.length}
            className="min-h-11 rounded-xl border border-line bg-card px-3 disabled:opacity-50">
            <option value="">{idx < 2 ? "Stoff wählen …" : "Dritter Stoff (optional)"}</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>{items.filter((i) => i.group === g).map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}</optgroup>
            ))}
          </select>
        ))}
      </div>

      {chosen.length < 2 ? (
        <p className="mt-4 rounded-2xl border border-line bg-card p-4 text-muted">Wähle mindestens zwei Stoffe.</p>
      ) : (
        <>
          <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Strukturen">
            {chosen.map((i) => (
              <figure key={i.key} className="m-0 rounded-2xl border border-line bg-card p-3">
                <figcaption className="mb-2 font-medium">{i.label}</figcaption>
                <StructureVisual v={i.visual} />
              </figure>
            ))}
          </section>

          <p className="mt-4 rounded-xl border border-line bg-card p-3 text-sm" aria-live="polite">
            <span className="font-medium">{diff.length} Unterschiede</span> und {same.length} Gemeinsamkeiten in {rows.length} verglichenen Eigenschaften.
          </p>

          <h2 className="mb-2 mt-4 font-medium">Unterschiede</h2>
          {diff.length === 0 ? <p className="text-sm text-muted">Keine Unterschiede in den verglichenen Eigenschaften.</p> : (
            <ul className="grid gap-2">
              {diff.map((r) => (
                <li key={r.label} className="rounded-xl border-2 border-accent bg-card p-3">
                  <p className="text-sm font-semibold"><span aria-hidden="true">≠ </span>{r.label} <span className="sr-only">(Unterschied)</span></p>
                  <ul className="mt-1 grid gap-1 text-sm">
                    {r.values.map((v, idx) => <li key={idx}><span className="font-medium">{chosen[idx].label}:</span> {v}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          <details className="mt-4">
            <summary className="min-h-11 cursor-pointer font-medium">Gemeinsamkeiten ({same.length})</summary>
            <ul className="mt-2 grid gap-2">
              {same.map((r) => (
                <li key={r.label} className="rounded-xl border border-line bg-card p-3 text-sm">
                  <p className="text-muted">{r.label}</p>
                  <p>{r.values[0]}</p>
                </li>
              ))}
            </ul>
          </details>

          <p className="mt-4 text-xs text-muted">Werte für Oligosaccharide sind aus dem Baustein-Modell berechnet, bei Polysacchariden gilt die variable Struktur. Testergebnisse sind erwartete Werte unter kontrollierten Schulbedingungen.</p>
        </>
      )}
    </main>
  );
}
