import type { CropListing } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import { publicLabel, sellerLabel } from "../shared/identity";
import { formatDate, formatINR } from "../../utils/format";

/** A farmer's offer against one of the buyer's requirements, with accept / decline. */
export function OfferRow({ listing }: { listing: CropListing }) {
  const { session, farmerProfile, acceptOffer, declineOffer } = useAppStore();
  const toast = useToast();
  const me = publicLabel(session!.userId, "buyer");

  return (
    <li className="flex flex-col gap-2 px-5 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-medium">
          {sellerLabel(listing, farmerProfile)} offers {listing.quantityTonnes} t {listing.crop.toLowerCase()} Grade {listing.grade}
        </div>
        <div className="text-ink-muted">
          From {formatDate(listing.availableFrom)} · ₹{listing.expectedPricePerKg}/kg · {listing.location}
          {listing.photoCount > 0 && ` · ${listing.photoCount} photo${listing.photoCount > 1 ? "s" : ""}`} · indicative value{" "}
          {formatINR(listing.quantityTonnes * 1000 * listing.expectedPricePerKg)}
        </div>
      </div>
      {listing.status === "agreed" ? (
        <Badge tone="success" className="self-start sm:self-auto">
          Agreed
        </Badge>
      ) : (
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            onClick={() => {
              acceptOffer(listing, { userId: session!.userId, label: me });
              toast(`Agreed with ${listing.farmLabel}. See it in Deals.`);
            }}
          >
            Accept offer
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              declineOffer(listing, me);
              toast("Offer declined. The farmer has been informed.");
            }}
          >
            Decline
          </Button>
        </div>
      )}
    </li>
  );
}
