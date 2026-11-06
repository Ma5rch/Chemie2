"use client";

import { useEffect } from "react";

/** Registriert den Service Worker (nur in der Produktion) und stößt das Speichern der Hauptseiten an. */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const start = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const ready = await navigator.serviceWorker.ready;
        const worker = reg.active ?? ready.active;
        const done = sessionStorage.getItem("ce-precached");
        if (worker && !done) {
          worker.postMessage({ type: "precache" });
          sessionStorage.setItem("ce-precached", "1");
        }
      } catch { /* Offlinebetrieb ist optional */ }
    };
    if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
  }, []);
  return null;
}
