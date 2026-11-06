"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { exportAll, importAll, listFavorites, listRecent, removeFavorite, type Favorite } from "@/lib/store";

const KIND: Record<Favorite["kind"], string> = { query: "Molekül oder Suche", structure: "Gezeichnete Struktur", glycan: "Oligo-/Polysaccharid" };

function href(f: Favorite): string {
  if (f.kind === "query") return `/?q=${encodeURIComponent(f.data)}`;
  if (f.kind === "structure") return `/editor?smiles=${encodeURIComponent(f.data)}`;
  return `/glycan?fav=${encodeURIComponent(f.id)}`;
}

export default function Favoriten() {
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const reload = useCallback(async () => { setFavs(await listFavorites()); setRecent(await listRecent(20)); }, []);
  useEffect(() => { reload(); }, [reload]);

  async function doExport() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chemistry-explorer-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg(`${data.favorites.length} Favorit(en) exportiert.`);
  }
  async function doImport(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) { setMsg("Die Datei ist zu groß (mehr als 5 MB)."); return; }
    try {
      const r = await importAll(await file.text());
      setMsg(`${r.added} Eintrag/Einträge importiert${r.skipped ? `, ${r.skipped} ungültige übersprungen` : ""}.`);
      reload();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Import fehlgeschlagen."); }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Favoriten und Daten</h1>
      <p className="text-sm text-muted">Alles wird nur in diesem Browser gespeichert (IndexedDB). Mit Export und Import kannst du Daten sichern oder auf ein anderes Gerät übertragen.</p>

      <section className="mt-4 rounded-2xl border border-line bg-card p-4">
        <h2 className="font-medium">Sichern und wiederherstellen</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={doExport} className="min-h-11 rounded-xl bg-accent px-5 font-medium text-paper">Exportieren (JSON)</button>
          <label className="flex min-h-11 cursor-pointer items-center rounded-xl border border-line px-5 font-medium">
            Importieren
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { doImport(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </div>
        <p aria-live="polite" className="mt-2 text-sm">{msg}</p>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 font-medium">Favoriten</h2>
        {favs.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card p-4 text-sm text-muted">Noch keine Favoriten. Du kannst Moleküle in der Suche, Strukturen im Editor und eigene Glykane im Baukasten speichern.</p>
        ) : (
          <ul className="grid gap-2">
            {favs.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-card p-3">
                <div className="min-w-0">
                  <p className="break-words font-medium">{f.title}</p>
                  <p className="text-xs text-muted">{KIND[f.kind]}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={href(f)} className="flex min-h-10 items-center rounded-xl border border-line px-4 text-sm">Öffnen</Link>
                  <button type="button" onClick={async () => { await removeFavorite(f.id); reload(); }} className="min-h-10 rounded-xl border border-line px-4 text-sm">Löschen</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-4 rounded-2xl border border-line bg-card p-4">
          <h2 className="mb-2 font-medium">Zuletzt untersucht</h2>
          <ul className="flex flex-wrap gap-2">{recent.map((q) => <li key={q}><Link href={`/?q=${encodeURIComponent(q)}`} className="inline-flex min-h-9 items-center rounded-full border border-line px-3 text-sm">{q}</Link></li>)}</ul>
        </section>
      )}
    </main>
  );
}
