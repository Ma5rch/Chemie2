"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { analyze, offlineResult, type Result } from "@/lib/analyze";
import { STATE_TEXT } from "@/lib/state";
import type { Compound } from "@/lib/pubchem";
import { addRecent, listFavorites, listRecent } from "@/lib/store";
import FavoriteButton from "@/components/FavoriteButton";
import MoleculeCard from "@/components/MoleculeCard";
import SugarViewer from "@/components/SugarViewer";
import { findSugar } from "@/lib/sugars";
import { findGlycan } from "@/lib/glycan";
import GlycanPanel from "@/components/GlycanPanel";
import PolymerModel from "@/components/PolymerModel";
import TestPanel from "@/components/TestPanel";
import { profileForName } from "@/lib/profile";

const QUICK = ["Glucose", "Fructose", "Galactose", "Saccharose", "Maltose", "Lactose", "Raffinose", "Maltotriose", "Stärke", "Amylose", "Glykogen", "Cellulose", "C6H12O6"];

const KIND_TEXT = { name: "Name", formula: "Summenformel", smiles: "SMILES", inchi: "InChI" } as const;

export default function Home() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    listRecent().then(setRecent);
    listFavorites().then((f) => setFavs(f.filter((x) => x.kind === "query").slice(0, 8).map((x) => x.data)));
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(q: string) {
    const text = q.trim();
    if (!text) return;
    setQuery(text);
    setBusy(true);
    setError(null);
    try {
      const r = await analyze(text);
      setResult(r);
      setSelected(0);
      await addRecent(text);
      setRecent(await listRecent());
    } catch (e) {
      // Ohne Verbindung: lokales Wissen und gespeicherte Kopie zeigen, klar gekennzeichnet
      let copy: { compounds: Compound[]; savedAt: number } | undefined;
      try {
        const fav = (await listFavorites()).find((f) => f.kind === "query" && f.data === text && f.snapshot);
        const parsed = fav?.snapshot ? JSON.parse(fav.snapshot) : null;
        if (fav && Array.isArray(parsed)) copy = { compounds: parsed as Compound[], savedAt: fav.savedAt };
      } catch { /* keine Kopie */ }
      const fallback = offlineResult(text, copy);
      if (fallback) {
        setResult(fallback);
        setSelected(0);
      } else {
        setResult(null);
        setError((e instanceof Error ? e.message : "Die Abfrage ist fehlgeschlagen.") + " Bitte prüfe die Internetverbindung.");
      }
    } finally {
      setBusy(false);
    }
  }

  const current = result?.compounds[selected];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Chemistry Explorer</h1>
        <p className="mt-1 max-w-prose text-muted">Moleküle nachschlagen, mit Fokus auf Kohlenhydrate. Unsichere Ergebnisse werden als unsicher gekennzeichnet.</p>
      </header>

      <form onSubmit={(e) => { e.preventDefault(); run(query); }} className="rounded-2xl border border-line bg-card p-4">
        <label htmlFor="q" className="mb-2 block text-base font-medium">Welches Molekül möchtest du untersuchen?</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Molekülname, Summenformel, SMILES oder InChI eingeben ..."
            autoCapitalize="off" autoCorrect="off" spellCheck={false}
            className="min-h-12 flex-1 rounded-xl border border-line bg-paper px-4 text-base"
          />
          <button type="submit" disabled={busy || !query.trim()} className="min-h-12 rounded-xl bg-accent px-6 font-medium text-paper disabled:opacity-50">
            {busy ? "Analysiere …" : "Analysieren"}
          </button>
          <Link href="/identifikator" className="flex min-h-12 items-center justify-center rounded-xl border border-line px-5 font-medium">Identifikator</Link>
          <Link href="/tests" className="flex min-h-12 items-center justify-center rounded-xl border border-line px-5 font-medium">Nachweisreaktionen</Link>
          <Link href="/glycan" className="flex min-h-12 items-center justify-center rounded-xl border border-line px-5 font-medium">Zucker verknüpfen</Link>
          <Link href="/editor" className="flex min-h-12 items-center justify-center rounded-xl border border-line px-5 font-medium">Struktur zeichnen</Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button key={q} type="button" onClick={() => run(q)} className="min-h-9 rounded-full border border-line px-3 text-sm">{q}</button>
          ))}
        </div>
        {favs.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            Favoriten:{" "}
            {favs.map((q) => (
              <button key={q} type="button" onClick={() => run(q)} className="mr-2 text-accent underline">{q}</button>
            ))}
          </p>
        )}
        {recent.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            Zuletzt:{" "}
            {recent.map((q) => (
              <button key={q} type="button" onClick={() => run(q)} className="mr-2 text-accent underline">{q}</button>
            ))}
          </p>
        )}
      </form>

      {error && <p role="alert" className="mt-4 rounded-xl border border-warn p-3 text-warn">{error}</p>}

      {result && (
        <section className="mt-6" aria-live="polite">
          <div className="mb-1"><FavoriteButton kind="query" title={query} data={query} snapshot={result.compounds.length && !result.offline ? JSON.stringify(result.compounds) : undefined} /></div>
          <p className="text-sm text-muted">Erkannte Eingabe: {KIND_TEXT[result.input.kind]}{result.input.kind === "formula" ? ` (Hill-Notation: ${result.input.value})` : ""}</p>

          {result.polymer ? (
            <article className="mt-2 rounded-2xl border border-line bg-card p-5">
              <h2 className="text-xl font-semibold">{result.polymer.title}</h2>
              <p className="text-muted">{result.polymer.kind}</p>
              <p className="mt-3 rounded-xl border border-warn p-3 text-sm text-warn">Variable Polymerstruktur: Es gibt keine einheitliche Summenformel, daher wird keine Molekülkette erzeugt.</p>
              <dl className="mt-3 text-sm">
                {result.polymer.facts.map((f) => (
                  <div key={f.label} className="flex flex-wrap justify-between gap-2 border-b border-line py-2 last:border-0">
                    <dt className="text-muted">{f.label}</dt>
                    <dd className="m-0 font-medium">{f.value} <span className="text-xs text-muted">({f.state})</span></dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm">{result.polymer.note}</p>
              <PolymerModel p={result.polymer} />
              {profileForName(result.input.value) && <div className="mt-4"><TestPanel profile={profileForName(result.input.value)!} /></div>}
            </article>
          ) : (
            <>
              <div className={`mt-2 rounded-2xl border p-4 ${result.state === "unbekannt" || result.state === "mehrdeutig" ? "border-warn" : "border-line"} bg-card`}>
                <h2 className="text-lg font-semibold">{result.offline ? "Keine Verbindung zu PubChem." : STATE_TEXT[result.state]}</h2>
                {result.offline && (
                  <p className="mt-1 text-sm text-muted">
                    Datenbankangaben fehlen oder stammen aus einer gespeicherten Kopie. Angezeigt wird das lokale Wissen der App.
                    {result.copySavedAt ? ` Gespeicherte Kopie vom ${new Date(result.copySavedAt).toLocaleDateString("de-DE")}, nicht live abgerufen.` : ""}
                  </p>
                )}
                <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                  {result.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>

              {result.compounds.length > 1 && (
                <div className="mt-4">
                  <h3 className="mb-2 font-medium">Kandidaten{result.partialList ? " (Auswahl, nicht vollständig)" : ""}</h3>
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {result.compounds.map((c, i) => (
                      <li key={c.cid}>
                        <button
                          type="button"
                          onClick={() => setSelected(i)}
                          aria-pressed={i === selected}
                          className={`w-full rounded-xl border bg-card p-3 text-left text-sm ${i === selected ? "border-accent ring-1 ring-accent" : "border-line"}`}
                        >
                          <span className="block break-words font-medium">{c.iupac ?? `CID ${c.cid}`}</span>
                          <span className="text-muted">{c.formula} · CID {c.cid}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {current && <div className="mt-4"><MoleculeCard c={current} /></div>}
              {result.input.kind === "name" && findGlycan(result.input.value) && (
                <div className="mt-4"><GlycanPanel glycan={findGlycan(result.input.value)!.glycan} title={findGlycan(result.input.value)!.de} klass={findGlycan(result.input.value)!.klass} /></div>
              )}
              {result.input.kind === "name" && findSugar(result.input.value) && (
                <div className="mt-4"><SugarViewer sugar={findSugar(result.input.value)!} /></div>
              )}
              {result.input.kind === "name" && profileForName(result.input.value) && (
                <div className="mt-4"><TestPanel profile={profileForName(result.input.value)!} /></div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
