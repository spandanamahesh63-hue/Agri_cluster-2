import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { publicLabel } from "../../features/shared/identity";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { FormField, SelectInput, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { DEMO_TODAY } from "../../data/mock/clock";

type Errors = Partial<Record<"quantity" | "window" | "location" | "price", string>>;

export function NewRequirementPage() {
  const { session, addRequirement } = useAppStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [crop, setCrop] = useState("Tomato");
  const [grade, setGrade] = useState<"A" | "B" | "C">("A");
  const [quantity, setQuantity] = useState("10");
  const [start, setStart] = useState("2026-10-18");
  const [end, setEnd] = useState("2026-10-24");
  const [location, setLocation] = useState("Bannimantap, Mysuru");
  const [priceLo, setPriceLo] = useState("21");
  const [priceHi, setPriceHi] = useState("25");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!(Number(quantity) > 0)) next.quantity = "Enter the quantity you need in tonnes.";
    if (!start || !end || end < start) next.window = "The end date must be on or after the start date.";
    else if (start < DEMO_TODAY) next.window = "Choose dates from today onwards.";
    if (!location.trim()) next.location = "Enter a delivery location.";
    if (!(Number(priceLo) > 0) || Number(priceHi) < Number(priceLo)) next.price = "Enter a valid price range.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const req = addRequirement({
      buyerUserId: session!.userId,
      buyerLabel: publicLabel(session!.userId, "buyer"),
      crop,
      grade,
      quantityTonnes: Number(quantity),
      window: { start, end },
      deliveryLocation: location.trim(),
      indicativePricePerKg: [Number(priceLo), Number(priceHi)],
      source: "demo",
    });
    toast("Requirement posted. Farmers growing this crop can now see it.");
    navigate(`/buyer/requirements/${req.id}`);
  };

  return (
    <>
      <Link to="/buyer/requirements" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-3.5" />
        Requirements
      </Link>
      <PageHeader title="New requirement" description="Tell the cluster what you need. Matching farmers will see it and can offer their harvest." />
      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-3">
        <Card className="grid gap-4 p-5 sm:grid-cols-2 lg:col-span-2">
          <FormField label="Crop">
            {(p) => (
              <SelectInput {...p} value={crop} onChange={(e) => setCrop(e.target.value)}>
                {["Tomato", "Chilli", "Onion", "Leafy vegetables"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </SelectInput>
            )}
          </FormField>
          <FormField label="Quality / grade">
            {(p) => (
              <SelectInput {...p} value={grade} onChange={(e) => setGrade(e.target.value as "A" | "B" | "C")}>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </SelectInput>
            )}
          </FormField>
          <FormField label="Quantity (tonnes)" error={errors.quantity}>
            {(p) => <TextInput {...p} type="number" inputMode="decimal" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />}
          </FormField>
          <FormField label="Delivery location" error={errors.location}>
            {(p) => <TextInput {...p} value={location} onChange={(e) => setLocation(e.target.value)} />}
          </FormField>
          <FormField label="Needed from" error={errors.window}>
            {(p) => <TextInput {...p} type="date" min={DEMO_TODAY} value={start} onChange={(e) => setStart(e.target.value)} />}
          </FormField>
          <FormField label="Needed until">
            {(p) => <TextInput {...p} type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} />}
          </FormField>
          <FormField label="Price from (₹/kg)" error={errors.price}>
            {(p) => <TextInput {...p} type="number" inputMode="decimal" value={priceLo} onChange={(e) => setPriceLo(e.target.value)} />}
          </FormField>
          <FormField label="Price to (₹/kg)">
            {(p) => <TextInput {...p} type="number" inputMode="decimal" value={priceHi} onChange={(e) => setPriceHi(e.target.value)} />}
          </FormField>
        </Card>
        <aside className="space-y-4">
          <Card className="p-5 text-[13px]">
            <h2 className="text-[15px] font-semibold">What happens next</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-ink-muted">
              <li>Farmers growing {crop.toLowerCase()} see your requirement in their Market.</li>
              <li>You see matching listings and the cluster's expected harvest straight away.</li>
              <li>Farmers can send offers; you accept or decline each one.</li>
            </ol>
            <InfoNote className="mt-3">The price range is indicative and helps farmers decide whether to offer.</InfoNote>
          </Card>
          <Button type="submit" className="w-full">
            Post requirement
          </Button>
        </aside>
      </form>
    </>
  );
}
