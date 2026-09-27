import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import type { BuyerRequirement, CropCycle, Field } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { useMarket } from "../../features/market/useMarket";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { ErrorState, PageSkeleton } from "../../components/ui/states";
import { FormField, SelectInput, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDateRange } from "../../utils/format";

type Errors = Partial<Record<"quantity" | "price" | "availableFrom" | "location", string>>;

export function UploadCropPage() {
  const overview = useFarmerOverview();
  const market = useMarket();
  const back = (
    <Link to="/farmer/market" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
      <ArrowLeft aria-hidden className="size-3.5" />
      Market
    </Link>
  );

  if (overview.status === "loading" || market.status === "loading") return <PageSkeleton />;
  if (overview.status === "error" || market.status === "error")
    return (
      <>
        {back}
        <ErrorState onRetry={overview.status === "error" ? overview.retry : market.status === "error" ? market.retry : undefined} />
      </>
    );

  return (
    <>
      {back}
      <PageHeader title="Upload crop" description="Tell buyers what you expect to harvest, and when it will be ready." />
      <UploadForm
        cycles={overview.data.cycles}
        fields={overview.data.fields}
        farmId={overview.data.farm.id}
        farmLabel={overview.data.farm.label}
        village={overview.data.farm.village}
        requirements={market.data.requirements}
      />
    </>
  );
}

function UploadForm({
  cycles,
  fields,
  farmId,
  farmLabel,
  village,
  requirements,
}: {
  cycles: CropCycle[];
  fields: Field[];
  farmId: string;
  farmLabel: string;
  village: string;
  requirements: BuyerRequirement[];
}) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { addListing } = useAppStore();

  const initialCycle = cycles.find((c) => c.id === params.get("cycle")) ?? cycles[0];
  const [cycleId, setCycleId] = useState(initialCycle.id);
  const cycle = cycles.find((c) => c.id === cycleId)!;
  const openRequirements = requirements.filter((r) => r.status === "open" && r.crop === cycle.crop);
  const [requirementId, setRequirementId] = useState(params.get("requirement") ?? "");
  const requirement = openRequirements.find((r) => r.id === requirementId);

  const [quantity, setQuantity] = useState(String(initialCycle.expectedYieldTonnes));
  const [grade, setGrade] = useState(initialCycle.expectedGrade);
  const [harvestDate, setHarvestDate] = useState(initialCycle.harvestWindow.start);
  const [availableFrom, setAvailableFrom] = useState(initialCycle.harvestWindow.start);
  const [price, setPrice] = useState("24");
  const [location, setLocation] = useState(`${village} · ${farmLabel}`);
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([]);
  const [errors, setErrors] = useState<Errors>({});

  // Free preview URLs when leaving the page (removed photos are freed immediately).
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const selectCycle = (id: string) => {
    const c = cycles.find((x) => x.id === id)!;
    setCycleId(id);
    setQuantity(String(c.expectedYieldTonnes));
    setGrade(c.expectedGrade);
    setHarvestDate(c.harvestWindow.start);
    setAvailableFrom(c.harvestWindow.start);
    setRequirementId("");
  };

  const priceHint = useMemo(() => {
    if (requirement) return `This buyer indicates ₹${requirement.indicativePricePerKg[0]}–${requirement.indicativePricePerKg[1]}/kg (indicative).`;
    return "Local market ₹18–25/kg, urban retail ₹25–35/kg (indicative).";
  }, [requirement]);

  const qty = Number(quantity);
  const overExpected = qty > cycle.expectedYieldTonnes * 1.2;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!(qty > 0)) next.quantity = "Enter the quantity in tonnes.";
    if (!(Number(price) > 0)) next.price = "Enter your expected price per kg.";
    if (availableFrom < harvestDate) next.availableFrom = "Produce can't be available before it is harvested.";
    if (!location.trim()) next.location = "Enter a pickup location.";
    setErrors(next);
    if (Object.keys(next).length) return;

    addListing({
      farmId,
      farmLabel,
      cropCycleId: cycle.id,
      crop: cycle.crop,
      grade,
      quantityTonnes: qty,
      harvestDate,
      availableFrom,
      expectedPricePerKg: Number(price),
      location: location.trim(),
      photoCount: photos.length,
      requirementId: requirement?.id,
    });
    toast(requirement ? "Offer sent to the buyer. You'll see their response in Market." : "Crop listing created. Buyers in the cluster can now see it.");
    navigate("/farmer/market");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <Card className="space-y-5 p-5 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Crop" hint={`Harvest window ${formatDateRange(cycle.harvestWindow.start, cycle.harvestWindow.end)}`}>
            {(p) => (
              <SelectInput {...p} value={cycleId} onChange={(e) => selectCycle(e.target.value)}>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.crop} · {fields.find((f) => f.id === c.fieldId)?.name}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
          <FormField label="Respond to a buyer request" hint="Optional — or list for any buyer">
            {(p) => (
              <SelectInput {...p} value={requirementId} onChange={(e) => setRequirementId(e.target.value)}>
                <option value="">Any buyer in the cluster</option>
                {openRequirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.buyerLabel} · {r.quantityTonnes} t Grade {r.grade}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
          <FormField
            label="Quantity (tonnes)"
            error={errors.quantity}
            hint={overExpected ? `That's more than the ${cycle.expectedYieldTonnes} t expected — double-check before listing.` : `Expected: ${cycle.expectedYieldTonnes} t`}
          >
            {(p) => <TextInput {...p} type="number" inputMode="decimal" min="0" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />}
          </FormField>
          <FormField label="Grade">
            {(p) => (
              <SelectInput {...p} value={grade} onChange={(e) => setGrade(e.target.value as "A" | "B" | "C")}>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </SelectInput>
            )}
          </FormField>
          <FormField label="Harvest date">
            {(p) => <TextInput {...p} type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />}
          </FormField>
          <FormField label="Available from" error={errors.availableFrom}>
            {(p) => <TextInput {...p} type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />}
          </FormField>
          <FormField label="Expected price (₹/kg)" error={errors.price} hint={priceHint}>
            {(p) => <TextInput {...p} type="number" inputMode="decimal" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />}
          </FormField>
          <FormField label="Pickup location" error={errors.location}>
            {(p) => <TextInput {...p} value={location} onChange={(e) => setLocation(e.target.value)} />}
          </FormField>
        </div>

        <div>
          <div className="mb-1.5 text-[13px] font-medium">Photos</div>
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <div key={p.url} className="relative size-20 overflow-hidden rounded-lg border border-line">
                <img src={p.url} alt={p.name} className="size-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => {
                    URL.revokeObjectURL(p.url);
                    setPhotos((list) => list.filter((x) => x.url !== p.url));
                  }}
                  className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-ink/70 text-white"
                >
                  <X aria-hidden className="size-3" />
                </button>
              </div>
            ))}
            <label className="grid size-20 cursor-pointer place-items-center rounded-lg border border-dashed border-line-strong text-ink-subtle hover:bg-canvas has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200">
              <ImagePlus aria-hidden className="size-5" />
              <span className="sr-only">Add photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])].slice(0, 6);
                  setPhotos((list) => [...list, ...files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="mt-1.5 text-[12px] text-ink-subtle">Photos stay on this device in the prototype; only the count is saved.</p>
        </div>
      </Card>

      <aside className="space-y-4">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">What happens next</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-[13px] text-ink-muted">
            <li>Your listing joins the cluster's expected supply.</li>
            <li>Buyers looking for {cycle.crop.toLowerCase()} can see it{requirement ? ", and this buyer is notified of your offer" : ""}.</li>
            <li>You decide whether to accept any buyer interest.</li>
          </ol>
          <InfoNote className="mt-4">Buyers see “{farmLabel}”, not your name, unless you change this in Profile.</InfoNote>
        </Card>
        <Button type="submit" className="w-full">
          {requirement ? "Send offer to buyer" : "Publish listing"}
        </Button>
      </aside>
    </form>
  );
}
