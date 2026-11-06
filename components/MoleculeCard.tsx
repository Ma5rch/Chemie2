import Link from "next/link";
import { compoundPageUrl, structureImageUrl, type Compound } from "@/lib/pubchem";

export default function MoleculeCard({ c }: { c: Compound }) {
  const rows: [string, string | undefined][] = [
    ["Summenformel", c.formula],
    ["Molare Masse", c.weight ? `${c.weight} g/mol` : undefined],
    ["IUPAC-Name", c.iupac],
    ["SMILES", c.smiles],
    ["InChI", c.inchi],
    ["InChIKey", c.inchikey],
  ];
  return (
    <article className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr]">
        <figure className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={structureImageUrl(c.cid)} alt={`2D-Struktur, PubChem CID ${c.cid}`} className="aspect-square w-full rounded-xl bg-white object-contain" />
          <figcaption className="mt-1 text-xs text-muted">2D-Darstellung von PubChem (Datenbankinformation)</figcaption>
        </figure>
        <dl className="min-w-0 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="border-b border-line py-2 last:border-0">
              <dt className="text-muted">{k}</dt>
              <dd className="m-0 break-words font-medium">{v ?? <span className="font-normal text-muted">nicht verfügbar (PubChem liefert keinen Wert)</span>}</dd>
            </div>
          ))}
          <p className="mt-3 text-xs text-muted">
            Quelle:{" "}
            <a className="text-accent underline" href={compoundPageUrl(c.cid)} target="_blank" rel="noreferrer">
              PubChem CID {c.cid}
            </a>
            . Werte stammen aus der Datenbank, nicht aus eigener Berechnung.
          </p>
          {c.smiles && (
            <Link href={`/editor?smiles=${encodeURIComponent(c.smiles)}`} className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm">Im Editor öffnen</Link>
          )}
        </dl>
      </div>
    </article>
  );
}
