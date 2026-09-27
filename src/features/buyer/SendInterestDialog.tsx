import { useState, type FormEvent } from "react";
import type { CropListing } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Dialog } from "../../components/modals/Dialog";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { FormField, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { publicLabel, sellerLabel } from "../shared/identity";
import { formatDate, formatINR } from "../../utils/format";

export function SendInterestDialog({ listing, onClose }: { listing: CropListing; onClose: () => void }) {
  const { session, farmerProfile, addInterest } = useAppStore();
  const toast = useToast();
  const [qty, setQty] = useState(String(listing.quantityTonnes));
  const [price, setPrice] = useState(String(listing.expectedPricePerKg));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const q = Number(qty);
  const p = Number(price);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!(q > 0) || q > listing.quantityTonnes) return setError(`Enter between 0.1 and ${listing.quantityTonnes} t.`);
    if (!(p > 0)) return setError("Enter a price per kg.");
    addInterest({
      listingId: listing.id,
      buyerUserId: session!.userId,
      buyerLabel: publicLabel(session!.userId, "buyer"),
      quantityTonnes: q,
      pricePerKg: p,
      message: message.trim(),
    });
    toast(`Interest sent to ${listing.farmLabel}. The farmer decides whether to accept.`);
    onClose();
  };

  return (
    <Dialog
      title={`Send interest · ${sellerLabel(listing, farmerProfile)}`}
      description={`${listing.quantityTonnes} t ${listing.crop.toLowerCase()} Grade ${listing.grade} · from ${formatDate(listing.availableFrom)} · ${listing.location}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="send-interest">
            Send interest
          </Button>
        </>
      }
    >
      <form id="send-interest" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Quantity (tonnes)" error={error} hint={`Up to ${listing.quantityTonnes} t`}>
            {(pp) => <TextInput {...pp} type="number" inputMode="decimal" step="0.1" value={qty} onChange={(e) => (setQty(e.target.value), setError(null))} />}
          </FormField>
          <FormField label="Your price (₹/kg)" hint={`Farmer is asking ₹${listing.expectedPricePerKg}/kg`}>
            {(pp) => <TextInput {...pp} type="number" inputMode="decimal" value={price} onChange={(e) => (setPrice(e.target.value), setError(null))} />}
          </FormField>
        </div>
        <FormField label="Message" hint="Optional — pickup, grading or packing expectations">
          {(pp) => <TextArea {...pp} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />}
        </FormField>
        <div className="flex justify-between rounded-lg bg-canvas px-3 py-2.5 text-[13px]">
          <span className="text-ink-muted">Indicative value</span>
          <span className="font-semibold tabular-nums">{q > 0 && p > 0 ? formatINR(q * 1000 * p) : "—"}</span>
        </div>
        <InfoNote>This is an expression of interest, not a purchase. Nothing is confirmed until the farmer accepts.</InfoNote>
      </form>
    </Dialog>
  );
}
