import type { IntelligenceDomain } from "../../types";

// Plain-language explainers (spec §54): what the platform looks at, in order.
const explainers: Partial<Record<IntelligenceDomain, { title: string; steps: string[] }>> = {
  water: {
    title: "How smart irrigation advice works",
    steps: [
      "Soil moisture in your field is monitored.",
      "The weather forecast is checked for rain.",
      "Your crop and its growth stage set how much water it needs.",
      "AgriCluster compares these against your irrigation schedule.",
      "A suggestion is generated, with the reasons shown.",
      "You decide whether to act.",
    ],
  },
  energy: {
    title: "How pumping-energy advice works",
    steps: [
      "Your pump size and power source are known from your farm profile.",
      "Expected solar generation for today is checked.",
      "Your crop's water need and the rain forecast set how much to pump.",
      "AgriCluster looks for a time that meets the need with less grid energy.",
      "You decide whether to move the irrigation.",
    ],
  },
  crop: {
    title: "How crop-stress detection works",
    steps: [
      "A crop health index is tracked for each field every day.",
      "Humidity and leaf-wetness hours are checked for disease-friendly conditions.",
      "A sustained drop in the index raises a flag.",
      "You inspect the field — only a person on the ground can confirm a problem.",
      "An expert can help decide on treatment.",
    ],
  },
};

const fallback = {
  title: "How AgriCluster recommendations work",
  steps: [
    "Farm, weather, sensor, resource and market data are collected.",
    "Rules check the data against your crops and plans.",
    "A suggestion is generated, with the data behind it.",
    "You decide whether to act.",
  ],
};

export function HowItWorks({ domain }: { domain: IntelligenceDomain }) {
  const { title, steps } = explainers[domain] ?? fallback;
  return (
    <section aria-labelledby="how-it-works" className="rounded-xl border border-line bg-surface p-5">
      <h2 id="how-it-works" className="text-[15px] font-semibold">
        {title}
      </h2>
      <ol className="mt-3 space-y-2.5">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-[13px] leading-snug text-ink-muted">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
