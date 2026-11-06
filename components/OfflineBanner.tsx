"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (!offline) return null;
  return (
    <p role="status" className="border-b border-warn bg-card px-4 py-2 text-center text-sm text-warn">
      Du bist offline. Abfragen bei PubChem sind nicht möglich. Gespeicherte Favoriten, Baukasten, Nachweisreaktionen, Identifikator, Vergleich und Lernmodus funktionieren weiter.
    </p>
  );
}
