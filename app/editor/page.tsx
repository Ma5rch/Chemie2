"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Ketcher } from "ketcher-core";
import { analyzeLocal, type LocalAnalysis } from "@/lib/rdkit";
import { matchStructure, type StructureMatch } from "@/lib/structure";
import { STATE_TEXT } from "@/lib/state";
import MoleculeCard from "@/components/MoleculeCard";
import FavoriteButton from "@/components/FavoriteButton";

const KetcherEditor = dynamic(() => import("@/components/KetcherEditor"), {
  ssr: false,
  loading: () => <p className="p-6 text-muted">Editor wird geladen …</p>,
});

type Phase = "idle" | "computing" | "done";

export default function EditorPage() {
  const ketcher = useRef<Ketcher | null>(null);
  const run = useRef(0); // Zähler, damit veraltete Ergebnisse verworfen werden
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [local, setLocal] = useState<LocalAnalysis | null>(null);
  const [match, setMatch] = useState<StructureMatch | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);

  const recompute = useCallback(async () => {
    const k = ketcher.current;
    if (!k) return;
    const id = ++run.current;
    // Veraltete Ergebnisse sofort ausblenden
    setPhase("computing");
    setLocal(null);
    setMatch(null);
    setMatchError(null);
    setSelected(0);
    try {
      const molfile = await k.getMolfile();
      const l = await analyzeLocal(molfile);
      if (id !== run.current) return;
      setLocal(l);
      setPhase("done");
      if (l.valid) {
        try {
          const m = await matchStructure(l);
          if (id === run.current) setMatch(m);
        } catch (e) {
          if (id === run.current)
            setMatchError((e instanceof Error ? e.message : "Der PubChem-Abgleich ist fehlgeschlagen.") + " Die lokal berechneten Werte bleiben gültig.");
        }
      }
    } catch (e) {
      if (id !== run.current) return;
      setLocal({ valid: false, error: e instanceof Error ? e.message : "Die Auswertung ist fehlgeschlagen." });
      setPhase("done");
    }
  }, []);

  const schedule = useCallback((delay = 600) => {
    if (timer.current) clearTimeout(timer.current);
    run.current++; // laufende Auswertung ist ab jetzt veraltet
    setPhase("computing");
    setLocal(null);
    setMatch(null);
    timer.current = setTimeout(recompute, delay);
  }, [recompute]);

  const onReady = useCallback(async (k: Ketcher) => {
    ketcher.current = k;
    const smiles = new URLSearchParams(window.location.search).get("smiles");
    if (smiles) {
      try { await k.setMolecule(smiles); } catch { setEditorError("Die übergebene Struktur konnte nicht geladen werden."); }
    }
    k.editor.subscribe("change", () => schedule());
    recompute();
  }, [recompute, schedule]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const current = match?.compounds[selected];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Struktur zeichnen</h1>
          <p className="text-sm text-muted">Änderungen werden automatisch neu berechnet und mit PubChem abgeglichen.</p>
        </div>
        <Link href="/" className="rounded-xl border border-line px-4 py-2 text-sm">Zur Suche</Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="h-[70vh] min-h-[460px] overflow-hidden rounded-2xl border border-line bg-white">
          <KetcherEditor onReady={onReady} onError={setEditorError} />
        </div>

        <section aria-live="polite" className="min-w-0">
          {editorError && <p role="alert" className="mb-3 rounded-xl border border-warn p-3 text-sm text-warn">{editorError}</p>}
          {phase === "computing" && <p className="rounded-2xl border border-line bg-card p-4 text-muted">Wird aktualisiert …</p>}

          {phase === "done" && local && !local.valid && (
            <p className={`rounded-2xl border bg-card p-4 ${local.empty ? "border-line text-muted" : "border-warn text-warn"}`}>{local.error}</p>
          )}

          {phase === "done" && local?.valid && (
            <div className="rounded-2xl border border-line bg-card p-4">
              <h2 className="text-lg font-semibold">Berechnet mit RDKit.js</h2>
              <dl className="mt-2 text-sm">
                {([
                  ["Summenformel", local.formula ? local.formula + (local.charged ? " (geladene Atome enthalten)" : "") : undefined],
                  ["Molare Masse", local.mass ? `${local.mass.toFixed(3)} g/mol` : undefined],
                  ["Schweratome", String(local.heavyAtoms)],
                  ["Stereozentren mit CIP-Label", local.cipCenters !== undefined ? String(local.cipCenters) : undefined],
                  ["SMILES", local.smiles],
                  ["InChI", local.inchi],
                  ["InChIKey", local.inchikey],
                ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="border-b border-line py-2 last:border-0">
                    <dt className="text-muted">{k}</dt>
                    <dd className="m-0 break-words font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-muted">Berechnete Werte, keine Datenbankeinträge.</p>
              <div className="mt-2"><FavoriteButton kind="structure" label="Struktur speichern" title={`Struktur ${local.formula ?? local.smiles}`} data={local.smiles} /></div>
            </div>
          )}

          {phase === "done" && local?.valid && !match && !matchError && (
            <p className="mt-3 rounded-2xl border border-line bg-card p-4 text-muted">PubChem-Abgleich läuft …</p>
          )}
          {matchError && <p role="alert" className="mt-3 rounded-2xl border border-warn p-4 text-sm text-warn">{matchError}</p>}

          {match && (
            <div className={`mt-3 rounded-2xl border bg-card p-4 ${match.state === "eindeutig" ? "border-line" : "border-warn"}`}>
              <p className="text-xs text-muted">
                {match.category === "A" && "A – bekanntes Molekül"}
                {match.category === "B" && "B – bekanntes Stereoisomer oder Anomer"}
                {match.category === "C" && "C – unbekannte Struktur"}
              </p>
              <h2 className="text-lg font-semibold">{STATE_TEXT[match.state]}</h2>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted">{match.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              {match.category === "B" && match.compounds.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {match.compounds.map((c, i) => (
                    <li key={c.cid}>
                      <button type="button" aria-pressed={i === selected} onClick={() => setSelected(i)}
                        className={`w-full rounded-xl border p-3 text-left text-sm ${i === selected ? "border-accent ring-1 ring-accent" : "border-line"}`}>
                        <span className="block break-words font-medium">{c.iupac ?? `CID ${c.cid}`}</span>
                        <span className="text-muted">{c.formula} · CID {c.cid}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {current && <div className="mt-3"><MoleculeCard c={current} /></div>}
        </section>
      </div>
    </main>
  );
}
