import type { SupportScheme } from "../../types";

// Support options (spec §18). The prototype does NOT verify eligibility or
// details. Every entry says so, and points the farmer to the official office.
// Before real use: add the verified source, required documents and the date
// the information was last checked.
const verify = "Not verified in this prototype. Check eligibility with the official scheme office or your bank before applying.";

export const supportCatalogue: (SupportScheme & { when: (ctx: SupportContext) => boolean })[] = [
  {
    id: "sup-micro-irrigation",
    name: "Micro-irrigation (drip) support",
    category: "Government scheme",
    summary: "Government programmes have supported drip and sprinkler systems for small farmers.",
    relevantWhen: "Your plan uses drip irrigation.",
    eligibility: verify,
    documents: ["Land record", "Identity proof", "Bank details", "Quotation from a registered supplier"],
    howToApply: "Ask at your taluk agriculture office or Raitha Samparka Kendra.",
    source: { label: "State agriculture department (verify)" },
    verified: false,
    when: (c) => c.methodIds.some((m) => ["precision", "drip", "smart-irrigation", "protected"].includes(m)),
  },
  {
    id: "sup-soil-test",
    name: "Soil testing",
    category: "Institutional",
    summary: "A soil test tells you which nutrients your field needs, so you don't overspend on fertiliser.",
    relevantWhen: "You haven't had a recent soil test.",
    eligibility: verify,
    documents: ["Soil sample from your field", "Farmer details"],
    howToApply: "Ask at your nearest agriculture office or soil testing lab.",
    source: { label: "Agriculture department / soil testing lab (verify)" },
    verified: false,
    when: (c) => !c.soilTestDone,
  },
  {
    id: "sup-crop-insurance",
    name: "Crop insurance",
    category: "Insurance",
    summary: "Insurance can protect against crop loss from weather and some pests.",
    relevantWhen: "Your crop has weather and disease risks.",
    eligibility: verify,
    documents: ["Land record", "Sowing details", "Bank account details"],
    howToApply: "Ask your bank, cooperative society or the insurance office before the enrolment deadline.",
    source: { label: "Bank or insurance office (verify)" },
    verified: false,
    when: () => true,
  },
  {
    id: "sup-crop-loan",
    name: "Crop loan",
    category: "Banking",
    summary: "Banks and cooperative societies offer short-term crop loans; some programmes support small farmers with lower interest.",
    relevantWhen: "You said you may need a loan, or your plan costs more than your available money.",
    eligibility: verify,
    documents: ["Land record", "Identity proof", "Crop plan and budget (you can print it from AgriCluster)"],
    howToApply: "Speak to your bank branch or primary agricultural cooperative society.",
    source: { label: "Your bank / cooperative (verify)" },
    verified: false,
    when: (c) => c.needsLoan || c.budgetGap > 0,
  },
  {
    id: "sup-fpo",
    name: "Farmer producer organisation (FPO) membership",
    category: "Institutional",
    summary: "FPOs help small farmers buy inputs together and sell together. Some receive support through NABARD and other agencies.",
    relevantWhen: "Selling together could help you reach larger buyers.",
    eligibility: verify,
    documents: ["Membership form", "Share capital (as set by the FPO)"],
    howToApply: "Ask the cluster office for FPOs near you.",
    source: { label: "Local FPO / NABARD-supported programmes (verify)" },
    verified: false,
    when: () => true,
  },
  {
    id: "sup-training",
    name: "Training on the chosen method",
    category: "Training",
    summary: "Short trainings and demonstrations help you start a new farming method with confidence.",
    relevantWhen: "You're new to this method or to farm technology.",
    eligibility: verify,
    documents: [],
    howToApply: "Ask Krishi Vigyan Kendra (KVK) or the cluster office about upcoming sessions.",
    source: { label: "KVK / cluster office (verify)" },
    verified: false,
    when: (c) => c.techFamiliarity !== "high",
  },
];

export interface SupportContext {
  methodIds: string[];
  soilTestDone: boolean;
  needsLoan: boolean;
  budgetGap: number;
  techFamiliarity: "low" | "moderate" | "high";
}
