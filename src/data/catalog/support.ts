import type { SupportNeed, SupportScheme } from "../../types";

// Government and private-sector support (spec §18).
//
// Government entries: key facts were checked against official sources (the
// scheme portal or Press Information Bureau releases) on LAST_CHECKED. Rules,
// amounts and deadlines change, and eligibility depends on each farmer's case,
// so every entry sends the farmer to the official office before applying.
//
// Private-sector entries describe kinds of provider, not named companies:
// AgriCluster has no partnership with any of them and does not rank them.

export const LAST_CHECKED = "2026-09-28";

export const needLabels: Record<SupportNeed, string> = {
  income: "Income support",
  credit: "Loans & credit",
  insurance: "Insurance",
  subsidy: "Subsidy",
  "soil-training": "Soil & training",
  market: "Selling",
  storage: "Storage",
};

export interface SupportContext {
  cropId?: string;
  methodIds: string[];
  irrigation: "drip" | "sprinkler" | "flood" | "rainfed";
  water: "low" | "moderate" | "high";
  electricity: "reliable" | "limited" | "none";
  solar: boolean;
  soilTestDone: boolean;
  needsLoan: boolean;
  budgetGap: number;
  techFamiliarity: "low" | "moderate" | "high";
}

const HORTICULTURE = ["tomato", "chilli", "onion", "beans", "leafy"];
const STORABLE = ["onion", "ragi", "chilli"];
const checkOffice = (office: string) => `AgriCluster does not check eligibility. Confirm your case with ${office} before applying.`;

type Entry = SupportScheme & { why: (c: SupportContext) => string | null };

export const supportCatalogue: Entry[] = [
  // ---------------------------------------------------------------- Government
  {
    id: "pm-kisan",
    name: "PM-KISAN income support",
    sector: "government",
    level: "Central government",
    provider: "Ministry of Agriculture & Farmers Welfare",
    needs: ["income"],
    summary: "Direct income support paid into the bank accounts of land-holding farmer families.",
    offers: ["₹6,000 a year, paid in three equal instalments."],
    eligibility:
      "Land-holding farmer families. Some groups are excluded, for example income-tax payers, government employees, some professionals and people with a monthly pension of ₹10,000 or more. " +
      checkOffice("the PM-KISAN portal or your agriculture office"),
    documents: ["Aadhaar", "Land record in your name", "Bank account linked to Aadhaar"],
    howToApply: "“New Farmer Registration” on the PM-KISAN portal, or at a Common Service Centre (CSC).",
    source: { label: "PM-KISAN portal", url: "https://pmkisan.gov.in/" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: () => "You farm your own land. If you are not registered yet, this is income support every year.",
  },
  {
    id: "pmfby",
    name: "PMFBY crop insurance",
    sector: "government",
    level: "Central government",
    provider: "Ministry of Agriculture & Farmers Welfare, through insurance companies",
    needs: ["insurance"],
    summary: "Pradhan Mantri Fasal Bima Yojana insures notified crops against loss from natural risks you cannot prevent.",
    offers: [
      "You pay at most 2% of the sum insured for kharif crops, 1.5% for rabi food and oilseed crops, and 5% for commercial and horticultural crops.",
      "Central and state governments pay the rest of the premium.",
    ],
    eligibility: "Covers crops and areas notified for the season in your state. " + checkOffice("your bank, a CSC or the insurance company"),
    documents: ["Land record or tenancy/sowing certificate", "Sowing details for the season", "Bank account details", "Aadhaar"],
    howToApply: "Through your bank, a Common Service Centre, the insurance company's agent or the PMFBY portal, before the season's cut-off date.",
    source: { label: "PIB: Benefits to farmers under PMFBY", url: "https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1738233" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) =>
      c.cropId && HORTICULTURE.includes(c.cropId)
        ? "Your crop is horticultural, so your share of the premium would be at most 5% of the sum insured."
        : "Weather and disease can take a season's income; insurance protects your investment.",
  },
  {
    id: "pdmc",
    name: "Per Drop More Crop (drip & sprinkler subsidy)",
    sector: "government",
    level: "Central government",
    provider: "Implemented by the state agriculture and horticulture departments (under RKVY)",
    needs: ["subsidy"],
    summary: "Help with the cost of drip and sprinkler systems, to use less water per crop.",
    offers: ["Government assistance of 55% of the cost for small and marginal farmers, and 45% for other farmers."],
    eligibility: checkOffice("your taluk agriculture or horticulture office"),
    documents: ["Land record", "Aadhaar", "Bank account details", "Quotation from a registered micro-irrigation supplier"],
    howToApply: "Apply through your taluk agriculture or horticulture office, or at your Raitha Samparka Kendra.",
    source: { label: "PIB: Per Drop More Crop", url: "https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1985487" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) =>
      c.irrigation !== "drip"
        ? "You don't have drip yet. Drip would cut water use, and this subsidy covers much of the cost."
        : c.methodIds.some((m) => ["precision", "drip", "smart-irrigation"].includes(m))
          ? "Your plan relies on drip. The subsidy can help extend or upgrade it."
          : null,
  },
  {
    id: "kcc",
    name: "Kisan Credit Card (KCC) crop loan",
    sector: "government",
    level: "Central government",
    provider: "Banks, under the Modified Interest Subvention Scheme",
    needs: ["credit"],
    summary: "Short-term loans for seeds, inputs and other crop costs at a subsidised interest rate.",
    offers: [
      "Short-term KCC loans up to ₹3 lakh at 7% interest.",
      "Repay on time and a 3% prompt-repayment incentive brings the effective rate to 4%.",
      "Budget 2025-26 announced raising the limit to ₹5 lakh. Ask your bank what applies now.",
    ],
    eligibility: checkOffice("your bank branch or primary agricultural cooperative society"),
    documents: ["Land record", "Aadhaar and PAN", "Passport photo", "Crop plan and budget (print it from AgriCluster)"],
    howToApply: "Apply at your bank branch, regional rural bank or cooperative society.",
    source: { label: "PIB: MISS continued for 2025-26", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2131989" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) =>
      c.needsLoan || c.budgetGap > 0
        ? "Your plan costs more than the money you have. A KCC loan is usually the cheapest way to cover the gap."
        : "Useful to have in place for input costs, even if you don't need it this season.",
  },
  {
    id: "pm-kusum",
    name: "PM-KUSUM solar pumps",
    sector: "government",
    level: "Central government",
    provider: "Ministry of New and Renewable Energy, with the state agency",
    needs: ["subsidy"],
    summary: "Support for farmers to install stand-alone solar pumps (up to 7.5 HP) where grid supply is weak or absent.",
    offers: [
      "30% central assistance, at least 30% from the state, and the farmer pays at most 40% of the cost.",
      "Bank finance can cover up to 30%, so you may pay about 10% up front.",
    ],
    eligibility: checkOffice("the state PM-KUSUM agency"),
    documents: ["Land record", "Aadhaar", "Bank account details", "Water source details"],
    howToApply: "Through the state agency that implements PM-KUSUM, or the national PM-KUSUM portal.",
    source: { label: "MNRE: PM-KUSUM", url: "https://mnre.gov.in/en/pradhan-mantri-kisan-urja-suraksha-evam-utthaan-mahabhiyaan-pm-kusum/" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) => (c.electricity !== "reliable" ? "Your pump power is limited. A solar pump would let you irrigate in daylight hours." : null),
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card",
    sector: "government",
    level: "Central government",
    provider: "Department of Agriculture & Farmers Welfare, through state soil testing labs",
    needs: ["soil-training"],
    summary: "Your soil is tested and you get a report with fertiliser advice, so you spend only on what your field needs.",
    offers: [
      "Tests 12 parameters: N, P, K, S, zinc, iron, copper, manganese, boron, pH, EC and organic carbon.",
      "Cards are issued in a two-year cycle; you can also ask for a test when you need one.",
    ],
    eligibility: checkOffice("your agriculture office or soil testing lab"),
    documents: ["Soil sample (the office will explain how to take it)", "Your name, village and survey number"],
    howToApply: "Ask at your Raitha Samparka Kendra or nearest soil testing lab.",
    source: { label: "PIB: Soil Health Card scheme", url: "https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1947891" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) => (!c.soilTestDone ? "You haven't had a recent soil test. It is the cheapest way to cut fertiliser costs." : null),
  },
  {
    id: "midh",
    name: "Horticulture mission support (MIDH)",
    sector: "government",
    level: "Central government",
    provider: "State Horticulture Mission (Karnataka Horticulture Department)",
    needs: ["subsidy", "storage"],
    summary: "Assistance for fruit and vegetable growers: planting material, protected cultivation and post-harvest infrastructure.",
    offers: [
      "Covers protected cultivation (polyhouse, greenhouse), nurseries, and post-harvest and marketing infrastructure.",
      "Cold storage up to 5,000 t: credit-linked, back-ended subsidy of 35% of project cost in general areas.",
    ],
    eligibility: checkOffice("your taluk horticulture office"),
    documents: ["Land record", "Aadhaar", "Bank account details", "Project estimate or quotation"],
    howToApply: "Apply through your taluk horticulture office under the State Horticulture Mission's annual plan.",
    source: { label: "PIB: Implementation of MIDH", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1842773" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) =>
      c.methodIds.includes("protected")
        ? "Your plan uses protected cultivation, which this mission supports."
        : c.cropId && HORTICULTURE.includes(c.cropId)
          ? "You grow a horticultural crop, so horticulture mission support may apply."
          : null,
  },
  {
    id: "fpo",
    name: "Farmer Producer Organisations (FPOs)",
    sector: "government",
    level: "Central government",
    provider: "Implemented through agencies including SFAC and NABARD",
    needs: ["market", "credit"],
    summary: "Join an FPO to buy inputs and sell produce together, and reach buyers a small farm can't reach alone.",
    offers: [
      "FPOs can get a matching equity grant of up to ₹2,000 per farmer member (up to ₹15 lakh per FPO).",
      "Credit guarantee of up to ₹2 crore of project loan per FPO.",
    ],
    eligibility: "Open to farmers in the FPO's area; each FPO sets its membership rules. Ask the cluster office which FPOs work near you.",
    documents: ["Membership form", "Aadhaar", "Land record", "Share capital (amount set by the FPO)"],
    howToApply: "Contact an FPO near you through the cluster office or your agriculture office.",
    source: { label: "PIB: 10,000 FPOs scheme", url: "https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1696547&reg=3&lang=2" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: () => "Selling with other farmers can get you better prices and bigger buyers.",
  },
  {
    id: "aif",
    name: "Agriculture Infrastructure Fund",
    sector: "government",
    level: "Central government",
    provider: "Department of Agriculture & Farmers Welfare, through banks",
    needs: ["credit", "storage"],
    summary: "Cheaper loans for post-harvest infrastructure such as pack houses, sorting and grading units, cold stores and warehouses.",
    offers: [
      "3% a year interest subvention, on loans up to ₹2 crore per project, for up to 7 years.",
      "Credit guarantee on eligible loans, with the fee paid by the government.",
    ],
    eligibility: "For farmers, FPOs, cooperatives, agri-entrepreneurs and others building eligible infrastructure. " + checkOffice("your bank"),
    documents: ["Project report", "Land record or lease", "Aadhaar and PAN", "Quotations"],
    howToApply: "Apply online on the Agriculture Infrastructure Fund portal and through your bank.",
    source: { label: "Agriculture Infrastructure Fund portal", url: "https://agriinfra.dac.gov.in/" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) => (c.cropId && HORTICULTURE.includes(c.cropId) ? "Perishable crops lose value fast; a shared pack house or cold room through your FPO could reduce losses." : null),
  },
  {
    id: "e-nwr",
    name: "Warehouse receipt loans (e-NWR)",
    sector: "government",
    level: "Central government",
    provider: "Warehousing Development and Regulatory Authority (WDRA), with banks",
    needs: ["storage", "credit"],
    summary: "Store produce in a registered warehouse and borrow against the receipt, so you don't have to sell straight after harvest.",
    offers: [
      "Loans against electronic negotiable warehouse receipts from WDRA-registered warehouses.",
      "A ₹1,000 crore credit guarantee scheme (CGS-NPF) supports these loans, mainly for small and marginal farmers.",
    ],
    eligibility: checkOffice("the warehouse and your bank"),
    documents: ["Aadhaar", "Bank account details", "e-NWR issued by the warehouse"],
    howToApply: "Deposit produce at a WDRA-registered warehouse, get the e-NWR, and apply for the loan at your bank.",
    source: { label: "PIB: Credit Guarantee Scheme for e-NWR pledge financing", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2085018" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) => (c.cropId && STORABLE.includes(c.cropId) ? "Your crop stores well, so you can wait for a better price." : null),
  },
  {
    id: "krishi-bhagya",
    name: "Krishi Bhagya (farm ponds)",
    sector: "government",
    level: "Karnataka government",
    provider: "Karnataka Department of Agriculture",
    needs: ["subsidy"],
    summary: "Helps rainfed farmers harvest rainwater in farm ponds (Krishi Honda) and use it as protective irrigation at critical crop stages.",
    offers: ["Support for the farm pond and related work. Check the current assistance with your Raitha Samparka Kendra."],
    eligibility: checkOffice("your Raitha Samparka Kendra"),
    documents: ["Land record (RTC)", "Aadhaar", "Bank account details"],
    howToApply: "Apply at your Raitha Samparka Kendra or through the Raitamitra portal.",
    source: { label: "Raitamitra: Krishi Bhagya", url: "https://raitamitra.karnataka.gov.in/info-2/Krishi+Bhagya+Scheme/en" },
    lastChecked: LAST_CHECKED,
    sourceChecked: true,
    why: (c) => (c.irrigation === "rainfed" || c.water === "low" ? "Your water is limited. A farm pond can carry your crop through dry spells." : null),
  },
  {
    id: "kvk-training",
    name: "Krishi Vigyan Kendra training",
    sector: "government",
    level: "Central government",
    provider: "ICAR Krishi Vigyan Kendras (district farm science centres)",
    needs: ["soil-training"],
    summary: "Short trainings and field demonstrations on crops, methods and technology, run in your district.",
    offers: ["Trainings, demonstrations and advice. Confirm upcoming sessions and any costs with your nearest KVK."],
    eligibility: "Open to farmers in the district. Confirm details with your nearest KVK.",
    documents: [],
    howToApply: "Contact your district's Krishi Vigyan Kendra, or ask the cluster office to register you.",
    source: { label: "Your district KVK (confirm details)" },
    sourceChecked: false,
    why: (c) => (c.techFamiliarity !== "high" ? "You're adopting a new method; a hands-on demonstration makes it easier." : null),
  },

  // ---------------------------------------------------------------- Private sector
  {
    id: "bank-term-loan",
    name: "Bank term loans for drip, solar and machinery",
    sector: "private",
    level: "Private sector",
    provider: "Public, private, cooperative and regional rural banks",
    needs: ["credit"],
    summary: "Longer loans for farm investments such as drip systems, solar pumps, a farm pond or small machinery.",
    offers: ["Can be combined with government subsidies such as Per Drop More Crop or PM-KUSUM.", "Terms differ by bank; compare interest, fees and repayment dates."],
    eligibility: "Each bank decides. Take your land records, crop plan and quotations.",
    documents: ["Land record", "Aadhaar and PAN", "Quotations", "Crop plan and budget"],
    howToApply: "Ask at two or three banks and compare their offers before you sign.",
    source: { label: "Compare terms with each bank" },
    sourceChecked: false,
    why: (c) => (c.budgetGap > 0 || c.needsLoan ? "Useful if you decide to buy equipment instead of renting it." : null),
  },
  {
    id: "private-insurers",
    name: "Crop and weather insurance from insurers",
    sector: "private",
    level: "Private sector",
    provider: "Public and private general insurance companies",
    needs: ["insurance"],
    summary: "Insurance companies run PMFBY in each state, and some also sell other crop or weather covers.",
    offers: ["Covers outside PMFBY are priced by the insurer; read what is covered and how claims are paid."],
    eligibility: "Set by each insurer and policy.",
    documents: ["Land and sowing details", "Bank account details"],
    howToApply: "Through your bank, an insurance agent or the insurer directly.",
    source: { label: "Compare policies before buying" },
    sourceChecked: false,
    why: () => null,
  },
  {
    id: "input-company-advice",
    name: "Advice from seed, fertiliser and crop-protection companies",
    sector: "private",
    level: "Private sector",
    provider: "Input companies and their dealers",
    needs: ["soil-training"],
    summary: "Many input companies run free agronomy advice, demonstration plots and helplines.",
    offers: ["Useful practical tips, but the advice may favour the company's own products. Compare it with your KVK or an AgriCluster expert."],
    eligibility: "Usually free for farmers.",
    documents: [],
    howToApply: "Ask your input dealer about field days and helplines.",
    source: { label: "Ask your dealer" },
    sourceChecked: false,
    why: () => null,
  },
  {
    id: "agri-fintech",
    name: "Quick loans from fintech lenders and NBFCs",
    sector: "private",
    level: "Private sector",
    provider: "Non-bank lenders and agri-fintech apps",
    needs: ["credit"],
    summary: "Fast input loans and equipment finance, often through a phone app.",
    offers: ["Often costs more than a KCC loan. Check the full interest, fees and penalties before signing, and never share OTPs."],
    eligibility: "Set by each lender.",
    documents: ["Aadhaar and PAN", "Bank statements"],
    howToApply: "Compare with a KCC loan first. Ask the cluster office if you are unsure about an offer.",
    source: { label: "Compare the full cost" },
    sourceChecked: false,
    why: () => null,
  },
  {
    id: "csr-ngo",
    name: "CSR and NGO programmes",
    sector: "private",
    level: "Private sector",
    provider: "Company CSR foundations and NGOs working in the district",
    needs: ["soil-training", "subsidy"],
    summary: "Some programmes fund farmer training, FPO support, water structures or solar pumps in specific districts.",
    offers: ["Availability changes year to year. The cluster office keeps track of programmes active near you."],
    eligibility: "Set by each programme; often for small and marginal farmers or women farmers.",
    documents: ["Depends on the programme"],
    howToApply: "Ask the cluster office which programmes are open now.",
    source: { label: "Cluster office list" },
    sourceChecked: false,
    why: () => null,
  },
  {
    id: "buyer-linked",
    name: "Buyer-linked arrangements",
    sector: "private",
    level: "Private sector",
    provider: "Processors, retail aggregators and exporters",
    needs: ["market"],
    summary: "Some buyers agree quality, quantity and price terms before the season, and may offer inputs or advice.",
    offers: ["Read the terms carefully: grading rules, rejection, payment dates. In AgriCluster you choose which buyer requests to accept."],
    eligibility: "Set by each buyer.",
    documents: ["Written agreement"],
    howToApply: "Start from buyer requests in Market, or ask the cluster office before signing an agreement.",
    source: { label: "Read the agreement" },
    sourceChecked: false,
    why: (c) => (c.cropId ? "Buyers in the cluster are already asking for crops like yours." : null),
  },
];

export const supportById = (id: string) => supportCatalogue.find((s) => s.id === id);
