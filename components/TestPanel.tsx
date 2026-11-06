import { SDB_NOTE, TESTS, type TestCard } from "@/lib/tests";
import { evaluate, type Profile, type Rating } from "@/lib/profile";

const RATING_LABEL: Record<Rating, string> = { positiv: "Positiv", negativ: "Negativ", bedingt: "Bedingt", "nicht geeignet": "Nicht geeignet" };
const RATING_CLASS: Record<Rating, string> = {
  positiv: "border-accent text-accent",
  negativ: "border-line text-ink",
  bedingt: "border-warn text-warn",
  "nicht geeignet": "border-line text-muted",
};

function Badge({ r }: { r: Rating }) {
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${RATING_CLASS[r]}`}>{RATING_LABEL[r]}</span>;
}

export function TestDetails({ t }: { t: TestCard }) {
  const row = (k: string, v: React.ReactNode) => (
    <div className="border-b border-line py-2 last:border-0"><dt className="text-muted">{k}</dt><dd className="m-0">{v}</dd></div>
  );
  const list = (items: string[]) => <ul className="list-disc pl-5">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
  return (
    <dl className="text-sm">
      {row("Zweck", t.purpose)}
      {row(`Weist nach (${t.scope})`, t.scopeText)}
      {row("Geeignete Moleküle", t.suitable)}
      {row("Reagenzien", t.reagents)}
      {row("Reaktionsprinzip", t.principle)}
      {row("Durchführung auf Schulniveau", <ol className="list-decimal pl-5">{t.procedure.map((s) => <li key={s}>{s}</li>)}</ol>)}
      {row("Erwartete Beobachtung", `${t.observation} Farbe: ${t.colour}`)}
      {row("Positives Ergebnis", t.positive)}
      {row("Negatives Ergebnis", t.negative)}
      {row("Einschränkungen", list(t.limits))}
      {row("Mögliche Fehlinterpretationen", list(t.misreadings))}
      <div className="mt-2 rounded-xl border border-warn p-3">
        <dt className="font-medium text-warn">Sicherheit</dt>
        <dd className="m-0">
          {list(t.hazards)}
          {t.ghs && <p className="mt-1">GHS-Angabe aus einer Herstellerquelle: {t.ghs}</p>}
          <p className="mt-1">{t.ppe}</p>
          <p>{t.disposal}</p>
          <p className="mt-1 text-xs text-muted">{SDB_NOTE}</p>
        </dd>
      </div>
      {row("Quellen", t.sources.length ? (
        <ul className="list-disc pl-5">
          {t.sources.map((s) => { const [label, url] = s.split("|"); return <li key={url}><a className="break-words text-accent underline" href={url} target="_blank" rel="noreferrer">{label}</a></li>; })}
        </ul>
      ) : "Keine geprüfte Online-Quelle hinterlegt; Inhalt entspricht allgemeinem Lehrbuchwissen."
      )}
    </dl>
  );
}

/** Zeigt für ein Molekülprofil das erwartete Ergebnis aller Tests; Details klappen auf. */
export default function TestPanel({ profile }: { profile: Profile }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5" aria-label="Nachweisreaktionen">
      <h3 className="text-lg font-semibold">Nachweisreaktionen für {profile.label}</h3>
      <p className="mt-1 text-xs text-muted">Erwartetes Ergebnis unter kontrollierten Schulbedingungen, abgeleitet aus der Struktur. Reaktionszeit, Konzentration, Temperatur, Reinheit und Störstoffe können das Ergebnis verändern.</p>
      <ul className="mt-3 grid gap-2">
        {TESTS.map((t) => {
          const e = evaluate(t.id, profile);
          return (
            <li key={t.id} className="rounded-xl border border-line">
              <details>
                <summary className="flex min-h-12 cursor-pointer flex-wrap items-center justify-between gap-2 p-3">
                  <span className="font-medium">{t.name}</span>
                  <Badge r={e.rating} />
                </summary>
                <div className="border-t border-line p-3">
                  <p className="text-sm"><span className="font-medium">Direkt:</span> {e.reason}</p>
                  {e.afterHydrolysis && (
                    <p className="mt-1 text-sm"><span className="font-medium">Nach Hydrolyse:</span> <Badge r={e.afterHydrolysis.rating} /> {e.afterHydrolysis.reason}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">Dieser Test weist {t.scope === "Molekül" ? "ein bestimmtes Molekül" : t.scope === "Stoffgruppe" ? "nur eine Stoffgruppe" : "nichts allein"} nach: {t.scopeText}</p>
                  <details className="mt-3"><summary className="min-h-10 cursor-pointer text-accent">Informationskarte mit Durchführung und Sicherheit</summary><div className="mt-2"><TestDetails t={t} /></div></details>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
