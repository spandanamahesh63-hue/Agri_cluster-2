import { Bookmark, Image, Lock, Video } from "lucide-react";
import type { CropListing, MarketInterest } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Dialog } from "../../components/modals/Dialog";
import { Badge, InfoNote } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { sellerLabel } from "../shared/identity";
import { listingMethod, listingShare, listingVillage } from "./listingFilters";
import { formatDate, formatKg } from "../../utils/format";

/** "View crop": only what the farmer approved for buyers (spec §15, §19). */
export function ListingDetailDialog({
  listing,
  myInterest,
  onClose,
  onRequest,
}: {
  listing: CropListing;
  myInterest?: MarketInterest;
  onClose: () => void;
  onRequest: () => void;
}) {
  const { farmerProfile, savedListings, toggleSaved } = useAppStore();
  const share = listingShare(listing);
  const village = listingVillage(listing);
  const method = listingMethod(listing);
  const saved = savedListings.includes(listing.id);
  const canRequest = !myInterest && listing.status !== "agreed";
  const rows: [string, string][] = [
    ["Quantity", `${formatKg(listing.quantityTonnes)} (${listing.quantityTonnes} t)`],
    ["Grade", `Grade ${listing.grade}`],
    ["Harvest date", formatDate(listing.harvestDate)],
    ["Available", listing.availableUntil ? `${formatDate(listing.availableFrom)} to ${formatDate(listing.availableUntil)}` : `From ${formatDate(listing.availableFrom)}`],
    ["Asking price", `₹${listing.expectedPricePerKg}/kg`],
    ["Village", village ?? "Shared on request"],
    ["Farming method", method ?? "Not shared"],
    ["Seller", sellerLabel(listing, farmerProfile)],
  ];

  return (
    <Dialog
      title={`${listing.crop} · Grade ${listing.grade}`}
      description={`${formatKg(listing.quantityTonnes)}${village ? ` · ${village}` : ""}`}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            aria-pressed={saved}
            icon={<Bookmark aria-hidden className={saved ? "size-4 fill-current" : "size-4"} />}
            onClick={() => toggleSaved(listing.id)}
          >
            {saved ? "Saved" : "Save listing"}
          </Button>
          {canRequest ? (
            <Button onClick={onRequest}>Request farmer</Button>
          ) : (
            <Badge tone={myInterest?.status === "accepted" ? "success" : "market"}>
              {myInterest ? (myInterest.status === "accepted" ? "Farmer accepted" : myInterest.status === "declined" ? "Farmer declined" : "Request sent") : "Sold to another buyer"}
            </Badge>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-[13px]">
        {share.photos && (listing.photoCount > 0 || listing.hasVideo) ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: listing.photoCount }, (_, i) => (
              <div key={i} className="grid size-16 place-items-center rounded-lg bg-crop-soft text-crop" aria-label={`Photo ${i + 1} (placeholder)`} role="img">
                <Image aria-hidden className="size-5" />
              </div>
            ))}
            {listing.hasVideo && (
              <div className="grid size-16 place-items-center rounded-lg bg-sunken text-ink-muted" aria-label="Video (placeholder)" role="img">
                <Video aria-hidden className="size-5" />
              </div>
            )}
          </div>
        ) : null}
        {listing.description && <p>{listing.description}</p>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[12px] text-ink-subtle">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-2 rounded-lg bg-canvas px-3 py-2.5 text-ink-muted">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>Shown with the farmer's permission. Phone number, exact location and farm finances are never shared on a listing.</span>
        </div>
        <InfoNote>Photos and video are placeholders in this prototype.</InfoNote>
      </div>
    </Dialog>
  );
}
