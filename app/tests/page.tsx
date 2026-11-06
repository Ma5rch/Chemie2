"use client";

import Link from "next/link";
import { useState } from "react";
import TestPanel, { TestDetails } from "@/components/TestPanel";
import { ALL_PROFILES } from "@/lib/profile";
import { TESTS } from "@/lib/tests";

export default function TestsPage() {
  const [key, setKey] = useState("");
  const chosen = ALL_PROFILES.find((p) => p.key === key);
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nachweisreaktionen</h1>
          <p className="text-sm text-muted">Wissensdatenbank mit Informationskarten und Sicherheitshinweisen. Alle Versuche nur unter Aufsicht einer Lehrkraft.</p>
        </div>
        <Link href="/" className="rounded-xl border border-line px-4 py-2 text-sm">Zur Suche</Link>
      </header>

      <div className="rounded-2xl border border-line bg-card p-4">
        <label htmlFor="mol" className="mb-2 block font-medium">Erwartete Ergebnisse für ein Molekül anzeigen</label>
        <select id="mol" value={key} onChange={(e) => setKey(e.target.value)} className="min-h-12 w-full rounded-xl border border-line bg-paper px-3">
          <option value="">Molekül wählen …</option>
          {ALL_PROFILES.map((p) => <option key={p.key} value={p.key}>{p.profile.label}</option>)}
        </select>
      </div>

      {chosen && <div className="mt-4"><TestPanel profile={chosen.profile} /></div>}

      <h2 className="mb-2 mt-8 text-lg font-semibold">Alle Informationskarten</h2>
      <ul className="grid gap-2">
        {TESTS.map((t) => (
          <li key={t.id} className="rounded-xl border border-line bg-card">
            <details>
              <summary className="min-h-12 cursor-pointer p-3 font-medium">{t.name}</summary>
              <div className="border-t border-line p-3"><TestDetails t={t} /></div>
            </details>
          </li>
        ))}
      </ul>
    </main>
  );
}
