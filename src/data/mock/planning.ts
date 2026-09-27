import type { FarmerObjective, FarmingMethod } from "../../types";

export const objectives: { id: FarmerObjective; title: string; description: string }[] = [
  { id: "income", title: "Increase farm income", description: "Better prices, better timing and less crop loss." },
  { id: "cost", title: "Reduce cost & resource use", description: "Spend less on water, energy, inputs and machinery." },
  { id: "sustainability", title: "Build a more sustainable farm", description: "Healthier soil, less waste and lower chemical use." },
];

export const methods: { id: FarmingMethod; title: string; summary: string; howItWorks: string[] }[] = [
  {
    id: "conventional",
    title: "Conventional",
    summary: "Standard seeds, fertilisers and crop protection, applied on a schedule.",
    howItWorks: [
      "Inputs follow recommended doses for your crop.",
      "Soil testing helps avoid over-applying fertiliser.",
      "AgriCluster helps time irrigation and spraying around the weather.",
    ],
  },
  {
    id: "organic",
    title: "Organic",
    summary: "No synthetic fertilisers or pesticides; certified inputs and practices.",
    howItWorks: [
      "Compost, green manure and approved bio-inputs replace synthetic fertilisers.",
      "Pests are managed with traps, biological controls and approved products.",
      "Certification requires records — AgriCluster keeps a log of activities.",
    ],
  },
  {
    id: "natural",
    title: "Natural farming",
    summary: "Low external inputs, on-farm preparations and soil cover.",
    howItWorks: [
      "Farm-made preparations support soil life.",
      "Mulch and intercrops keep soil covered and moist.",
      "Transition can reduce yields at first — plan with an expert.",
    ],
  },
  {
    id: "precision",
    title: "Precision farming",
    summary: "Measure first, then apply water and inputs only where and when needed.",
    howItWorks: [
      "Sensors, weather data and field observations are collected.",
      "AgriCluster turns them into field-level suggestions.",
      "You apply water and inputs based on need rather than the calendar.",
    ],
  },
  {
    id: "mixed",
    title: "Mixed method",
    summary: "Different practices on different fields, or a gradual transition.",
    howItWorks: [
      "Each field can follow its own approach.",
      "Compare results across fields over a season.",
      "Keep what works and expand it gradually.",
    ],
  },
];

export interface InvestmentLine {
  category: string;
  estimate: number; // INR for the season, Farm #27 (2.5 acres), indicative
  opportunity?: string;
  savingRange?: [number, number]; // % of the line, indicative
  domains: FarmerObjective[]; // which objectives this saving supports most
}

// Season plan for Farm #27. All figures are indicative demonstration values.
export const investmentPlan: InvestmentLine[] = [
  { category: "Seeds & seedlings", estimate: 22000, domains: [] },
  {
    category: "Fertiliser",
    estimate: 48000,
    opportunity: "Soil-test based doses and pooled cluster purchase",
    savingRange: [8, 12],
    domains: ["cost", "sustainability"],
  },
  {
    category: "Irrigation",
    estimate: 12000,
    opportunity: "Rain-aware scheduling reduces avoidable pumping",
    savingRange: [10, 15],
    domains: ["cost", "sustainability"],
  },
  {
    category: "Labour",
    estimate: 95000,
    opportunity: "Coordinated harvest crews across neighbouring farms",
    savingRange: [3, 6],
    domains: ["cost", "income"],
  },
  {
    category: "Machinery",
    estimate: 28000,
    opportunity: "Shared tractors and transport instead of ad-hoc hiring",
    savingRange: [15, 25],
    domains: ["cost", "income"],
  },
  {
    category: "Energy",
    estimate: 9000,
    opportunity: "Moving pumping into solar hours",
    savingRange: [20, 30],
    domains: ["cost", "sustainability"],
  },
  {
    category: "Crop protection",
    estimate: 36000,
    opportunity: "Early stress detection allows targeted spraying",
    savingRange: [10, 15],
    domains: ["cost", "sustainability", "income"],
  },
  { category: "Technology services", estimate: 6000, domains: [] },
];
