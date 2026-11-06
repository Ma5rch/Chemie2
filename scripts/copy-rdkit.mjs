// Kopiert RDKit.js (JS + WebAssembly) nach public/rdkit, damit es statisch ausgeliefert wird.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const src = "node_modules/@rdkit/rdkit/dist";
if (!existsSync(src)) {
  console.warn("RDKit nicht gefunden, Kopieren übersprungen.");
  process.exit(0);
}
mkdirSync("public/rdkit", { recursive: true });
for (const f of ["RDKit_minimal.js", "RDKit_minimal.wasm"]) {
  copyFileSync(`${src}/${f}`, `public/rdkit/${f}`);
}
console.log("RDKit nach public/rdkit kopiert.");
