import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "/lernen", title: "Lernmodus", text: "Aufgaben zu Strukturen, Isomeren, Anomeren, Bindungen und Nachweisreaktionen mit Erklärung." },
  { href: "/identifikator", title: "Kohlenhydrat-Identifikator", text: "Unbekannte Probe anhand von Nachweisreaktionen eingrenzen." },
  { href: "/vergleich", title: "Molekülvergleich", text: "Zwei oder drei Moleküle gegenüberstellen, Unterschiede werden hervorgehoben." },
  { href: "/favoriten", title: "Favoriten und Daten", text: "Gespeicherte Moleküle und Strukturen, Export und Import." },
];

export default function Mehr() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mehr</h1>
      <ul className="mt-4 grid gap-2">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block rounded-2xl border border-line bg-card p-4">
              <span className="font-medium">{l.title}</span>
              <span className="block text-sm text-muted">{l.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-6 rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-2 font-medium">Darstellung</h2>
        <ThemeToggle />
      </section>
    </main>
  );
}
