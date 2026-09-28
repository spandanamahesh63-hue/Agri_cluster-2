import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import type { CropListing } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useBuyer } from "../../features/buyer/useBuyer";
import { isAvailable } from "../../features/buyer/matching";
import { ListingRow } from "../../features/buyer/ListingRow";
import { ListingDetailDialog } from "../../features/buyer/ListingDetailDialog";
import { SendInterestDialog } from "../../features/buyer/SendInterestDialog";
import { activeFilterCount, emptyFilters, filterListings, listingMethod, listingVillage, type SupplyFilters } from "../../features/buyer/listingFilters";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { SourceBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { SelectInput, TextInput } from "../../components/forms/fields";
import { formatDateRange } from "../../utils/format";

const quantityOptions = [0, 0.5, 1, 2, 5];

export function CropSupplyPage() {
  const b = useBuyer();
  const { savedListings } = useAppStore();
  const [params] = useSearchParams();
  const [f, setF] = useState<SupplyFilters>({ ...emptyFilters, q: params.get("q") ?? "", savedOnly: params.get("saved") === "1" });
  const [viewing, setViewing] = useState<CropListing | null>(null);
  const [interestIn, setInterestIn] = useState<CropListing | null>(null);
  const set = <K extends keyof SupplyFilters>(k: K, v: SupplyFilters[K]) => setF((x) => ({ ...x, [k]: v }));

  const open = useMemo(() => b.listings.filter((l) => isAvailable(l) && !l.requirementId), [b.listings]);
  const villages = useMemo(() => [...new Set(open.map(listingVillage).filter((v): v is string => !!v))].sort(), [open]);
  const methods = useMemo(() => [...new Set(open.map(listingMethod).filter((m): m is string => !!m))].sort(), [open]);
  const listings = filterListings(open, f, savedListings);
  const active = activeFilterCount(f);

  const header = <PageHeader title="Crop supply" description="Search what farmers have listed, and see what the cluster will harvest soon." />;
  if (b.outlook.status === "loading") return <PageSkeleton />;
  if (b.outlook.status === "error")
    return (
      <>
        {header}
        <ErrorState onRetry={b.outlook.retry} />
      </>
    );

  const cropWords = f.q.trim().toLowerCase();
  const outlook = b.outlook.data.filter((o) => !cropWords || o.crop.toLowerCase().includes(cropWords) || cropWords.includes(o.crop.toLowerCase()));
  const myInterest = (l: CropListing) => b.interests.find((i) => i.listingId === l.id);

  return (
    <>
      {header}
      <Card className="mb-6 p-4">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <label htmlFor="supply-q" className="sr-only">
            Search crops
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
            <TextInput id="supply-q" type="search" placeholder="Search crops, e.g. tomato grade A" value={f.q} onChange={(e) => set("q", e.target.value)} className="pl-9" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Filter label="Location" id="f-village">
              <SelectInput id="f-village" value={f.village} onChange={(e) => set("village", e.target.value)}>
                <option value="">Any village</option>
                {villages.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </SelectInput>
            </Filter>
            <Filter label="Quantity" id="f-qty">
              <SelectInput id="f-qty" value={f.minTonnes} onChange={(e) => set("minTonnes", Number(e.target.value))}>
                {quantityOptions.map((q) => (
                  <option key={q} value={q}>
                    {q === 0 ? "Any quantity" : `At least ${q} t`}
                  </option>
                ))}
              </SelectInput>
            </Filter>
            <Filter label="Quality" id="f-grade">
              <SelectInput id="f-grade" value={f.grade} onChange={(e) => set("grade", e.target.value as SupplyFilters["grade"])}>
                <option value="">Any grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </SelectInput>
            </Filter>
            <Filter label="Available by" id="f-date">
              <TextInput id="f-date" type="date" value={f.availableBy} onChange={(e) => set("availableBy", e.target.value)} />
            </Filter>
            <Filter label="Farming method" id="f-method" className="col-span-2 md:col-span-1">
              <SelectInput id="f-method" value={f.method} onChange={(e) => set("method", e.target.value)}>
                <option value="">Any method</option>
                {methods.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </SelectInput>
            </Filter>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-brand-700" checked={f.savedOnly} onChange={(e) => set("savedOnly", e.target.checked)} />
              Saved listings only ({savedListings.length})
            </label>
            {active > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setF(emptyFilters)}>
                Clear {active} filter{active === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Listed by farmers"
            subtitle={`${listings.length} of ${open.length} listing${open.length === 1 ? "" : "s"} · only farmer-approved details are shown`}
            action={<SourceBadge source="demo" />}
          />
          {listings.length === 0 ? (
            <EmptyState
              title={f.savedOnly && savedListings.length === 0 ? "No saved listings yet" : "No listings match"}
              description={f.savedOnly && savedListings.length === 0 ? "Use the bookmark on a listing to save it here." : "Try fewer filters, or check the expected cluster harvest."}
              action={
                active > 0 ? (
                  <Button size="sm" variant="secondary" onClick={() => setF(emptyFilters)}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="mt-2 divide-y divide-line" aria-live="polite">
              {listings.map((l) => (
                <ListingRow key={l.id} listing={l} myInterest={myInterest(l)} onView={() => setViewing(l)} onInterest={() => setInterestIn(l)} />
              ))}
            </ul>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Expected cluster harvest" subtitle="From member farms' crop plans" action={<SourceBadge source="indicative" />} />
          <div className="overflow-x-auto">
            <table className="mt-3 w-full text-[13px]">
              <thead>
                <tr className="border-y border-line text-left text-ink-muted">
                  <th scope="col" className="px-5 py-2 font-medium">Window</th>
                  <th scope="col" className="px-5 py-2 font-medium">Crop</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">Expected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line tabular-nums">
                {outlook.map((o) => (
                  <tr key={`${o.crop}-${o.grade}-${o.window.start}`}>
                    <td className="whitespace-nowrap px-5 py-2">{formatDateRange(o.window.start, o.window.end)}</td>
                    <td className="px-5 py-2">
                      {o.crop} · {o.grade}
                      <span className="block text-[12px] text-ink-muted">{o.farms} farms</span>
                    </td>
                    <td className="px-5 py-2 text-right font-medium">{o.expectedTonnes} t</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {viewing && (
        <ListingDetailDialog
          listing={viewing}
          myInterest={myInterest(viewing)}
          onClose={() => setViewing(null)}
          onRequest={() => {
            setInterestIn(viewing);
            setViewing(null);
          }}
        />
      )}
      {interestIn && <SendInterestDialog listing={interestIn} onClose={() => setInterestIn(null)} />}
    </>
  );
}

function Filter({ label, id, className, children }: { label: string; id: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
