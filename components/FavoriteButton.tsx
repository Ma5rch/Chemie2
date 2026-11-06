"use client";

import { useState } from "react";
import { addFavorite, type FavoriteKind } from "@/lib/store";

export default function FavoriteButton({ kind, title, data, label = "Zu Favoriten", snapshot }: { kind: FavoriteKind; title: string; data: string; label?: string; snapshot?: string }) {
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  async function save() {
    try { await addFavorite(kind, title, data, snapshot); setState("saved"); } catch { setState("error"); }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={save} className="min-h-10 rounded-xl border border-line px-4 text-sm">{label}</button>
      <span aria-live="polite" className="text-xs text-muted">
        {state === "saved" && "Gespeichert"}
        {state === "error" && "Speichern nicht möglich (z. B. privater Modus)"}
      </span>
    </span>
  );
}
