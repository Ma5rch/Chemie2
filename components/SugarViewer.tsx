"use client";

import { useEffect, useState } from "react";
import { byName, compoundPageUrl, type Compound } from "@/lib/pubchem";
import { pubchemName, type Anomer, type Ring, type Sugar } from "@/lib/sugars";
import Fischer from "./Fischer";
import Haworth from "./Haworth";

const RING_DE: Record<Ring, string> = { open: "Offenkettig", pyranose: "Pyranose", furanose: "Furanose" };

export default function SugarViewer({ sugar }: { sugar: Sugar }) {
  const ringOptions = sugar.rings;
  const [ring, setRing] = useState<Ring>(ringOptions.includes("pyranose") ? "pyranose" : "furanose");
  const [anomer, setAnomer] = useState<Anomer>("alpha");
  const [hit, setHit] = useState<Compound | null | "loading">("loading");

  useEffect(() => { setRing(sugar.rings.includes("pyranose") ? "pyranose" : "furanose"); setAnomer("alpha"); }, [sugar]);

  const name = pubchemName(sugar, ring, anomer);
  useEffect(() => {
    let alive = true;
    setHit("loading");
    byName(name).then((r) => alive && setHit(r[0] ?? null)).catch(() => alive && setHit(null));
    return () => { alive = false; };
  }, [name]);

  const isRing = ring !== "open";
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5" aria-label="Kohlenhydrat-Ansichten">
      <h3 className="text-lg font-semibold">{sugar.de}: Fischer- und Haworth-Ansicht</h3>
      <p className="mt-1 text-xs text-muted">Diese Darstellung wird aus der Konfiguration der D-Reihe erzeugt (Lehrbuchwissen), nicht aus PubChem.</p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Form">
        {ringOptions.map((r) => (
          <button key={r} type="button" aria-pressed={r === ring} onClick={() => setRing(r)}
            className={`min-h-10 rounded-full border px-4 text-sm ${r === ring ? "border-accent bg-accent text-paper" : "border-line"}`}>{RING_DE[r]}</button>
        ))}
      </div>
      {isRing && (
        <div className="mt-2 flex gap-2" role="group" aria-label="Anomer auswählen">
          {(["alpha", "beta"] as Anomer[]).map((a) => (
            <button key={a} type="button" aria-pressed={a === anomer} onClick={() => setAnomer(a)}
              className={`min-h-10 rounded-full border px-4 text-sm ${a === anomer ? "border-accent bg-accent text-paper" : "border-line"}`}>{a === "alpha" ? "α-Form" : "β-Form"}</button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          {isRing ? <Haworth sugar={sugar} ring={ring as "pyranose" | "furanose"} anomer={anomer} /> : <Fischer sugar={sugar} />}
        </div>
        <div className="text-sm">
          {isRing ? (
            <>
              <p className="font-medium">{anomer === "alpha" ? "α" : "β"}-{sugar.de}-{ring === "pyranose" ? "pyranose" : "furanose"}</p>
              <p className="mt-2">{anomer === "alpha"
                ? `Die OH-Gruppe am anomeren C-Atom steht entgegengesetzt zur ${sugar.type === "aldose" ? "CH2OH-Gruppe an C5" : "CH2OH-Gruppe an C5"} (in der Haworth-Darstellung unten).`
                : "Die OH-Gruppe am anomeren C-Atom steht auf derselben Seite wie die CH2OH-Gruppe an C5 (in der Haworth-Darstellung oben)."}</p>
              <p className="mt-2 text-muted">Beim Wechsel zwischen α und β ändert sich die Konfiguration nur am anomeren C-Atom ({sugar.type === "aldose" ? "C1" : "C2"}). Die übrigen Zentren bleiben gleich. In Lösung stehen α-Form, β-Form und offenkettige Form im Gleichgewicht (Mutarotation).</p>
            </>
          ) : (
            <p>Offenkettige D-Form: Die Seitengruppen an den Stereozentren sind rechts (R) oder links (L) der Kohlenstoffkette. D bedeutet, dass die OH-Gruppe am untersten Stereozentrum rechts steht.</p>
          )}
          <p className="mt-3 text-xs text-muted">
            Gegenprüfung in PubChem ({name}):{" "}
            {hit === "loading" ? "wird geladen …" : hit ? (
              <>Eintrag gefunden: <a className="text-accent underline" href={compoundPageUrl(hit.cid)} target="_blank" rel="noreferrer">CID {hit.cid}</a>, Summenformel {hit.formula}. Der Vergleich der Stereochemie erfolgt mit RDKit.js in Phase 4.</>
            ) : "kein Eintrag unter diesem Namen gefunden."}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Noch nicht enthalten: Sesselkonformation sowie Furanose-Formen der Aldohexosen und Pyranose-Formen der Fructose.</p>
    </section>
  );
}
