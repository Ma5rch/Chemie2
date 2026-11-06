import type { Visual } from "@/lib/compare";
import Fischer from "./Fischer";
import Haworth from "./Haworth";
import GlycanSvg from "./GlycanSvg";

export default function StructureVisual({ v }: { v: Visual }) {
  if (!v) return <p className="rounded-xl border border-line p-3 text-sm text-muted">Für diesen Stoff gibt es keine feste Struktur, die gezeichnet werden könnte.</p>;
  if (v.type === "fischer") return <Fischer sugar={v.sugar} />;
  if (v.type === "haworth") return <Haworth sugar={v.sugar} ring={v.ring} anomer={v.anomer} />;
  return <div className="overflow-x-auto"><GlycanSvg glycan={v.glycan} /></div>;
}
