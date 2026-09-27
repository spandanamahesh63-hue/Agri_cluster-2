import { useState } from "react";
import type { CropListing } from "../../types";
import { useBuyer } from "../../features/buyer/useBuyer";
import { isAvailable } from "../../features/buyer/matching";
import { ListingRow } from "../../features/buyer/ListingRow";
import { SendInterestDialog } from "../../features/buyer/SendInterestDialog";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { SourceBadge } from "../../components/ui/Badge";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { FilterChips } from "../../components/navigation/FilterChips";
import { formatDateRange } from "../../utils/format";

export function CropSupplyPage() {
  const b = useBuyer();
  const [crop, setCrop] = useState("all");
  const [interestIn, setInterestIn] = useState<CropListing | null>(null);
  const header = <PageHeader title="Crop supply" description="What crops are listed now, and what will the cluster harvest soon?" />;
  if (b.outlook.status === "loading") return <PageSkeleton />;
  if (b.outlook.status === "error")
    return (
      <>
        {header}
        <ErrorState onRetry={b.outlook.retry} />
      </>
    );

  const crops = ["Tomato", "Chilli", "Onion", "Leafy vegetables"];
  const listings = b.listings.filter((l) => isAvailable(l) && !l.requirementId && (crop === "all" || l.crop === crop));
  const outlook = b.outlook.data.filter((o) => crop === "all" || o.crop === crop);

  return (
    <>
      {header}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips label="Crop" value={crop} onChange={setCrop} options={[{ id: "all", label: "All crops" }, ...crops.map((c) => ({ id: c, label: c }))]} />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Listed by farmers" subtitle="Available to any buyer" action={<SourceBadge source="demo" />} />
          {listings.length === 0 ? (
            <EmptyState title="No listings for this crop yet" />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {listings.map((l) => (
                <ListingRow key={l.id} listing={l} myInterest={b.interests.find((i) => i.listingId === l.id)} onInterest={() => setInterestIn(l)} />
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
      {interestIn && <SendInterestDialog listing={interestIn} onClose={() => setInterestIn(null)} />}
    </>
  );
}
