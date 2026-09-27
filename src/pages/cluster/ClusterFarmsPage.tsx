import { useMemo, useState } from "react";
import type { ClusterFarm } from "../../types";
import { ClusterPage } from "../../features/cluster/ClusterPage";
import { ClusterMap, type MapMode } from "../../features/cluster/ClusterMap";
import type { ClusterView } from "../../features/cluster/useClusterView";
import { stageLabel } from "../../services/intelligence/engine";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { FilterChips } from "../../components/navigation/FilterChips";
import { SelectInput } from "../../components/forms/fields";
import { formatAcres, formatDateRange } from "../../utils/format";

type AlertFilter = "all" | "alerts" | "stress" | "irrigation" | "inactive";
const PAGE = 20;

export function ClusterFarmsPage() {
  return (
    <ClusterPage title="Farms" description="Where are the farms, what are they growing, and which need attention?">
      {(v) => <Farms v={v} />}
    </ClusterPage>
  );
}

function Farms({ v }: { v: ClusterView }) {
  const [mode, setMode] = useState<MapMode>("alerts");
  const [selected, setSelected] = useState<ClusterFarm | null>(null);
  const [village, setVillage] = useState("all");
  const [crop, setCrop] = useState("all");
  const [alert, setAlert] = useState<AlertFilter>("all");
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(
    () =>
      v.farms.filter(
        (f) =>
          (village === "all" || f.village === village) &&
          (crop === "all" || f.crop === crop) &&
          (alert === "all" ||
            (alert === "alerts" && (f.possibleStress || f.irrigationBeforeRain)) ||
            (alert === "stress" && f.possibleStress) ||
            (alert === "irrigation" && f.irrigationBeforeRain) ||
            (alert === "inactive" && !f.active)),
      ),
    [v.farms, village, crop, alert],
  );
  const crops = [...new Set(v.farms.map((f) => f.crop))];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Cluster map"
            subtitle="Select a farm for details"
            action={
              <FilterChips<MapMode>
                label="Colour farms by"
                value={mode}
                onChange={setMode}
                options={[
                  { id: "alerts", label: "Alerts" },
                  { id: "crop", label: "Crop" },
                ]}
              />
            }
          />
          <div className="p-4">
            <ClusterMap
              farms={v.farms}
              villages={v.villages}
              infrastructure={v.infrastructure}
              mode={mode}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          </div>
        </Card>

        <Card className="self-start">
          <CardHeader title={selected ? selected.label : "Farm details"} subtitle={selected ? selected.village : "No farm selected"} action={<SourceBadge source="demo" />} />
          {selected ? (
            <FarmDetails farm={selected} />
          ) : (
            <EmptyState title="Select a farm on the map" description="Or pick one from the list below. Farms are shown by label only, to protect farmers' privacy." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="All farms" subtitle={`${rows.length} of ${v.farms.length} farms`} />
        <div className="flex flex-wrap items-end gap-3 px-5 pt-4">
          <label className="text-[12px] text-ink-muted">
            Village
            <SelectInput className="mt-1 h-9 w-40" value={village} onChange={(e) => (setVillage(e.target.value), setLimit(PAGE))}>
              <option value="all">All villages</option>
              {v.villages.map((x) => (
                <option key={x.name}>{x.name}</option>
              ))}
            </SelectInput>
          </label>
          <label className="text-[12px] text-ink-muted">
            Crop
            <SelectInput className="mt-1 h-9 w-44" value={crop} onChange={(e) => (setCrop(e.target.value), setLimit(PAGE))}>
              <option value="all">All crops</option>
              {crops.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          </label>
          <FilterChips<AlertFilter>
            label="Status"
            value={alert}
            onChange={(a) => (setAlert(a), setLimit(PAGE))}
            options={[
              { id: "all", label: "All" },
              { id: "alerts", label: "Any alert" },
              { id: "stress", label: "Crop stress" },
              { id: "irrigation", label: "Irrigation before rain" },
              { id: "inactive", label: "Inactive" },
            ]}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState title="No farms match these filters" />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-[13px]">
              <thead>
                <tr className="border-y border-line text-left text-ink-muted">
                  {["Farm", "Village", "Crop", "Area", "Moisture / need", "Health", "Status"].map((h) => (
                    <th key={h} scope="col" className="px-5 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line tabular-nums">
                {rows.slice(0, limit).map((f) => (
                  <tr key={f.id} className={f.id === selected?.id ? "bg-brand-50" : undefined}>
                    <td className="px-5 py-2.5">
                      <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => setSelected(f)}>
                        {f.label}
                      </button>
                    </td>
                    <td className="px-5 py-2.5">{f.village}</td>
                    <td className="px-5 py-2.5">{f.crop}</td>
                    <td className="px-5 py-2.5">{f.acres} ac</td>
                    <td className="px-5 py-2.5">
                      {f.soilMoisturePct}% / {f.minSoilMoisture}%
                    </td>
                    <td className="px-5 py-2.5">{f.healthScore}</td>
                    <td className="px-5 py-2.5">
                      <FarmStatus farm={f} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > limit && (
          <div className="border-t border-line p-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
              Show {Math.min(PAGE, rows.length - limit)} more
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function FarmStatus({ farm }: { farm: ClusterFarm }) {
  if (!farm.active) return <Badge>Inactive</Badge>;
  return (
    <span className="flex flex-wrap gap-1">
      {farm.possibleStress && <Badge tone="danger">Possible stress</Badge>}
      {farm.irrigationBeforeRain && <Badge tone="water">Irrigation before rain</Badge>}
      {!farm.possibleStress && !farm.irrigationBeforeRain && <span className="text-ink-subtle">No alert</span>}
    </span>
  );
}

function FarmDetails({ farm }: { farm: ClusterFarm }) {
  const rows: [string, string][] = [
    ["Crop", `${farm.crop} · ${stageLabel(farm.stage).toLowerCase()}`],
    ["Area", formatAcres(farm.acres)],
    ["Harvest window", formatDateRange(farm.harvestWindow.start, farm.harvestWindow.end)],
    ["Expected", `${farm.expectedTonnes} t · Grade ${farm.grade}`],
    ["Soil moisture", `${farm.soilMoisturePct}% (needs ≥ ${farm.minSoilMoisture}%)`],
    ["Health index", `${farm.healthScore}`],
    ["Pump", farm.solarPump ? "Solar + grid" : "Grid"],
  ];
  return (
    <div className="px-5 pb-5 pt-3">
      <div className="mb-3">
        <FarmStatus farm={farm} />
      </div>
      <dl className="divide-y divide-line text-[13px]">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="text-right font-medium">{val}</dd>
          </div>
        ))}
      </dl>
      <InfoNote className="mt-3">The farmer's name is not shown. Contact goes through the cluster office.</InfoNote>
    </div>
  );
}
