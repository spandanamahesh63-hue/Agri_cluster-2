import { Bookmark } from "lucide-react";
import type { CropListing, MarketInterest } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { sellerLabel } from "../shared/identity";
import { listingMethod, listingShare, listingVillage } from "./listingFilters";
import { formatDate } from "../../utils/format";

/** A farmer listing as a buyer sees it, with the buyer's own request status. */
export function ListingRow({
  listing,
  myInterest,
  onInterest,
  onView,
}: {
  listing: CropListing;
  myInterest?: MarketInterest;
  onInterest: () => void;
  onView?: () => void;
}) {
  const { farmerProfile, savedListings, toggleSaved } = useAppStore();
  const share = listingShare(listing);
  const place = listingVillage(listing) ?? "Village shared on request";
  const method = listingMethod(listing);
  const saved = savedListings.includes(listing.id);
  const title = `${listing.quantityTonnes} t ${listing.crop.toLowerCase()} · Grade ${listing.grade}`;
  return (
    <li className="flex flex-col gap-2 px-5 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="font-medium">
          {title} <span className="font-normal text-ink-muted">· {sellerLabel(listing, farmerProfile)}</span>
        </div>
        <div className="text-ink-muted">
          From {formatDate(listing.availableFrom)}
          {listing.availableUntil && ` to ${formatDate(listing.availableUntil)}`} · asking ₹{listing.expectedPricePerKg}/kg · {place}
          {share.photos && listing.photoCount > 0 && ` · ${listing.photoCount} photo${listing.photoCount > 1 ? "s" : ""}`}
          {share.photos && listing.hasVideo && " · video"}
        </div>
        {method || listing.description ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {method && <Badge tone="crop">{method}</Badge>}
            {listing.description && <span className="text-ink-muted">{listing.description}</span>}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start sm:self-auto">
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
          title={saved ? "Saved" : "Save listing"}
          onClick={() => toggleSaved(listing.id)}
          className="grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink"
        >
          <Bookmark aria-hidden className={saved ? "size-4 fill-current text-brand-700" : "size-4"} />
        </button>
        {onView && (
          <Button size="sm" variant="ghost" onClick={onView}>
            View crop
          </Button>
        )}
        {myInterest ? (
          <Badge tone={myInterest.status === "accepted" ? "success" : myInterest.status === "declined" ? "neutral" : "market"}>
            {myInterest.status === "accepted" ? "Farmer accepted" : myInterest.status === "declined" ? "Farmer declined" : "Request sent"}
          </Badge>
        ) : listing.status === "agreed" ? (
          <Badge>Sold to another buyer</Badge>
        ) : (
          <Button size="sm" variant="secondary" onClick={onInterest}>
            Request farmer
          </Button>
        )}
      </div>
    </li>
  );
}
