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
import { FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { usePlan } from "../../features/plan/usePlan";
import { useToast } from "../../components/ui/Toast";
import { formatDateRange, formatKg } from "../../utils/format";
import { harvestGroups } from "../../services/intelligence/engine";

type Errors = Partial<Record<"quantity" | "price" | "availableFrom" | "availableUntil" | "location", string>>;

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const methodOptions = ["Precision farming", "Drip irrigation", "Smart irrigation", "Organic farming", "Protected cultivation", "Less-water farming", "Integrated farming", "Conventional"];

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
  const { addListing, farmerProfile, updateProfile } = useAppStore();
  const plan = usePlan();

  // A harvest is listed per crop: fields growing the same crop are one listing.
  const groups = useMemo(() => harvestGroups(cycles, fields), [cycles, fields]);
  const initial = groups.find((g) => g.cycleIds.includes(params.get("cycle") ?? "")) ?? groups[0];
  const [groupKey, setGroupKey] = useState(`${initial.crop}|${initial.grade}`);
  const group = groups.find((g) => `${g.crop}|${g.grade}` === groupKey)!;
  const openRequirements = requirements.filter((r) => r.status === "open" && r.crop === group.crop);
  const [requirementId, setRequirementId] = useState(params.get("requirement") ?? "");
  const requirement = openRequirements.find((r) => r.id === requirementId);

  const [quantity, setQuantity] = useState(String(initial.tonnes));
  const [grade, setGrade] = useState(initial.grade);
  const [harvestDate, setHarvestDate] = useState(initial.window.start);
  const [availableFrom, setAvailableFrom] = useState(initial.window.start);
  const [price, setPrice] = useState("24");
  const [location, setLocation] = useState(`${village} · ${farmLabel}`);
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [method, setMethod] = useState(plan.method?.name ?? "Precision farming");
  const [description, setDescription] = useState("");
  const [availableUntil, setAvailableUntil] = useState(addDays(initial.window.end, 3));
  const [share, setShare] = useState({ method: true, photos: true, village: true, name: farmerProfile.showNameToBuyers });
  const [errors, setErrors] = useState<Errors>({});

  // Free preview URLs when leaving the page (removed photos are freed immediately).
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const selectGroup = (key: string) => {
    const g = groups.find((x) => `${x.crop}|${x.grade}` === key)!;
    setGroupKey(key);
    setQuantity(String(g.tonnes));
    setGrade(g.grade);
    setHarvestDate(g.window.start);
    setAvailableFrom(g.window.start);
    setRequirementId("");
  };

  const priceHint = useMemo(() => {
    if (requirement) return `This buyer indicates ₹${requirement.indicativePricePerKg[0]}–${requirement.indicativePricePerKg[1]}/kg (indicative).`;
    return "Local market ₹18–25/kg, urban retail ₹25–35/kg (indicative).";
  }, [requirement]);

  const qty = Number(quantity);
  const overExpected = qty > group.tonnes * 1.2;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!(qty > 0)) next.quantity = "Enter the quantity in tonnes.";
    if (!(Number(price) > 0)) next.price = "Enter your expected price per kg.";
    if (availableFrom < harvestDate) next.availableFrom = "Produce can't be available before it is harvested.";
    if (!location.trim()) next.location = "Enter a pickup location.";
    if (availableUntil < availableFrom) next.availableUntil = "The end of the availability period must be after it starts.";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (share.name !== farmerProfile.showNameToBuyers) updateProfile({ showNameToBuyers: share.name });

    addListing({
      farmId,
      farmLabel,
      cropCycleId: group.cycleIds[0],
      crop: group.crop,
      grade,
      quantityTonnes: qty,
      harvestDate,
      availableFrom,
      expectedPricePerKg: Number(price),
      location: location.trim(),
      photoCount: photos.length,
      requirementId: requirement?.id,
      method,
      description: description.trim() || undefined,
      availableUntil,
      hasVideo: !!video,
      share,
    });
    toast(requirement ? "Offer sent to the buyer. You'll see their response in Market." : "Crop listing created. Buyers in the cluster can now see it.");
    navigate("/farmer/market");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <Card className="space-y-5 p-5 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Crop" hint={`Harvest window ${formatDateRange(group.window.start, group.window.end)}`}>
            {(p) => (
              <SelectInput {...p} value={groupKey} onChange={(e) => selectGroup(e.target.value)}>
                {groups.map((g) => (
                  <option key={`${g.crop}|${g.grade}`} value={`${g.crop}|${g.grade}`}>
                    {g.crop} · {g.fieldNames.join(" + ")}
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
            hint={
              overExpected
                ? `That's more than the ${formatKg(group.tonnes)} expected. Double-check before listing.`
                : `Expected: ${formatKg(group.tonnes)} (${group.tonnes} t)`
            }
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
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Farming method">
              {(p) => (
                <SelectInput {...p} value={method} onChange={(e) => setMethod(e.target.value)}>
                  {methodOptions.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </SelectInput>
              )}
            </FormField>
            <FormField label="Available until" error={errors.availableUntil} hint="How long buyers can expect this lot">
              {(p) => <TextInput {...p} type="date" min={availableFrom} value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} />}
            </FormField>
            <FormField label="Description" hint="Optional: variety, packing, how it was grown" className="sm:col-span-2">
              {(p) => <TextArea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}
            </FormField>
          </div>
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

          <div className="mt-4">
            <label className="text-[13px] font-medium" htmlFor="harvest-video">
              Short video <span className="font-normal text-ink-subtle">(optional)</span>
            </label>
            <input
              id="harvest-video"
              type="file"
              accept="video/*"
              className="mt-1.5 block w-full text-[13px] file:mr-3 file:rounded-lg file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-[13px]"
              onChange={(e) => setVideo(e.target.files?.[0]?.name ?? null)}
            />
            {video && <p className="mt-1 text-[12px] text-ink-muted">Attached: {video} (kept on this device)</p>}
          </div>
        </div>
      </Card>

      <aside className="space-y-4">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">What buyers can see</h2>
          <p className="mt-1 text-[12px] text-ink-muted">Crop, grade, quantity, dates and price are always shown. You choose the rest.</p>
          <div className="mt-3 space-y-2 text-[13px]">
            {(
              [
                ["method", "Farming method"],
                ["photos", "Photos and video"],
                ["village", "Village (not your exact location)"],
                ["name", "My name (otherwise “" + farmLabel + "”)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" className="size-4 accent-brand-700" checked={share[key]} onChange={(e) => setShare((s) => ({ ...s, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
          <InfoNote className="mt-3">Your phone number, farm details and finances are never shown on a listing.</InfoNote>
        </Card>
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">What happens next</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-[13px] text-ink-muted">
            <li>Your listing joins the cluster's expected supply.</li>
            <li>Buyers looking for {group.crop.toLowerCase()} can see it{requirement ? ", and this buyer is notified of your offer" : ""}.</li>
            <li>You decide whether to accept any buyer interest.</li>
          </ol>
        </Card>
        <Button type="submit" className="w-full">
          {requirement ? "Send offer to buyer" : "Publish listing"}
        </Button>
      </aside>
    </form>
  );
}
