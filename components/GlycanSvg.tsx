import { SUGAR_INFO, childrenOf, depths, rootOf, type Glycan, type SugarKey } from "@/lib/glycan";

const COLORS: Record<SugarKey, { fill: string; text: string }> = {
  glucose: { fill: "#0072bc", text: "#ffffff" },
  galactose: { fill: "#ffd400", text: "#1b2a30" },
  mannose: { fill: "#00a651", text: "#ffffff" },
  fructose: { fill: "#00a651", text: "#ffffff" },
};
const sym = (a: string) => (a === "alpha" ? "α" : a === "beta" ? "β" : "");

/** Schematische Glykan-Darstellung (Farben nach SNFG, zusätzlich mit Textkürzel). Wurzel rechts. */
export default function GlycanSvg({ glycan, selected, onSelect }: { glycan: Glycan; selected?: string | null; onSelect?: (id: string) => void }) {
  const root = rootOf(glycan);
  if (!root) return null;
  const d = depths(glycan);
  const maxD = Math.max(...Object.values(d));
  const pos: Record<string, { x: number; y: number }> = {};
  let leaf = 0;
  const place = (id: string) => {
    const kids = childrenOf(glycan, id);
    kids.forEach((l) => place(l.donor));
    const y = kids.length ? kids.reduce((s, l) => s + pos[l.donor].y, 0) / kids.length : 40 + 70 * leaf++;
    pos[id] = { x: 50 + (maxD - d[id]) * 120, y };
  };
  place(root.id);
  const w = 100 + maxD * 120;
  const h = 80 + 70 * Math.max(0, leaf - 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Schematische Glykan-Darstellung" className="h-auto w-full" style={{ maxWidth: Math.max(w, 220) * 1.4 }}>
      {glycan.links.map((l) => {
        const a = pos[l.donor], b = pos[l.acceptor];
        const donor = glycan.residues.find((r) => r.id === l.donor)!;
        return (
          <g key={`${l.donor}-${l.acceptor}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth="2" />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} textAnchor="middle" fontSize="12" fill="currentColor">{sym(donor.anomer)}{l.donorPos}-{l.acceptorPos}</text>
          </g>
        );
      })}
      {glycan.residues.map((r) => {
        const { x, y } = pos[r.id];
        const c = COLORS[r.sugar];
        const isSel = selected === r.id;
        const shape = SUGAR_INFO[r.sugar].type === "ketose"
          ? <polygon points={[0, 1, 2, 3, 4].map((i) => `${x + 21 * Math.sin((i * 2 * Math.PI) / 5)},${y - 21 * Math.cos((i * 2 * Math.PI) / 5)}`).join(" ")} fill={c.fill} stroke={isSel ? "var(--accent)" : "currentColor"} strokeWidth={isSel ? 4 : 1.5} />
          : <circle cx={x} cy={y} r={19} fill={c.fill} stroke={isSel ? "var(--accent)" : "currentColor"} strokeWidth={isSel ? 4 : 1.5} />;
        return (
          <g key={r.id} role="button" tabIndex={0} aria-label={`${SUGAR_INFO[r.sugar].abbr}, Baustein auswählen`} aria-pressed={isSel}
            style={{ cursor: onSelect ? "pointer" : "default" }}
            onClick={() => onSelect?.(r.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(r.id); } }}>
            {shape}
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={c.text}>{SUGAR_INFO[r.sugar].abbr}</text>
          </g>
        );
      })}
    </svg>
  );
}
