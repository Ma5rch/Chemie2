import type { Sugar } from "@/lib/sugars";

/** Fischer-Projektion der offenkettigen D-Form, erzeugt aus dem Konfigurationsmodell. */
export default function Fischer({ sugar }: { sugar: Sugar }) {
  const aldose = sugar.type === "aldose";
  const top = aldose ? ["CHO"] : ["CH2OH", "C=O"];
  const labels = [...top, ...sugar.fischer, "CH2OH"];
  // Zeilen: Index 0.. ; Stereozentren erhalten Seitengruppen
  const firstStereo = top.length;
  const y0 = 30, dy = 46, cx = 110;
  const height = y0 + dy * (labels.length - 1) + 30;
  const num = (i: number) => (aldose ? i + 1 : i + 1);
  return (
    <svg viewBox={`0 0 220 ${height}`} role="img" aria-label={`Fischer-Projektion ${sugar.de}`} className="mx-auto h-auto w-full max-w-[240px]" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1={cx} y1={y0} x2={cx} y2={y0 + dy * (labels.length - 1)} />
      {labels.map((l, i) => {
        const y = y0 + dy * i;
        const stereo = i >= firstStereo && i < labels.length - 1;
        const side = stereo ? sugar.fischer[i - firstStereo] : null;
        return (
          <g key={i}>
            {stereo && (
              <>
                <line x1={cx - 34} y1={y} x2={cx + 34} y2={y} />
                <text x={side === "L" ? cx - 40 : cx + 40} y={y + 5} textAnchor={side === "L" ? "end" : "start"} fill="currentColor" stroke="none" fontSize="15">OH</text>
                <text x={side === "L" ? cx + 40 : cx - 40} y={y + 5} textAnchor={side === "L" ? "start" : "end"} fill="currentColor" stroke="none" fontSize="15">H</text>
              </>
            )}
            {!stereo && (
              <text x={cx} y={y - 8} textAnchor="middle" fill="currentColor" stroke="none" fontSize="15">{l}</text>
            )}
            <text x="6" y={y + 5} fill="var(--muted)" stroke="none" fontSize="11">C{num(i)}</text>
          </g>
        );
      })}
    </svg>
  );
}
