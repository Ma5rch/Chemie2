"use client";

import { useCallback, useEffect, useState } from "react";
import StructureVisual from "@/components/StructureVisual";
import { TOPICS, generate, type Question, type Topic } from "@/lib/quiz";
import { listProgress, saveProgress, type Progress } from "@/lib/store";

type Mode = Topic | "mix";

export default function Lernen() {
  const [mode, setMode] = useState<Mode>("mix");
  const [q, setQ] = useState<Question | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [session, setSession] = useState({ correct: 0, total: 0 });
  const [progress, setProgress] = useState<Progress[]>([]);

  const next = useCallback((m: Mode) => { setQ(generate(m, Math.floor(Math.random() * 2 ** 31))); setChosen(null); }, []);
  useEffect(() => { next("mix"); listProgress().then(setProgress); }, [next]);

  function pickMode(m: Mode) { setMode(m); setSession({ correct: 0, total: 0 }); next(m); }

  async function answer(i: number) {
    if (!q || chosen !== null) return;
    setChosen(i);
    const ok = i === q.correct;
    setSession((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    const old = progress.find((p) => p.id === q.topic);
    const updated: Progress = { id: q.topic, correct: (old?.correct ?? 0) + (ok ? 1 : 0), total: (old?.total ?? 0) + 1, lastAt: Date.now() };
    setProgress((prev) => [...prev.filter((p) => p.id !== q.topic), updated]);
    await saveProgress(updated);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Lernmodus</h1>
      <p className="text-sm text-muted">Aufgaben werden aus dem Wissensmodell der App erzeugt, ohne KI und ohne Kosten. Nach jeder Antwort gibt es eine Erklärung. Das Lernen funktioniert auch offline.</p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Thema">
        {[{ id: "mix" as Mode, label: "Gemischt" }, ...TOPICS].map((t) => (
          <button key={t.id} type="button" aria-pressed={mode === t.id} onClick={() => pickMode(t.id as Mode)}
            className={`min-h-10 rounded-full border px-3 text-sm ${mode === t.id ? "border-accent bg-accent text-paper" : "border-line"}`}>{t.label}</button>
        ))}
      </div>

      {q && (
        <section className="mt-4 rounded-2xl border border-line bg-card p-4 sm:p-5" aria-live="polite">
          <p className="text-xs text-muted">{TOPICS.find((t) => t.id === q.topic)?.label} · Diese Runde: {session.correct} von {session.total} richtig</p>
          <h2 className="mt-1 text-lg font-semibold">{q.prompt}</h2>
          {q.visuals.length > 0 && (
            <div className={`mt-3 grid gap-3 ${q.visuals.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {q.visuals.map((v, i) => <div key={i} className="rounded-xl border border-line bg-paper p-2"><StructureVisual v={v} /></div>)}
            </div>
          )}
          <ul className="mt-3 grid gap-2">
            {q.options.map((o, i) => {
              const done = chosen !== null;
              const isRight = i === q.correct;
              const state = !done ? "border-line" : isRight ? "border-accent ring-2 ring-accent" : i === chosen ? "border-warn ring-2 ring-warn" : "border-line opacity-70";
              return (
                <li key={o}>
                  <button type="button" disabled={done} onClick={() => answer(i)} className={`w-full min-h-12 rounded-xl border bg-paper p-3 text-left ${state}`}>
                    {o}
                    {done && isRight && <span className="ml-2 text-sm font-semibold text-accent">✓ richtig</span>}
                    {done && !isRight && i === chosen && <span className="ml-2 text-sm font-semibold text-warn">✗ falsch</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {chosen !== null && (
            <div className="mt-3 rounded-xl border border-line p-3 text-sm">
              <p className="font-medium">{chosen === q.correct ? "Richtig." : `Nicht ganz. Richtig ist: ${q.options[q.correct]}`}</p>
              <p className="mt-1">{q.explanation}</p>
              <button type="button" onClick={() => next(mode)} className="mt-3 min-h-11 rounded-xl bg-accent px-5 font-medium text-paper">Nächste Aufgabe</button>
            </div>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-card p-4">
        <h2 className="font-medium">Lernfortschritt</h2>
        <p className="text-xs text-muted">Wird nur in diesem Browser gespeichert und ist Teil von Export und Import.</p>
        <ul className="mt-2 grid gap-1 text-sm">
          {TOPICS.map((t) => {
            const p = progress.find((x) => x.id === t.id);
            return (
              <li key={t.id} className="flex justify-between gap-2 border-b border-line py-1 last:border-0">
                <span>{t.label}</span>
                <span className="text-muted">{p ? `${p.correct} von ${p.total} richtig (${Math.round((100 * p.correct) / p.total)} %)` : "noch nicht geübt"}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
