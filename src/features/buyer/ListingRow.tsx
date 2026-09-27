import type { CropListing, MarketInterest } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { sellerLabel } from "../shared/identity";
import { formatDate } from "../../utils/format";

/** A farmer listing as a buyer sees it, with the buyer's own interest status. */
export function ListingRow({ listing, myInterest, onInterest }: { listing: CropListing; myInterest?: MarketInterest; onInterest: () => void }) {
  const { farmerProfile } = useAppStore();
  return (
    <li className="flex flex-col gap-2 px-5 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-medium">
          {listing.quantityTonnes} t {listing.crop.toLowerCase()} · Grade {listing.grade}{" "}
          <span className="font-normal text-ink-muted">· {sellerLabel(listing, farmerProfile)}</span>
        </div>
        <div className="text-ink-muted">
          From {formatDate(listing.availableFrom)} · asking ₹{listing.expectedPricePerKg}/kg · {listing.location}
          {listing.photoCount > 0 && ` · ${listing.photoCount} photo${listing.photoCount > 1 ? "s" : ""}`}
        </div>
      </div>
      {myInterest ? (
        <Badge
          tone={myInterest.status === "accepted" ? "success" : myInterest.status === "declined" ? "neutral" : "market"}
          className="self-start sm:self-auto"
        >
          {myInterest.status === "accepted" ? "Farmer accepted" : myInterest.status === "declined" ? "Farmer declined" : "Interest sent"}
        </Badge>
      ) : listing.status === "agreed" ? (
        <Badge className="self-start sm:self-auto">Sold to another buyer</Badge>
      ) : (
        <Button size="sm" variant="secondary" className="self-start sm:self-auto" onClick={onInterest}>
          Send interest
        </Button>
      )}
    </li>
  );
}
