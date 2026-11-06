import { haworth, type Anomer, type Sugar } from "@/lib/sugars";

type P = [number, number];
// Ringatome in Haworth-Perspektive; Ringsauerstoff hinten rechts.
const PYRANOSE: Record<number, P> = { 5: [110, 100], 1: [250, 150], 2: [200, 200], 3: [110, 200], 4: [60, 150] };
const PYRANOSE_O: P = [200, 100];
const FURANOSE: Record<number, P> = { 2: [235, 150], 3: [205, 215], 4: [105, 215], 5: [75, 150] };
const FURANOSE_O: P = [155, 105];

export default function Haworth({ sugar, ring, anomer }: { sugar: Sugar; ring: "pyranose" | "furanose"; anomer: Anomer }) {
  const sub = haworth(sugar, ring, anomer);
  const atoms = ring === "pyranose" ? PYRANOSE : FURANOSE;
  const o = ring === "pyranose" ? PYRANOSE_O : FURANOSE_O;
  const order = ring === "pyranose" ? [5, "O", 1, 2, 3, 4] : [5, "O", 2, 3, 4];
  const pts = order.map((k) => (k === "O" ? o : atoms[k as number]));
  // vordere Bindung (vom Betrachter aus) hervorgehoben
  const front: [number, number] = ring === "pyranose" ? [2, 3] : [3, 4];
  const L = 42;
  return (
    <svg viewBox="0 0 320 320" role="img" aria-label={`Haworth-Projektion ${anomer}-${sugar.de}`} className="mx-auto h-auto w-full max-w-[340px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <polygon points={pts.map((p) => p.join(",")).join(" ")} strokeWidth="2" />
      <line x1={atoms[front[0]][0]} y1={atoms[front[0]][1]} x2={atoms[front[1]][0]} y2={atoms[front[1]][1]} strokeWidth="6" />
      <text x={o[0]} y={o[1] + 5} textAnchor="middle" fontSize="16" fill="currentColor" stroke="none" style={{ paintOrder: "stroke" }}>O</text>
      {Object.entries(sub).map(([k, g]) => {
        const [x, y] = atoms[Number(k)];
        return (
          <g key={k}>
            <line x1={x} y1={y} x2={x} y2={y - L} />
            <line x1={x} y1={y} x2={x} y2={y + L} />
            <text x={x} y={y - L - 6} textAnchor="middle" fontSize="15" fill="currentColor" stroke="none">{g.up}</text>
            <text x={x} y={y + L + 17} textAnchor="middle" fontSize="15" fill="currentColor" stroke="none">{g.down}</text>
            <text x={x + (Number(k) === 1 || Number(k) === 2 && ring === "furanose" ? 12 : -12)} y={y + 5} textAnchor={Number(k) === 1 || (Number(k) === 2 && ring === "furanose") ? "start" : "end"} fontSize="11" fill="var(--muted)" stroke="none">C{k}</text>
          </g>
        );
      })}
    </svg>
  );
}
