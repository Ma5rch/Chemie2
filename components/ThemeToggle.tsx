"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const LABEL: Record<Theme, string> = { system: "System", light: "Hell", dark: "Dunkel" };

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try { const t = localStorage.getItem("ce-theme"); if (t === "light" || t === "dark") setTheme(t); } catch { /* optional */ }
  }, []);
  function apply(t: Theme) {
    setTheme(t);
    try { t === "system" ? localStorage.removeItem("ce-theme") : localStorage.setItem("ce-theme", t); } catch { /* optional */ }
    t === "system" ? document.documentElement.removeAttribute("data-theme") : document.documentElement.setAttribute("data-theme", t);
  }
  return (
    <div role="group" aria-label="Darstellung" className="flex gap-2">
      {(Object.keys(LABEL) as Theme[]).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => apply(t)}
          className={`min-h-11 flex-1 rounded-xl border px-4 text-sm font-medium ${theme === t ? "border-accent bg-accent text-paper" : "border-line"}`}>{LABEL[t]}</button>
      ))}
    </div>
  );
}
