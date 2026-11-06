"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  KNOWN, condensed, parseGlycan, validate, SUGAR_DE, SUGAR_INFO, anomericPos, childrenOf, freePositions, isFreeAnomeric, matchKnown,
  type Anom, type Glycan, type Residue, type SugarKey,
} from "@/lib/glycan";
import GlycanPanel from "@/components/GlycanPanel";
import TestPanel from "@/components/TestPanel";
import { profileFromGlycan } from "@/lib/profile";
import FavoriteButton from "@/components/FavoriteButton";
import { getFavorite } from "@/lib/store";

const SUGARS = Object.keys(SUGAR_INFO) as SugarKey[];
const selectCls = "min-h-11 rounded-xl border border-line bg-paper px-3";
let counter = 0;
const newId = () => `r${++counter}`;
const mk = (sugar: SugarKey, anomer: Anom): Residue => ({ id: newId(), sugar, ring: SUGAR_INFO[sugar].defaultRing, anomer });

export default function GlycanBuilder() {
  const [g, setG] = useState<Glycan>({ residues: [], links: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startSugar, setStartSugar] = useState<SugarKey>("glucose");
  const [sugar, setSugar] = useState<SugarKey>("glucose");
  const [anomer, setAnomer] = useState<"alpha" | "beta">("alpha");
  const [pos, setPos] = useState<number | null>(null);
  const [accAnomer, setAccAnomer] = useState<"alpha" | "beta">("beta");

  const target = g.residues.find((r) => r.id === selectedId) ?? g.residues[0];
  const free = useMemo(() => (target ? freePositions(g, target) : []), [g, target]);
  const chosen = pos !== null && free.includes(pos) ? pos : free[0] ?? null;
  const needsAccAnomer = target && chosen === anomericPos(target) && target.anomer === "free";

  function start() {
    const r = mk(startSugar, "free");
    setG({ residues: [r], links: [] });
    setSelectedId(r.id);
  }
  function add() {
    if (!target || chosen === null) return;
    const d = mk(sugar, anomer);
    setG({
      residues: [...g.residues.map((r) => (r.id === target.id && needsAccAnomer ? { ...r, anomer: accAnomer } : r)), d],
      links: [...g.links, { donor: d.id, acceptor: target.id, donorPos: anomericPos(d), acceptorPos: chosen }],
    });
    setSelectedId(d.id);
    setPos(null);
  }
  function removeSelected() {
    if (!target) return;
    const drop = new Set<string>();
    const walk = (id: string) => { drop.add(id); childrenOf(g, id).forEach((l) => walk(l.donor)); };
    walk(target.id);
    const links = g.links.filter((l) => !drop.has(l.donor) && !drop.has(l.acceptor));
    const residues = g.residues.filter((r) => !drop.has(r.id));
    // Wird ein anomeres C-Atom durch das Entfernen wieder frei, entfällt seine feste Konfiguration.
    const next: Glycan = { residues, links };
    setG({ residues: residues.map((r) => (isFreeAnomeric(next, r) ? { ...r, anomer: "free" as Anom } : r)), links });
    setSelectedId(residues[0]?.id ?? null);
  }
  function load(id: string) {
    const k = KNOWN.find((x) => x.id === id)!;
    const map = new Map(k.glycan.residues.map((r) => [r.id, newId()]));
    const loaded: Glycan = {
      residues: k.glycan.residues.map((r) => ({ ...r, id: map.get(r.id)! })),
      links: k.glycan.links.map((l) => ({ ...l, donor: map.get(l.donor)!, acceptor: map.get(l.acceptor)! })),
    };
    setG(loaded);
    setSelectedId(loaded.residues[0].id);
  }

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("fav");
    if (!id) return;
    getFavorite(id).then((f) => {
      const parsed = f ? parseGlycan(f.data) : null;
      if (!parsed) return;
      const map = new Map(parsed.residues.map((r) => [r.id, newId()]));
      const loaded: Glycan = {
        residues: parsed.residues.map((r) => ({ ...r, id: map.get(r.id)! })),
        links: parsed.links.map((l) => ({ ...l, donor: map.get(l.donor)!, acceptor: map.get(l.acceptor)! })),
      };
      setG(loaded);
      setSelectedId(loaded.residues[0]?.id ?? null);
    });
  }, []);

  const known = g.residues.length > 1 ? matchKnown(g) : undefined;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Zucker verknüpfen</h1>
          <p className="text-sm text-muted">Oligosaccharide aus Bausteinen bauen. Summenformel, Bindungen und Hydrolyse werden aus dem Modell berechnet.</p>
        </div>
        <Link href="/" className="rounded-xl border border-line px-4 py-2 text-sm">Zur Suche</Link>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="grid content-start gap-4">
          <fieldset className="rounded-2xl border border-line bg-card p-4">
            <legend className="px-1 font-medium">1. Wurzelbaustein</legend>
            <div className="grid gap-2">
              <select aria-label="Zucker" className={selectCls} value={startSugar} onChange={(e) => setStartSugar(e.target.value as SugarKey)}>
                {SUGARS.map((s) => <option key={s} value={s}>D-{SUGAR_DE[s]} ({SUGAR_INFO[s].defaultRing === "pyranose" ? "Pyranose" : "Furanose"})</option>)}
              </select>
              <button type="button" onClick={start} className="min-h-11 rounded-xl bg-accent px-4 font-medium text-paper">Neu beginnen</button>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-line bg-card p-4 disabled:opacity-50" disabled={!target}>
            <legend className="px-1 font-medium">2. Baustein anbinden</legend>
            <p className="mb-2 text-xs text-muted">Wähle im Schema einen Baustein als Ziel{target ? `, aktuell: ${SUGAR_DE[target.sugar]}` : ""}.</p>
            <div className="grid gap-2">
              <select aria-label="Neuer Zucker" className={selectCls} value={sugar} onChange={(e) => setSugar(e.target.value as SugarKey)}>
                {SUGARS.map((s) => <option key={s} value={s}>D-{SUGAR_DE[s]}</option>)}
              </select>
              <select aria-label="Konfiguration der neuen Bindung" className={selectCls} value={anomer} onChange={(e) => setAnomer(e.target.value as "alpha" | "beta")}>
                <option value="alpha">α-Bindung</option><option value="beta">β-Bindung</option>
              </select>
              <select aria-label="Position am Ziel" className={selectCls} value={chosen ?? ""} onChange={(e) => setPos(Number(e.target.value))} disabled={!free.length}>
                {free.map((p) => <option key={p} value={p}>an C{p}{target && p === anomericPos(target) ? " (anomer)" : ""}</option>)}
              </select>
              {needsAccAnomer && (
                <select aria-label="Konfiguration des Ziels" className={selectCls} value={accAnomer} onChange={(e) => setAccAnomer(e.target.value as "alpha" | "beta")}>
                  <option value="beta">Ziel: β am anomeren C</option><option value="alpha">Ziel: α am anomeren C</option>
                </select>
              )}
              <button type="button" onClick={add} disabled={!target || chosen === null} className="min-h-11 rounded-xl bg-accent px-4 font-medium text-paper disabled:opacity-50">Verknüpfen</button>
              <button type="button" onClick={removeSelected} disabled={!target} className="min-h-11 rounded-xl border border-line px-4 disabled:opacity-50">Gewählten Baustein samt Anhang entfernen</button>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-line bg-card p-4">
            <legend className="px-1 font-medium">Bekannte laden</legend>
            <div className="flex flex-wrap gap-2">
              {KNOWN.map((k) => <button key={k.id} type="button" onClick={() => load(k.id)} className="min-h-9 rounded-full border border-line px-3 text-sm">{k.de}</button>)}
            </div>
          </fieldset>
        </div>

        <div className="min-w-0">
          {g.residues.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card p-5 text-muted">Wähle links einen Wurzelbaustein oder lade ein bekanntes Oligosaccharid.</p>
          ) : (
            <div className="grid gap-4">
            {validate(g).length === 0 && (
              <div><FavoriteButton kind="glycan" label="Glykan speichern" title={known ? known.de : `Eigenes Glykan: ${condensed(g)}`} data={JSON.stringify(g)} /></div>
            )}
            <GlycanPanel selectedId={selectedId} onSelectId={setSelectedId} glycan={g} title={known ? known.de : g.residues.length === 1 ? `D-${SUGAR_DE[g.residues[0].sugar]}` : "Eigene Struktur"} klass={known?.klass} />
            {known && profileFromGlycan(g, known.de) && <TestPanel profile={profileFromGlycan(g, known.de)!} />}
            {!known && g.residues.length === 1 && profileFromGlycan(g, "") && <TestPanel profile={profileFromGlycan(g, "")!} />}
            {!known && g.residues.length > 1 && profileFromGlycan(g, "Eigene Struktur") && <TestPanel profile={profileFromGlycan(g, "Eigene Struktur")!} />}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
