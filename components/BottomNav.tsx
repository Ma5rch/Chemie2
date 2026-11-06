"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Suche", also: [] as string[] },
  { href: "/editor", label: "Zeichnen", also: [] },
  { href: "/glycan", label: "Glykane", also: [] },
  { href: "/tests", label: "Tests", also: [] },
  { href: "/mehr", label: "Mehr", also: ["/identifikator", "/vergleich", "/favoriten", "/lernen"] },
];

/** iPhone: Leiste am unteren Rand. iPad/Desktop: Leiste oben. */
export default function BottomNav() {
  const path = usePathname() ?? "/";
  const active = (i: (typeof ITEMS)[number]) => (i.href === "/" ? path === "/" : [i.href, ...i.also].some((h) => path === h || path.startsWith(h + "/")));
  return (
    <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card md:sticky md:top-0 md:border-b md:border-t-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <ul className="mx-auto flex max-w-5xl justify-around md:justify-start md:gap-2 md:px-4">
        {ITEMS.map((i) => (
          <li key={i.href} className="flex-1 md:flex-none">
            <Link href={i.href} aria-current={active(i) ? "page" : undefined}
              className={`flex min-h-14 items-center justify-center border-t-2 px-3 text-sm font-medium md:min-h-12 md:border-b-2 md:border-t-0 ${active(i) ? "border-accent text-accent" : "border-transparent text-muted"}`}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
