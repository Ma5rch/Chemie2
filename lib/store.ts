// Lokale Speicherung per IndexedDB (kostenlos, ohne Server).
const DB = "chemistry-explorer";
const VERSION = 2;

export type FavoriteKind = "query" | "structure" | "glycan";
export type Favorite = { id: string; kind: FavoriteKind; title: string; data: string; savedAt: number; snapshot?: string };
export type Recent = { query: string; at: number };
export type Progress = { id: string; correct: number; total: number; lastAt: number };
export type ExportFile = { app: "chemistry-explorer"; version: 1; exportedAt: number; favorites: Favorite[]; recent: Recent[]; progress: Progress[] };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("recent")) db.createObjectStore("recent", { keyPath: "query" });
      if (!db.objectStoreNames.contains("favorites")) db.createObjectStore("favorites", { keyPath: "id" });
      if (!db.objectStoreNames.contains("progress")) db.createObjectStore("progress", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAll<T>(store: string): Promise<T[]> {
  return open().then((db) => new Promise<T[]>((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  }));
}
function putMany<T>(store: string, items: T[]): Promise<void> {
  return open().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    items.forEach((i) => os.put(i));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

// ---- Zuletzt untersucht ----
export async function addRecent(query: string): Promise<void> {
  try { await putMany<Recent>("recent", [{ query, at: Date.now() }]); } catch { /* Speicherung ist optional */ }
}
export async function listRecent(limit = 8): Promise<string[]> {
  try { return (await getAll<Recent>("recent")).sort((a, b) => b.at - a.at).slice(0, limit).map((r) => r.query); } catch { return []; }
}

// ---- Favoriten ----
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `f${Date.now()}${Math.random().toString(36).slice(2)}`);

export async function listFavorites(): Promise<Favorite[]> {
  try { return (await getAll<Favorite>("favorites")).sort((a, b) => b.savedAt - a.savedAt); } catch { return []; }
}
/** Speichert einen Favoriten; gleiche Art und gleiche Daten werden nicht doppelt angelegt. */
export async function addFavorite(kind: FavoriteKind, title: string, data: string, snapshot?: string): Promise<Favorite> {
  const existing = (await listFavorites()).find((f) => f.kind === kind && f.data === data);
  const fav: Favorite = { id: existing?.id ?? newId(), kind, title: title.slice(0, 300), data, savedAt: Date.now(), ...(snapshot && snapshot.length <= 200000 ? { snapshot } : {}) };
  await putMany("favorites", [fav]);
  return fav;
}
export async function removeFavorite(id: string): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("favorites", "readwrite");
    tx.objectStore("favorites").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function getFavorite(id: string): Promise<Favorite | undefined> {
  return (await listFavorites()).find((f) => f.id === id);
}

// ---- Lernfortschritt (wird im Lernmodus genutzt) ----
export async function listProgress(): Promise<Progress[]> { try { return await getAll<Progress>("progress"); } catch { return []; } }
export async function saveProgress(p: Progress): Promise<void> { try { await putMany("progress", [p]); } catch { /* optional */ } }

// ---- Export und Import ----
export async function exportAll(): Promise<ExportFile> {
  const [favorites, recent, progress] = await Promise.all([listFavorites(), getAll<Recent>("recent").catch(() => []), listProgress()]);
  return { app: "chemistry-explorer", version: 1, exportedAt: Date.now(), favorites, recent, progress };
}

const isStr = (x: unknown, max: number): x is string => typeof x === "string" && x.length <= max;
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isFav = (x: any): x is Favorite =>
  !!x && isStr(x.id, 100) && x.id.length > 0 && ["query", "structure", "glycan"].includes(x.kind) && isStr(x.title, 300) && isStr(x.data, 200000) && isNum(x.savedAt) && (x.snapshot === undefined || isStr(x.snapshot, 200000));
const isRecent = (x: any): x is Recent => !!x && isStr(x.query, 500) && x.query.length > 0 && isNum(x.at);
const isProgress = (x: any): x is Progress => !!x && isStr(x.id, 200) && isNum(x.correct) && isNum(x.total) && isNum(x.lastAt);

/** Liest eine Exportdatei streng validiert ein. Die Inhalte werden nur gespeichert, nie ausgeführt. */
export async function importAll(text: string): Promise<{ added: number; skipped: number }> {
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { throw new Error("Die Datei ist kein gültiges JSON."); }
  if (!parsed || parsed.app !== "chemistry-explorer" || parsed.version !== 1) throw new Error("Die Datei stammt nicht aus Chemistry Explorer oder hat ein unbekanntes Format.");
  const take = <T,>(arr: unknown, ok: (x: any) => x is T): { good: T[]; bad: number } => {
    const list = Array.isArray(arr) ? arr.slice(0, 5000) : [];
    const good = list.filter(ok);
    return { good, bad: list.length - good.length };
  };
  const f = take(parsed.favorites, isFav), r = take(parsed.recent, isRecent), p = take(parsed.progress, isProgress);
  await putMany("favorites", f.good);
  await putMany("recent", r.good);
  await putMany("progress", p.good);
  return { added: f.good.length + r.good.length + p.good.length, skipped: f.bad + r.bad + p.bad };
}
