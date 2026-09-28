import type { MarketData } from "../../types";

// Indicative sample market data for planning (spec §14). NOT live prices:
// the pattern illustrates seasonality for a demo; replace with a verified
// source (and its date) before any real use.
const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const series = (prices: number[]) => months.map((month, i) => ({ month, pricePerKg: prices[i] }));

export const marketData: MarketData[] = [
  {
    crop: "Tomato",
    current: [20, 26],
    history: series([22, 17, 12, 11, 12, 14, 18, 24, 30, 34, 28, 22]),
    seasonalNote: "In this sample, prices dip in winter when supply peaks and rise in early monsoon. Harvesting in October usually sits mid-range.",
    demand: "high",
    quality: ["Grade A: firm, uniformly red, 60–80 g", "No cracks or blemishes", "Packed in clean crates"],
    storage: "Short shelf life: 5–7 days at room temperature. Cold room helps for 2–3 weeks.",
    transport: "Crated pickups within 24 hours of picking; avoid stacking more than 5 crates high.",
    source: "indicative",
  },
  {
    crop: "Chilli",
    current: [35, 55],
    history: series([40, 38, 36, 34, 32, 35, 42, 48, 52, 50, 46, 42]),
    seasonalNote: "In this sample, green chilli is steadier than tomato; dried chilli prices depend on colour and pungency.",
    demand: "moderate",
    quality: ["Uniform colour", "No thrips damage", "Dry and clean for dried chilli"],
    storage: "Green chilli: a few days. Dried chilli stores for months if kept dry.",
    transport: "Ventilated bags; keep dry.",
    source: "indicative",
  },
  {
    crop: "Onion",
    current: [16, 24],
    history: series([24, 26, 22, 18, 15, 14, 14, 16, 20, 25, 28, 26]),
    seasonalNote: "In this sample, onion prices swing widely; cured onion that can be stored lets you choose when to sell.",
    demand: "high",
    quality: ["Well cured, dry neck", "Uniform size", "No sprouting"],
    storage: "Stores for 3–5 months in ventilated storage after curing.",
    transport: "Mesh bags; avoid moisture.",
    source: "indicative",
  },
  {
    crop: "French beans",
    current: [25, 40],
    history: series([30, 28, 26, 25, 27, 32, 38, 42, 40, 36, 33, 31]),
    seasonalNote: "In this sample, demand from hotels and retail is steady; prices rise in summer.",
    demand: "moderate",
    quality: ["Tender, snaps cleanly", "Straight pods", "No insect marks"],
    storage: "3–5 days; cool storage helps.",
    transport: "Crates or ventilated bags; same-day delivery preferred.",
    source: "indicative",
  },
  {
    crop: "Leafy vegetables",
    current: [12, 22],
    history: series([16, 14, 12, 12, 13, 15, 18, 20, 19, 17, 16, 16]),
    seasonalNote: "In this sample, prices are modest but cycles are quick; nearby buyers matter most.",
    demand: "moderate",
    quality: ["Fresh, green, no yellowing", "Clean roots removed"],
    storage: "1–2 days.",
    transport: "Early-morning delivery to nearby buyers.",
    source: "indicative",
  },
  {
    crop: "Ragi (finger millet)",
    current: [32, 38],
    history: series([34, 34, 35, 35, 36, 36, 36, 35, 35, 34, 34, 34]),
    seasonalNote: "In this sample, ragi prices are stable through the year; it stores well.",
    demand: "moderate",
    quality: ["Clean, dry grain", "No stones or husk"],
    storage: "Stores for many months when dry.",
    transport: "Bagged; any time.",
    source: "indicative",
  },
];
