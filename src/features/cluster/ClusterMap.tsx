import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CloudSun, Droplets, Store, Tractor, Warehouse, Truck } from "lucide-react";
import type { ClusterFarm, InfrastructureKind, InfrastructurePoint } from "../../types";
import { series } from "../../components/charts/palette";
import { stageLabel } from "../../services/intelligence/engine";

export type MapMode = "alerts" | "crop";

const W = 1000;
const H = 560;
const px = (p: { x: number; y: number }) => ({ x: (p.x / 100) * W, y: (p.y / 100) * H });

// Colour follows the crop (fixed order); a fourth crop folds into neutral "Other".
const cropColor: Record<string, string> = { Tomato: series[0], Chilli: series[1], Onion: series[2] };
const OTHER = "#a3aaa4";
const WATER = "#0f6a9c";
const STRESS = "#d03b3b";
const NORMAL = "#b9c0ba";

const infraIcon: Record<InfrastructureKind, LucideIcon> = {
  weather: CloudSun,
  water: Droplets,
  machinery: Tractor,
  storage: Warehouse,
  collection: Truck,
  market: Store,
};

interface Props {
  farms: ClusterFarm[];
  villages: { name: string; x: number; y: number }[];
  infrastructure: InfrastructurePoint[];
  mode: MapMode;
  selectedId?: string | null;
  onSelect?: (farm: ClusterFarm) => void;
}

export function ClusterMap({ farms, villages, infrastructure, mode, selectedId, onSelect }: Props) {
  const [hover, setHover] = useState<{ kind: "farm"; farm: ClusterFarm } | { kind: "infra"; point: InfrastructurePoint } | null>(null);
  const collection = infrastructure.find((i) => i.kind === "collection");
  const market = infrastructure.find((i) => i.kind === "market");

  const hoverPos = hover ? (hover.kind === "farm" ? hover.farm.pos : hover.point.pos) : null;
  const active = farms.filter((f) => f.active);
  const summary =
    `Simulated map, not to scale: ${farms.length} farms in ${villages.length} villages (${villages.map((v) => v.name).join(", ")}). ` +
    `${active.filter((f) => f.possibleStress).length} farms show possible crop stress and ${active.filter((f) => f.irrigationBeforeRain).length} plan irrigation before the rain. ` +
    `Farm details are in the farm list.`;

  return (
    <div className="space-y-3">
      {/* Fixed aspect ratio so percentage-positioned tooltips line up with SVG coordinates. */}
      <div className="relative aspect-[1000/560] w-full overflow-hidden rounded-lg border border-line bg-[#f7f8f4]">
        {/* One labelled image for assistive tech; the farm list and infrastructure list carry the same information accessibly. */}
        <svg viewBox={`0 0 ${W} ${H}`} className="size-full" role="img" aria-label={summary}>
          {/* Logistics flows: villages → collection centre → buyers */}
          {collection &&
            villages.map((v) => (
              <line key={v.name} {...line(px(v), px(collection.pos))} stroke="#d6dad3" strokeWidth={1.5} strokeDasharray="4 5" />
            ))}
          {collection && market && <line {...line(px(collection.pos), px(market.pos))} stroke="#a9b3ab" strokeWidth={2} strokeDasharray="6 5" />}

          {/* Village zones */}
          {villages.map((v) => {
            const c = px(v);
            return <ellipse key={v.name} cx={c.x} cy={c.y} rx={78} ry={62} fill="#eef1ea" />;
          })}

          {/* Farms */}
          {farms.map((f) => {
            const c = px(f.pos);
            const r = 4 + f.acres * 1.6;
            const selected = f.id === selectedId;
            return (
              <g
                key={f.id}
                data-farm={f.label}
                className={onSelect ? "cursor-pointer" : undefined}
                onMouseEnter={() => setHover({ kind: "farm", farm: f })}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect?.(f)}
              >
                {selected && <circle cx={c.x} cy={c.y} r={r + 5} fill="none" stroke="#17201b" strokeWidth={2} />}
                <FarmMark farm={f} mode={mode} x={c.x} y={c.y} r={r} />
                {/* generous invisible hit target */}
                <circle cx={c.x} cy={c.y} r={Math.max(r + 4, 12)} fill="transparent" />
              </g>
            );
          })}

          {/* Village names above the farms, with a halo so dots never hide them */}
          {villages.map((v) => {
            const c = px(v);
            return (
              <text
                key={v.name}
                x={c.x}
                y={c.y - 72}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                fill="#17201b"
                stroke="#f7f8f4"
                strokeWidth={4}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {v.name}
              </text>
            );
          })}

          {/* Shared infrastructure */}
          {infrastructure.map((p) => {
            const c = px(p.pos);
            const Icon = infraIcon[p.kind];
            return (
              <g key={p.id} onMouseEnter={() => setHover({ kind: "infra", point: p })} onMouseLeave={() => setHover(null)}>
                <rect x={c.x - 15} y={c.y - 15} width={30} height={30} rx={8} fill="#ffffff" stroke="#17201b" strokeWidth={1.5} />
                <Icon x={c.x - 9} y={c.y - 9} width={18} height={18} color="#17201b" strokeWidth={1.8} aria-hidden />
              </g>
            );
          })}
        </svg>

        {hover && hoverPos && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-56 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg border border-line bg-surface px-3 py-2 text-[12px] shadow-pop"
            style={{ left: `${hoverPos.x}%`, top: `${hoverPos.y}%` }}
          >
            {hover.kind === "farm" ? (
              <>
                <div className="font-medium text-ink">
                  {hover.farm.label} · {hover.farm.village}
                </div>
                <div className="text-ink-muted">
                  {hover.farm.crop}, {stageLabel(hover.farm.stage).toLowerCase()} · {hover.farm.acres} ac
                </div>
                <div className="text-ink-muted">
                  Moisture {hover.farm.soilMoisturePct}% · health {hover.farm.healthScore}
                </div>
                {hover.farm.possibleStress && <div className="font-medium text-danger">Possible crop stress</div>}
                {hover.farm.irrigationBeforeRain && <div className="font-medium text-water">Irrigation before rain</div>}
                {!hover.farm.active && <div className="text-ink-subtle">Not active this season</div>}
              </>
            ) : (
              <>
                <div className="font-medium text-ink">{hover.point.name}</div>
                <div className="text-ink-muted">{hover.point.detail}</div>
              </>
            )}
          </div>
        )}
      </div>
      <MapLegend mode={mode} />
      <ul className="sr-only" aria-label="Shared infrastructure on the map">
        {infrastructure.map((p) => (
          <li key={p.id}>
            {p.name}: {p.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FarmMark({ farm, mode, x, y, r }: { farm: ClusterFarm; mode: MapMode; x: number; y: number; r: number }) {
  if (!farm.active) return <circle cx={x} cy={y} r={r} fill="#ffffff" stroke={NORMAL} strokeWidth={1.5} />;
  if (mode === "crop") return <circle cx={x} cy={y} r={r} fill={cropColor[farm.crop] ?? OTHER} stroke="#ffffff" strokeWidth={2} />;
  if (farm.possibleStress) {
    const s = r * 1.35;
    return <polygon points={`${x},${y - s} ${x + s},${y + s * 0.8} ${x - s},${y + s * 0.8}`} fill={STRESS} stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />;
  }
  if (farm.irrigationBeforeRain) return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={2} fill={WATER} stroke="#ffffff" strokeWidth={2} />;
  return <circle cx={x} cy={y} r={r} fill={NORMAL} stroke="#ffffff" strokeWidth={2} />;
}

function MapLegend({ mode }: { mode: MapMode }) {
  const item = (swatch: ReactNode, label: string) => (
    <li key={label} className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        {swatch}
      </svg>
      {label}
    </li>
  );
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
      {mode === "alerts" ? (
        <>
          {item(<polygon points="7,1 13,12 1,12" fill={STRESS} />, "Possible crop stress")}
          {item(<rect x="1.5" y="1.5" width="11" height="11" rx="2" fill={WATER} />, "Irrigation before rain")}
          {item(<circle cx="7" cy="7" r="5.5" fill={NORMAL} />, "No alert")}
        </>
      ) : (
        <>
          {Object.entries(cropColor).map(([crop, color]) => item(<circle cx="7" cy="7" r="5.5" fill={color} />, crop))}
          {item(<circle cx="7" cy="7" r="5.5" fill={OTHER} />, "Other (leafy vegetables)")}
        </>
      )}
      {item(<circle cx="7" cy="7" r="5" fill="#fff" stroke={NORMAL} strokeWidth="1.5" />, "Inactive")}
      {item(<rect x="1" y="1" width="12" height="12" rx="3" fill="#fff" stroke="#17201b" />, "Shared infrastructure")}
      <li className="text-ink-subtle">Circle size = farm area · simulated layout, not to scale</li>
    </ul>
  );
}

function line(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}
