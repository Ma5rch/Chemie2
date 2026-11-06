"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TestDetails } from "@/components/TestPanel";
import { ALL_PROFILES } from "@/lib/profile";
import { HYDROLYSIS_TESTS, ID_TESTS, OBS_LABELS, identify, type Entry, type IdTest, type Obs } from "@/lib/identify";
import { TEST_BY_ID } from "@/lib/tests";
import { STATE_TEXT } from "@/lib/state";

const DEFAULTS = ["s:glucose", "p:starch", "s:fructose", "g:sucrose", "s:galactose"];
const CONFLICT_TEXT = "Die Testergebnisse widersprechen sich oder passen zu keinem Kandidaten. Es erfolgt keine Identifizierung.";

export default function Identifikator() {
  const [selected, setSelected] = useState<string[]>(DEFAULTS);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [test, setTest] = useState<IdTest>("iod");
  const [obs, setObs] = useState<Obs>("neg");
  const [hydrolysed, setHydrolysed] = useState(false);

  const cands = useMemo(() => ALL_PROFILES.filter((p) => selected.includes(p.key)), [selected]);
  const out = useMemo(() => identify(cands, entries), [cands, entries]);

  const labels = OBS_LABELS[test];
  const obsKeys = (Object.keys(labels) as Obs[]);
  const obsValue = obsKeys.includes(obs) ? obs : obsKeys[obsKeys.length - 1];
  const canHydrolysed = HYDROLYSIS_TESTS.includes(test);

  function add() {
    const h = canHydrolysed && hydrolysed;
    setEntries((prev) => [...prev.filter((e) => !(e.test === test && e.hydrolysed === h)), { test, obs: obsValue, hydrolysed: h }]);
  }
  function toggle(key: string) {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kohlenhydrat-Identifikator</h1>
          <p className="text-sm text-muted">Trage die Beobachtungen deiner Nachweisreaktionen ein. Die Kandidaten werden Schritt für Schritt eingegrenzt.</p>
        </div>
        <Link href="/" className="rounded-xl border border-line px-4 py-2 text-sm">Zur Suche</Link>
      </header>

      <p className="mb-4 rounded-xl border border-warn p-3 text-sm text-warn">
        Vor jedem Versuch die Sicherheitshinweise in der <Link className="underline" href="/tests">Informationskarte</Link> lesen. Versuche nur unter Aufsicht einer Lehrkraft.
      </p>

      <fieldset className="rounded-2xl border border-line bg-card p-4">
        <legend className="px-1 font-medium">1. Kandidaten (geschlossene Liste)</legend>
        <div className="flex flex-wrap gap-2">
          {ALL_PROFILES.map((p) => (
            <label key={p.key} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${selected.includes(p.key) ? "border-accent" : "border-line"}`}>
              <input type="checkbox" className="h-4 w-4" checked={selected.includes(p.key)} onChange={() => toggle(p.key)} />
              {p.profile.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Ein Stoff außerhalb dieser Liste kann nicht erkannt werden.</p>
      </fieldset>

      <fieldset className="mt-4 rounded-2xl border border-line bg-card p-4">
        <legend className="px-1 font-medium">2. Beobachtung eintragen</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <select aria-label="Test" value={test} onChange={(e) => { setTest(e.target.value as IdTest); setHydrolysed(false); }} className="min-h-11 rounded-xl border border-line bg-paper px-3">
            {ID_TESTS.map((t) => <option key={t} value={t}>{TEST_BY_ID[t].name}</option>)}
          </select>
          <select aria-label="Beobachtung" value={obsValue} onChange={(e) => setObs(e.target.value as Obs)} className="min-h-11 rounded-xl border border-line bg-paper px-3">
            {obsKeys.map((o) => <option key={o} value={o}>{labels[o]}</option>)}
          </select>
        </div>
        {canHydrolysed && (
          <label className="mt-2 flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5" checked={hydrolysed} onChange={(e) => setHydrolysed(e.target.checked)} />
            Probe wurde vorher hydrolysiert (mit Säure erhitzt und anschließend neutralisiert)
          </label>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={add} className="min-h-11 rounded-xl bg-accent px-5 font-medium text-paper">Hinzufügen</button>
          <button type="button" onClick={() => setEntries([])} disabled={!entries.length} className="min-h-11 rounded-xl border border-line px-5 disabled:opacity-50">Neue Analyse</button>
        </div>
        {entries.length > 0 && (
          <ul className="mt-3 grid gap-1 text-sm">
            {entries.map((e) => (
              <li key={`${e.test}-${e.hydrolysed}`} className="flex items-center justify-between gap-2 rounded-xl border border-line p-2">
                <span><span className="font-medium">{TEST_BY_ID[e.test].name}{e.hydrolysed ? " (nach Hydrolyse)" : ""}:</span> {OBS_LABELS[e.test][e.obs]}</span>
                <button type="button" aria-label="Eintrag entfernen" onClick={() => setEntries(entries.filter((x) => x !== e))} className="min-h-9 rounded-lg border border-line px-3">Entfernen</button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <section className="mt-4" aria-live="polite">
        <div className={`rounded-2xl border bg-card p-4 ${out.state === "wahrscheinlich" && !out.contradiction ? "border-line" : "border-warn"}`}>
          <h2 className="text-lg font-semibold">
            {cands.length === 0 ? "Bitte mindestens einen Kandidaten wählen." : out.contradiction ? CONFLICT_TEXT : out.state === "wahrscheinlich" ? `Wahrscheinlich: ${out.remaining[0].profile.label}` : STATE_TEXT.mehrdeutig}
          </h2>
          {out.state === "wahrscheinlich" && !out.contradiction && <p className="text-sm text-muted">{STATE_TEXT.wahrscheinlich} Keine Prozentangabe: Die Tests sind nicht statistisch validiert.</p>}
          {out.contradiction && (
            <p className="mt-1 text-sm text-muted">Prüfe, ob die Beobachtungen stimmen (Reaktionszeit, Temperatur, Konzentration, Reinheit der Probe), wiederhole kritische Tests und erweitere gegebenenfalls die Kandidatenliste.</p>
          )}
          {entries.length === 0 && cands.length > 0 && <p className="mt-1 text-sm text-muted">Noch keine Beobachtung eingetragen: Alle gewählten Kandidaten sind möglich.</p>}
        </div>

        {out.remaining.length > 0 && (
          <div className="mt-3 rounded-2xl border border-line bg-card p-4">
            <h3 className="font-medium">Verbleibende Kandidaten</h3>
            <ul className="mt-1 flex flex-wrap gap-2">{out.remaining.map((c) => <li key={c.key} className="rounded-full border border-accent px-3 py-1 text-sm">{c.profile.label}</li>)}</ul>
          </div>
        )}

        {out.confirm.length > 0 && (
          <div className="mt-3 rounded-2xl border border-line bg-card p-4 text-sm">
            <h3 className="font-medium">Absicherung</h3>
            <ul className="mt-1 list-disc pl-5">{out.confirm.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        )}

        {out.suggestions.length > 0 && (
          <div className="mt-3 rounded-2xl border border-line bg-card p-4">
            <h3 className="font-medium">Sinnvolle nächste Tests</h3>
            <ul className="mt-2 grid gap-2">
              {out.suggestions.map((s) => (
                <li key={s.test} className="rounded-xl border border-line p-3 text-sm">
                  <p className="font-medium">{TEST_BY_ID[s.test].name}</p>
                  <ul className="mt-1 list-disc pl-5 text-muted">{s.groups.map((g) => <li key={g.label}>{g.label}: {g.names.join(", ")}</li>)}</ul>
                  <details className="mt-2"><summary className="min-h-10 cursor-pointer text-accent">Durchführung und Sicherheit</summary><div className="mt-2"><TestDetails t={TEST_BY_ID[s.test]} /></div></details>
                </li>
              ))}
            </ul>
          </div>
        )}

        {out.excluded.length > 0 && (
          <div className="mt-3 rounded-2xl border border-line bg-card p-4">
            <h3 className="font-medium">Ausgeschlossen und warum</h3>
            <ul className="mt-2 grid gap-2 text-sm">
              {out.excluded.map((x) => (
                <li key={x.cand.key} className="rounded-xl border border-line p-3">
                  <p className="font-medium">{x.cand.profile.label}</p>
                  <ul className="list-disc pl-5 text-muted">{x.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
