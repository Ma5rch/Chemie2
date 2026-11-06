"use client";

import { useState } from "react";
import { addCounts, formulaString, molarMass, type Counts } from "@/lib/glycan";
import type { PolymerEntry } from "@/lib/polymers";

const sub = (s: string) => s.replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)]);

/** Modellrechnung für n Glucose-Einheiten. Gilt für lineare und verzweigte Ketten gleichermaßen (n−1 Bindungen). */
export default function PolymerModel({ p }: { p: PolymerEntry }) {
  const [n, setN] = useState(10);
  if (!p.model) return null;
  const units = Math.max(2, Math.min(100000, Math.floor(n) || 2));
  let c: Counts = {};
  c = addCounts(c, { C: 6, H: 12, O: 6 }, units);
  c = addCounts(c, { H: 2, O: 1 }, -(units - 1));
  return (
    <div className="mt-4 rounded-xl border border-line p-3 text-sm">
      <h4 className="font-medium">Modellrechnung für eine gewählte Kettenlänge</h4>
      <p className="mt-1 text-muted">Wiederholungseinheit: {p.model.repeat}</p>
      <label className="mt-2 flex items-center gap-2">
        Polymerisationsgrad n
        <input type="number" min={2} max={100000} inputMode="numeric" value={n} onChange={(e) => setN(Number(e.target.value))} className="min-h-10 w-28 rounded-lg border border-line bg-paper px-2" />
      </label>
      <ul className="mt-2 list-disc pl-5">
        <li>Summenformel: {sub(formulaString(c))}, das entspricht (C₆H₁₀O₅)ₙ·H₂O</li>
        <li>Molare Masse: {molarMass(c).toFixed(1)} g/mol</li>
        <li>Glykosidische Bindungen: {units - 1}</li>
        <li>Reduzierende Enden: 1 je Molekül</li>
        <li>Nichtreduzierende Enden: {p.model.branched ? "Anzahl der Verzweigungen + 1 (Verzweigungsgrad unbekannt)" : "1 (bei unverzweigter Kette)"}</li>
      </ul>
      <p className="mt-2 text-xs text-muted">Das ist eine Rechnung für das gewählte n, keine Eigenschaft einer realen Probe. Reale Proben haben eine Verteilung von Kettenlängen.</p>
    </div>
  );
}
