// Builds the AgriCluster pitch deck (spec §71) as an editable PowerPoint file.
// Figures come from the prototype's demo data or the spec's pilot targets and
// are labelled as such. Run: `npm run build` in deck/ → AgriCluster-pitch.pptx

import PptxGenJS from "pptxgenjs";

const C = {
  field: "0F3021",
  brand: "1B5538",
  brandMid: "226845",
  leaf: "D6E8DC",
  leafSoft: "E8F3EC",
  canvas: "F6F6F3",
  surface: "FFFFFF",
  line: "E3E5DF",
  ink: "17201B",
  muted: "56615A",
  subtle: "636C65",
  water: "0F6A9C",
  waterSoft: "E7F1F8",
  onDark: "C9DCCF",
  onDarkMuted: "9DB8A7",
};
const HEAD = "Segoe UI Semibold";
const BODY = "Segoe UI";
const W = 13.333;

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.author = "AgriCluster team";
pres.title = "AgriCluster — Small Farms. Shared Resources. Smarter Decisions.";

const img = (name) => `assets/${name}.png`;

// ---------------------------------------------------------------------------
// Building blocks

function contentSlide(n, section, title) {
  const s = pres.addSlide();
  s.background = { color: C.canvas };
  s.addText(`${String(n).padStart(2, "0")}   ${section.toUpperCase()}`, {
    x: 0.6, y: 0.4, w: 8, h: 0.3, fontFace: HEAD, fontSize: 11, color: C.brandMid, charSpacing: 2, margin: 0,
  });
  s.addText(title, { x: 0.6, y: 0.72, w: 12.1, h: 0.85, fontFace: HEAD, fontSize: 30, color: C.ink, margin: 0, valign: "top" });
  s.addText("AgriCluster", { x: 0.6, y: 7.0, w: 3, h: 0.25, fontFace: HEAD, fontSize: 10, color: C.subtle, margin: 0 });
  s.addText(`${n} / 12`, { x: W - 1.6, y: 7.0, w: 1, h: 0.25, fontFace: BODY, fontSize: 10, color: C.subtle, align: "right", margin: 0 });
  return s;
}

/** Screenshot on a white card with a hairline border and soft shadow. */
function screenshot(s, name, x, y, w, h) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.line, width: 0.75 },
    shadow: { type: "outer", color: "17201B", opacity: 0.12, blur: 12, offset: 3, angle: 90 },
  });
  const p = 0.06;
  s.addImage({ path: img(name), x: x + p, y: y + p, w: w - 2 * p, h: h - 2 * p });
}

function caption(s, text, x, y, w) {
  s.addText(text, { x, y, w, h: 0.3, fontFace: BODY, fontSize: 11, color: C.subtle, margin: 0, italic: true });
}

/** Three farms joined into a cluster — the product mark. */
function mark(s, x, y, size) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: size, h: size, rectRadius: size * 0.22, fill: { color: C.brand }, line: { type: "none" } });
  const u = size / 32;
  s.addShape(pres.shapes.ISOSCELES_TRIANGLE, { x: x + 10 * u, y: y + 10.5 * u, w: 12 * u, h: 11 * u, fill: { type: "none" }, line: { color: "AFD1BB", width: 1.5 } });
  const dot = (cx, cy, color) =>
    s.addShape(pres.shapes.OVAL, { x: x + (cx - 3) * u, y: y + (cy - 3) * u, w: 6 * u, h: 6 * u, fill: { color }, line: { type: "none" } });
  dot(16, 10.5, "FFFFFF");
  dot(10, 21.5, "FFFFFF");
  dot(22, 21.5, "AFD1BB");
}

function para(s, runs, opts) {
  s.addText(runs, { fontFace: BODY, fontSize: 14, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 6, ...opts });
}

// ---------------------------------------------------------------------------
// 1 · Title

{
  const s = pres.addSlide();
  s.background = { color: C.field };
  mark(s, 0.8, 0.8, 0.8);
  s.addText("AgriCluster", { x: 0.8, y: 2.1, w: 7.5, h: 1.1, fontFace: HEAD, fontSize: 60, color: "FFFFFF", margin: 0 });
  s.addText("Small Farms. Shared Resources. Smarter Decisions.", { x: 0.8, y: 3.2, w: 7.8, h: 0.6, fontFace: HEAD, fontSize: 24, color: C.leaf, margin: 0 });
  s.addText(
    "Cluster intelligence that connects neighbouring small farms, shares their machinery, labour and expertise, and coordinates their harvests with buyers.",
    { x: 0.8, y: 4.05, w: 7.2, h: 1.2, fontFace: BODY, fontSize: 17, color: C.onDark, margin: 0, valign: "top", lineSpacingMultiple: 1.1 },
  );
  s.addText("Competition prototype  ·  Demonstration cluster: Mysuru Vegetable Cluster, Karnataka", {
    x: 0.8, y: 6.6, w: 8, h: 0.3, fontFace: BODY, fontSize: 12, color: C.onDarkMuted, margin: 0,
  });
  // Phone screenshot of the farmer dashboard
  const ph = 6.0, pw = ph * (1170 / 2532);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.55, y: 0.72, w: pw + 0.16, h: ph + 0.16, rectRadius: 0.25, fill: { color: "0A2217" }, line: { color: "2E5A45", width: 1 } });
  s.addImage({ path: img("farmer-mobile"), x: 9.63, y: 0.8, w: pw, h: ph, rounding: false });
  s.addNotes(
    "AgriCluster is a smart-farming platform for small farms. Instead of trying to make every small farm a fully equipped smart farm on its own, we connect nearby farms into one intelligent cluster. The cluster shares data, machinery, labour, expertise and market access. What you see on the phone is a working prototype: a farmer's dashboard in our demonstration cluster in Mysuru district.",
  );
}

// ---------------------------------------------------------------------------
// 2 · Problem

{
  const s = contentSlide(2, "Problem", "Small farms face big decisions alone");
  const items = [
    ["Fragmented decisions", "Each farmer decides alone when to irrigate, spray and harvest, often without timely data."],
    ["Fragmented resources", "Tractors, labour and technology are hired or bought farm by farm, and everyone needs them in the same week."],
    ["Fragmented information", "Weather, soil and crop signals rarely reach the field in a form a farmer can act on today."],
    ["Fragmented markets", "Small lots mean weak bargaining power, uncertain buyers and avoidable post-harvest loss."],
  ];
  items.forEach(([head, body], i) => {
    const y = 1.95 + i * 1.18;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: y + 0.06, w: 0.06, h: 0.82, fill: { color: C.brand }, line: { type: "none" } });
    s.addText(head, { x: 0.85, y, w: 6.6, h: 0.35, fontFace: HEAD, fontSize: 17, color: C.ink, margin: 0 });
    s.addText(body, { x: 0.85, y: y + 0.38, w: 6.6, h: 0.6, fontFace: BODY, fontSize: 14, color: C.muted, margin: 0, valign: "top" });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.2, y: 1.95, w: 4.55, h: 4.55, rectRadius: 0.12, fill: { color: C.leafSoft }, line: { type: "none" } });
  s.addText("OUR DEMONSTRATION CLUSTER", { x: 8.55, y: 2.25, w: 3.9, h: 0.3, fontFace: HEAD, fontSize: 10, color: C.brandMid, charSpacing: 2, margin: 0 });
  const stat = (big, small, y) => {
    s.addText(big, { x: 8.55, y, w: 3.9, h: 0.75, fontFace: HEAD, fontSize: 40, color: C.brand, margin: 0 });
    s.addText(small, { x: 8.55, y: y + 0.72, w: 3.9, h: 0.3, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0 });
  };
  stat("128", "farmers", 2.65);
  stat("312", "acres, about 2.4 acres per farm", 3.75);
  s.addText("Tomato · Chilli · Onion · Leafy vegetables", { x: 8.55, y: 5.05, w: 3.9, h: 0.3, fontFace: BODY, fontSize: 13, color: C.muted, margin: 0 });
  s.addText("Fictional demonstration data, Mysuru district", { x: 8.55, y: 5.95, w: 3.9, h: 0.3, fontFace: BODY, fontSize: 11, italic: true, color: C.subtle, margin: 0 });
  s.addNotes(
    "Indian agriculture is dominated by small holdings. On a small farm, every decision is taken alone: irrigation, spraying, when to harvest. Machinery and labour are hired farm by farm, so everyone competes for the same tractor in the same week. Information arrives late or in a form that doesn't say what to do. At harvest, small lots mean weak bargaining power. Our demonstration cluster has 128 farmers on 312 acres, about 2.4 acres each. [Optional: add a national figure on small and marginal holdings from the Agriculture Census, after verifying the latest numbers.]",
  );
}

// ---------------------------------------------------------------------------
// 3 · Why existing solutions fall short

{
  const s = contentSlide(3, "Why existing solutions fall short", "Smart-farming tools are built for one farm at a time");
  const tools = [
    ["Weather apps", "Tell you it may rain.", "What that means for today's irrigation."],
    ["Farm IoT dashboards", "Detailed field data.", "A sensor kit per 2-acre farm is hard to justify."],
    ["Crop advisory apps", "General crop guidance.", "Your field's actual condition."],
    ["Equipment rental", "Finding a tractor.", "That 14 farms need one on the same day."],
    ["Market platforms", "Listing a crop.", "Pooling small lots into buyer-sized supply."],
    ["AI chatbots", "Answering questions.", "The farm data and follow-through behind a decision."],
  ];
  tools.forEach(([name, solves, misses], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.1, y = 1.95 + row * 2.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.85, h: 1.8, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.line, width: 0.75 } });
    s.addText(name, { x: x + 0.25, y: y + 0.2, w: 3.4, h: 0.35, fontFace: HEAD, fontSize: 16, color: C.ink, margin: 0 });
    s.addText(
      [
        { text: "Solves  ", options: { fontFace: HEAD, color: C.brandMid } },
        { text: solves, options: { color: C.ink, breakLine: true } },
        { text: "Misses  ", options: { fontFace: HEAD, color: "B3261E" } },
        { text: misses, options: { color: C.ink } },
      ],
      { x: x + 0.25, y: y + 0.65, w: 3.4, h: 1.0, fontFace: BODY, fontSize: 13, margin: 0, valign: "top", paraSpaceAfter: 4 },
    );
  });
  s.addText("Each tool solves one piece. None coordinates the farms around it.", {
    x: 0.6, y: 6.2, w: 12.1, h: 0.45, fontFace: HEAD, fontSize: 18, color: C.brand, margin: 0,
  });
  s.addNotes(
    "Existing smart-farming tools each solve one piece of the problem, and almost all of them are designed around a single farm. A weather app tells you it may rain but not what to do about today's irrigation. A sensor kit per farm is hard to justify on two acres. Rental apps find a tractor but can't see that fourteen farms need one on the same day. Market platforms list a crop but don't pool small lots into what buyers need. Nothing coordinates the farms around each other.",
  );
}

// ---------------------------------------------------------------------------
// 4 · Solution

{
  const s = contentSlide(4, "Solution", "AgriCluster makes the cluster smart, not every farm");
  para(s, "A shared intelligence and coordination layer for a group of neighbouring farms.", { x: 0.6, y: 1.9, w: 6.0, h: 0.7, fontSize: 17, color: C.muted });
  const pillars = [
    ["Connect", "Farmers, farms, machinery, labour, experts and buyers in one cluster."],
    ["Understand", "Farm, weather, sensor, resource and market data turned into suggestions that explain themselves."],
    ["Coordinate", "Shared machinery, labour and expertise, and pooled harvests matched to buyer demand."],
  ];
  pillars.forEach(([h, b], i) => {
    const y = 2.75 + i * 0.95;
    s.addText(h, { x: 0.6, y, w: 1.9, h: 0.35, fontFace: HEAD, fontSize: 17, color: C.brand, margin: 0 });
    s.addText(b, { x: 2.35, y, w: 4.25, h: 0.8, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0, valign: "top" });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.75, w: 6.0, h: 0.8, rectRadius: 0.08, fill: { color: C.field }, line: { type: "none" } });
  s.addText("The platform recommends. The farmer decides.", { x: 0.85, y: 5.75, w: 5.6, h: 0.8, fontFace: HEAD, fontSize: 18, color: "FFFFFF", valign: "middle", margin: 0 });
  screenshot(s, "crop-cluster-map", 7.05, 1.9, 5.7, 5.7 * (1090 / 1440));
  caption(s, "128 farms in six villages, with shared water sources, machinery, cold storage and a collection centre", 7.05, 6.3, 5.7);
  s.addNotes(
    "Our answer is to make the cluster smart rather than every individual farm. AgriCluster is a shared layer around a group of neighbouring farms. It connects the people and resources, turns farm, weather, sensor and market data into suggestions that explain themselves, and coordinates what is shared: machinery, labour, expertise and harvests. The map shows our demonstration cluster: 128 farms in six villages around shared infrastructure. One principle runs through everything: the platform recommends, the farmer decides.",
  );
}

// ---------------------------------------------------------------------------
// 5 · How it works

{
  const s = contentSlide(5, "How it works", "From data to coordinated action");
  const steps = [
    ["Connect", "Farms, resources, experts and buyers join the cluster"],
    ["Collect", "Farmer input, weather, sensors, energy and market data"],
    ["Analyze", "Rules check the data against each crop and plan"],
    ["Recommend", "A suggestion with its reasons and data"],
    ["Coordinate", "Shared machinery, labour and buyers across farms"],
    ["Act", "The farmer accepts, ignores or checks first"],
    ["Measure", "Water, energy, inputs, loss and prices"],
  ];
  // Seven chevrons that exactly span the 12.13" content width (0.6" → 12.73").
  const overlap = 0.12;
  const cw = (12.13 + 6 * overlap) / 7;
  steps.forEach(([name, text], i) => {
    const x = 0.6 + i * (cw - overlap);
    s.addShape(i === 0 ? pres.shapes.PENTAGON : pres.shapes.CHEVRON, {
      x, y: 2.0, w: cw, h: 0.75, fill: { color: i < 5 ? C.brand : C.brandMid }, line: { color: C.canvas, width: 1.5 },
    });
    // Label sits between the left notch and the right point.
    s.addText(name, { x: x + (i === 0 ? 0.1 : 0.34), y: 2.0, w: cw - (i === 0 ? 0.45 : 0.62), h: 0.75, fontFace: HEAD, fontSize: 12.5, color: "FFFFFF", valign: "middle", align: i === 0 ? "left" : "center", margin: 0 });
    s.addText(text, { x: x + 0.1, y: 2.9, w: cw - 0.25, h: 1.0, fontFace: BODY, fontSize: 12, color: C.muted, margin: 0, valign: "top" });
  });
  // Worked example
  s.addText("ONE EXAMPLE FROM THE PROTOTYPE", { x: 0.6, y: 4.15, w: 6, h: 0.3, fontFace: HEAD, fontSize: 10, color: C.water, charSpacing: 2, margin: 0 });
  const ex = [
    ["Signal", "Rain 82% likely from 6:30 pm. Field 1 soil moisture 64%; tomato needs at least 55%."],
    ["Suggestion", "Consider delaying Field 1 irrigation by 24 hours, with the data shown."],
    ["Decision", "The farmer accepts. The schedule moves; one tap undoes it."],
    ["Measured", "About 36,000 L of water and 11 kWh of pumping avoided (indicative)."],
  ];
  ex.forEach(([h, b], i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.55, w: 2.85, h: 1.95, rectRadius: 0.08, fill: { color: C.waterSoft }, line: { type: "none" } });
    s.addText(h, { x: x + 0.2, y: 4.72, w: 2.5, h: 0.3, fontFace: HEAD, fontSize: 14, color: C.water, margin: 0 });
    s.addText(b, { x: x + 0.2, y: 5.1, w: 2.5, h: 1.3, fontFace: BODY, fontSize: 13, color: C.ink, margin: 0, valign: "top" });
    if (i < 3) s.addText("→", { x: x + 2.83, y: 5.25, w: 0.3, h: 0.4, fontFace: BODY, fontSize: 18, color: C.water, align: "center", margin: 0 });
  });
  s.addNotes(
    "The platform works in seven steps: connect, collect, analyze, recommend, coordinate, act and measure. Here is one real example from the prototype. Rain is 82 percent likely this evening, and Field 1's soil moisture is already above what the tomato crop needs. So AgriCluster suggests delaying irrigation by a day, and shows exactly which data led to that. The farmer accepts with one tap, and the schedule moves. That single decision avoids roughly 36,000 litres of water and 11 kilowatt-hours of pumping, an indicative estimate.",
  );
}

// ---------------------------------------------------------------------------
// 6 · Cluster intelligence

{
  const s = contentSlide(6, "Cluster intelligence", "One signal on one farm becomes a pattern across the cluster");
  s.addText("DATA COMBINED", { x: 0.6, y: 1.9, w: 4, h: 0.3, fontFace: HEAD, fontSize: 10, color: C.brandMid, charSpacing: 2, margin: 0 });
  const tags = ["Farm & crop stage", "Soil moisture", "Weather", "Water & energy", "Machinery", "Labour", "Experts", "Market demand"];
  tags.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 2.35, y = 2.3 + row * 0.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.2, h: 0.38, rectRadius: 0.19, fill: { color: C.leafSoft }, line: { type: "none" } });
    s.addText(t, { x, y, w: 2.2, h: 0.38, fontFace: BODY, fontSize: 12, color: C.brand, align: "center", valign: "middle", margin: 0 });
  });
  s.addText("ACROSS THE CLUSTER TODAY", { x: 0.6, y: 4.45, w: 4.6, h: 0.3, fontFace: HEAD, fontSize: 10, color: C.brandMid, charSpacing: 2, margin: 0 });
  para(
    s,
    [
      { text: "24 farms", options: { fontFace: HEAD } }, { text: " plan to irrigate before tonight's rain", options: { breakLine: true } },
      { text: "6 tomato farms", options: { fontFace: HEAD } }, { text: " show possible crop stress", options: { breakLine: true } },
      { text: "14 tractor requests", options: { fontFace: HEAD } }, { text: " for 9 tractors tomorrow", options: { breakLine: true } },
      { text: "42 t of tomato", options: { fontFace: HEAD } }, { text: " expected against 35 t of buyer demand" },
    ],
    { x: 0.6, y: 4.8, w: 4.7, h: 1.8, fontSize: 14, paraSpaceAfter: 8 },
  );
  screenshot(s, "crop-reasoning", 5.6, 1.9, 7.15, 7.15 / 2);
  caption(s, "Every suggestion shows what is happening, why it matters, and the data behind it, with each value's source labelled.", 5.6, 5.6, 7.15);
  s.addText("Demonstration data", { x: 5.6, y: 5.95, w: 3, h: 0.3, fontFace: BODY, fontSize: 11, color: C.subtle, margin: 0 });
  s.addNotes(
    "This is what we call cluster intelligence. AgriCluster combines farm and crop data, soil moisture, weather, water and energy, machinery, labour, experts and market demand. For one farmer, it produces a suggestion that explains itself, as on the right. Across the cluster the same signals become patterns a coordinator can act on: 24 farms about to irrigate before rain, 6 tomato farms under stress, 14 tractor requests for 9 tractors, and 42 tonnes of tomato coming against 35 tonnes of buyer demand.",
  );
}

// ---------------------------------------------------------------------------
// 7 · Product

{
  const s = contentSlide(7, "Product", "Six roles, one connected cluster");
  const roles = [
    ["Farmer", "Decisions with reasons; requests resources; lists harvests."],
    ["Cluster manager", "Sees all 128 farms; coordinates water, resources, buyers."],
    ["Buyer", "Posts requirements, sees pooled supply, accepts offers."],
    ["Machinery owner", "Lists equipment and availability, accepts bookings."],
    ["Labour", "Lists skills and availability, accepts and tracks work."],
    ["Expert", "Answers questions with farm data in view; schedules visits."],
  ];
  roles.forEach(([r, d], i) => {
    const y = 1.9 + i * 0.8;
    s.addText(r, { x: 0.6, y, w: 4.8, h: 0.3, fontFace: HEAD, fontSize: 15, color: C.brand, margin: 0 });
    s.addText(d, { x: 0.6, y: y + 0.3, w: 4.8, h: 0.45, fontFace: BODY, fontSize: 12.5, color: C.ink, margin: 0, valign: "top" });
  });
  screenshot(s, "cluster-overview", 5.75, 1.9, 7.0, 7.0 * (1620 / 2880));
  caption(s, "Cluster overview in the working prototype. A farmer's decision updates what every other role sees.", 5.75, 5.95, 7.0);
  s.addNotes(
    "The product has six connected roles: farmer, cluster manager, buyer, machinery owner, labour and expert. They all work on the same shared records. When the farmer requests a tractor, the owner accepts it. When the farmer lists a harvest, the buyer sees it. When the farmer delays irrigation, the cluster dashboard updates. [If showing the live demo, switch now: open the prototype and use the Guided demo button.]",
  );
}

// ---------------------------------------------------------------------------
// 8 · Impact

{
  const s = contentSlide(8, "Impact", "Impact we will measure against a baseline");
  const kpis = [
    ["15–20%", "less avoidable water use"],
    ["10–15%", "better input efficiency"],
    ["10%", "less crop loss"],
    ["5–10%", "better market realisation"],
  ];
  kpis.forEach(([big, label], i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.9, w: 2.85, h: 1.85, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.line, width: 0.75 } });
    s.addText(big, { x: x + 0.25, y: 2.1, w: 2.4, h: 0.75, fontFace: HEAD, fontSize: 36, color: C.brand, margin: 0 });
    s.addText(label, { x: x + 0.25, y: 2.9, w: 2.4, h: 0.35, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0 });
    s.addText("Pilot target", { x: x + 0.25, y: 3.3, w: 2.4, h: 0.3, fontFace: BODY, fontSize: 11, color: C.subtle, margin: 0 });
  });
  s.addText("Pilot targets are illustrative goals, not guaranteed outcomes. Improvements are claimed only against a measured baseline season.", {
    x: 0.6, y: 3.95, w: 12.1, h: 0.3, fontFace: BODY, fontSize: 12, italic: true, color: C.subtle, margin: 0,
  });
  s.addText("WHAT THE PROTOTYPE ALREADY SHOWS", { x: 0.6, y: 4.55, w: 6, h: 0.3, fontFace: HEAD, fontSize: 10, color: C.brandMid, charSpacing: 2, margin: 0 });
  const shows = [
    ["≈36,000 L", "water and ≈11 kWh pumping avoided by one accepted irrigation suggestion (indicative)"],
    ["42 t vs 35 t", "pooled tomato supply against buyer demand, visible a week before harvest"],
    ["14 vs 9", "tractor requests against available tractors, flagged a day ahead"],
  ];
  shows.forEach(([big, text], i) => {
    const x = 0.6 + i * 4.1;
    s.addText(big, { x, y: 4.95, w: 3.8, h: 0.55, fontFace: HEAD, fontSize: 24, color: C.water, margin: 0 });
    s.addText(text, { x, y: 5.5, w: 3.7, h: 0.9, fontFace: BODY, fontSize: 13, color: C.ink, margin: 0, valign: "top" });
  });
  s.addNotes(
    "We will measure impact against a baseline, not promise it. The pilot targets are 15 to 20 percent less avoidable water use, 10 to 15 percent better input efficiency, 10 percent less crop loss, and 5 to 10 percent better market realisation. These are illustrative goals, not guaranteed outcomes. The prototype already shows the mechanism: one accepted suggestion avoids about 36,000 litres of water; the cluster sees 42 tonnes of tomato against 35 tonnes of demand a week ahead; and a tractor shortage is visible a day before it happens.",
  );
}

// ---------------------------------------------------------------------------
// 9 · Business model

{
  const s = contentSlide(9, "Business model", "Revenue follows coordination");
  const rows = [
    ["Cluster services", "FPOs, cluster organisations, agriculture programmes", "Subscription per cluster"],
    ["Equipment marketplace", "Equipment owners and renters", "Commission on completed bookings"],
    ["Expert services", "Farmers or sponsoring institutions", "Commission or subscription"],
    ["Market linkage", "Buyers", "Service fee on agreed deals"],
    ["Technology & analytics", "Institutions and agricultural organisations", "Implementation fees and cluster analytics"],
  ];
  const cols = [0.6, 3.85, 7.85];
  const widths = [3.1, 3.85, 4.9];
  ["Revenue stream", "Who pays", "Model"].forEach((h, i) =>
    s.addText(h.toUpperCase(), { x: cols[i], y: 1.95, w: widths[i], h: 0.3, fontFace: HEAD, fontSize: 10, color: C.brandMid, charSpacing: 2, margin: 0 }),
  );
  rows.forEach((r, j) => {
    const y = 2.35 + j * 0.7;
    s.addShape(pres.shapes.LINE, { x: 0.6, y: y - 0.05, w: 12.15, h: 0, line: { color: C.line, width: 0.75 } });
    r.forEach((cell, i) =>
      s.addText(cell, { x: cols[i], y, w: widths[i], h: 0.6, fontFace: i === 0 ? HEAD : BODY, fontSize: 14, color: i === 0 ? C.ink : C.muted, margin: 0, valign: "middle" }),
    );
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.95, w: 12.15, h: 0.65, rectRadius: 0.08, fill: { color: C.leafSoft }, line: { type: "none" } });
  s.addText(
    [
      { text: "Start simple.  ", options: { fontFace: HEAD, color: C.brand } },
      { text: "The pilot runs on a cluster subscription and a marketplace commission. The rest follows as volume grows.", options: { color: C.ink } },
    ],
    { x: 0.85, y: 5.95, w: 11.7, h: 0.65, fontFace: BODY, fontSize: 14, valign: "middle", margin: 0 },
  );
  s.addNotes(
    "Revenue follows coordination. Cluster organisations such as FPOs pay a subscription for the cluster layer. The equipment marketplace earns a commission on completed bookings. Expert services and market linkage earn a commission or fee when they create value, and institutions can pay for implementation and cluster analytics. We keep the start simple: the pilot needs only the cluster subscription and the marketplace commission.",
  );
}

// ---------------------------------------------------------------------------
// 10 · Pilot

{
  const s = contentSlide(10, "Pilot", "Pilot: one cluster, measured over a season");
  [["100+", "farmers"], ["250+", "acres"], ["1", "cluster"]].forEach(([big, small], i) => {
    const y = 1.9 + i * 1.5;
    s.addText(big, { x: 0.6, y, w: 2.6, h: 0.85, fontFace: HEAD, fontSize: 48, color: C.brand, margin: 0 });
    s.addText(small, { x: 0.6, y: y + 0.85, w: 2.6, h: 0.35, fontFace: BODY, fontSize: 15, color: C.ink, margin: 0 });
  });
  const phases = [
    ["Baseline season", "Record water, energy, input costs, crop loss, prices and machinery use before AgriCluster."],
    ["Pilot season", "Farmers use AgriCluster. The same measures are recorded the same way."],
    ["Compare and decide", "Report against the targets, and decide on expansion to more clusters in the district."],
  ];
  phases.forEach(([h, b], i) => {
    const y = 1.95 + i * 1.5;
    s.addShape(pres.shapes.OVAL, { x: 3.7, y, w: 0.5, h: 0.5, fill: { color: C.brand }, line: { type: "none" } });
    s.addText(String(i + 1), { x: 3.7, y, w: 0.5, h: 0.5, fontFace: HEAD, fontSize: 15, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: 3.95, y: y + 0.55, w: 0, h: 0.9, line: { color: C.leaf, width: 2 } });
    s.addText(h, { x: 4.45, y: y + 0.03, w: 4.2, h: 0.4, fontFace: HEAD, fontSize: 17, color: C.ink, margin: 0 });
    s.addText(b, { x: 4.45, y: y + 0.45, w: 4.2, h: 0.9, fontFace: BODY, fontSize: 13, color: C.muted, margin: 0, valign: "top" });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.2, y: 1.9, w: 3.55, h: 4.6, rectRadius: 0.1, fill: { color: C.surface }, line: { color: C.line, width: 0.75 } });
  s.addText("WHAT WE TRACK", { x: 9.5, y: 2.15, w: 3, h: 0.3, fontFace: HEAD, fontSize: 10, color: C.brandMid, charSpacing: 2, margin: 0 });
  s.addText(
    ["Water use", "Energy use", "Input costs", "Crop loss", "Machinery utilisation", "Market realisation", "Farmer adoption"].map((t, i, a) => ({
      text: t, options: { bullet: { code: "25CF" }, breakLine: i < a.length - 1 },
    })),
    { x: 9.5, y: 2.6, w: 3.0, h: 3.6, fontFace: BODY, fontSize: 15, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 10 },
  );
  s.addNotes(
    "The pilot is one cluster of more than 100 farmers on more than 250 acres. We measure a baseline season first, recording water, energy, input costs, crop loss, prices and machinery use. Then farmers use AgriCluster for a season and we record the same measures the same way. We report against the targets and only then decide on expanding to more clusters. We also track farmer adoption, because a suggestion that isn't used has no impact.",
  );
}

// ---------------------------------------------------------------------------
// 11 · Scalability

{
  const s = contentSlide(11, "Scalability", "The intelligence layer scales. The farms stay small.");
  const levels = ["One farm", "Local cluster", "District clusters", "Multiple regions", "Agricultural network"];
  // Conceptual stages (not data): steps rise and deepen in tint; the pilot stage is outlined.
  const tints = ["D6E8DC", "AFD1BB", "7FB395", "4F8F6C", "226845"];
  levels.forEach((l, i) => {
    const h = 0.7 + i * 0.62, x = 0.6 + i * 1.62, base = 5.9;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: base - h, w: 1.45, h, fill: { color: tints[i] }, line: i === 1 ? { color: C.field, width: 2.25 } : { type: "none" },
    });
    s.addText(l, { x, y: base + 0.1, w: 1.45, h: 0.6, fontFace: HEAD, fontSize: 12, color: C.ink, align: "center", valign: "top", margin: 0 });
  });
  s.addText("Pilot starts here", { x: 2.22, y: 4.25, w: 1.45, h: 0.5, fontFace: HEAD, fontSize: 11, color: C.field, align: "center", margin: 0 });
  const points = [
    ["Simulation-first", "Works from farmer input and shared sensors today. Real sensors and data feeds plug into the same interfaces later."],
    ["Same engine, every cluster", "A new cluster reuses the intelligence rules, roles and screens. Only local data changes."],
    ["Network effects", "Each new cluster brings more buyers, equipment providers and experts to every member."],
  ];
  points.forEach(([h, b], i) => {
    const y = 1.95 + i * 1.45;
    s.addText(h, { x: 9.0, y, w: 3.75, h: 0.35, fontFace: HEAD, fontSize: 16, color: C.ink, margin: 0 });
    s.addText(b, { x: 9.0, y: y + 0.38, w: 3.75, h: 1.0, fontFace: BODY, fontSize: 13, color: C.muted, margin: 0, valign: "top" });
  });
  s.addNotes(
    "The model scales from one farm to a local cluster, then district clusters, multiple regions and a larger network. What scales is the intelligence and coordination layer; the farms stay small. We are simulation-first: the platform runs today on farmer input and shared sensors, and real sensors and data feeds plug into the same interfaces later. Every new cluster reuses the same engine, roles and screens, and brings more buyers, providers and experts to everyone.",
  );
}

// ---------------------------------------------------------------------------
// 12 · Vision

{
  const s = pres.addSlide();
  s.background = { color: C.field };
  s.addText("12   VISION", { x: 0.6, y: 0.4, w: 6, h: 0.3, fontFace: HEAD, fontSize: 11, color: C.onDarkMuted, charSpacing: 2, margin: 0 });
  s.addText("Connected agricultural clusters across India", { x: 0.6, y: 0.72, w: 12.1, h: 0.85, fontFace: HEAD, fontSize: 32, color: "FFFFFF", margin: 0 });
  const cols = [
    ["Today", ["Fragmented farms", "Fragmented information", "Fragmented resources", "Fragmented decisions", "Fragmented markets"], "2A4A3A"],
    ["With AgriCluster", ["Connected farms", "Shared resources", "Integrated data", "Cluster intelligence", "Coordinated decisions and markets"], C.brand],
    ["Future", ["More efficient, more resilient agricultural clusters, where farmers keep the decisions and technology does the coordination."], "2E6B4E"],
  ];
  cols.forEach(([h, items, fill], i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: 3.85, h: 3.75, rectRadius: 0.1, fill: { color: fill }, line: { type: "none" } });
    s.addText(h, { x: x + 0.3, y: 2.2, w: 3.3, h: 0.4, fontFace: HEAD, fontSize: 18, color: "FFFFFF", margin: 0 });
    s.addText(
      items.map((t, j) => ({ text: t, options: { breakLine: j < items.length - 1 } })),
      { x: x + 0.3, y: 2.8, w: 3.3, h: 2.7, fontFace: BODY, fontSize: 15, color: C.onDark, margin: 0, valign: "top", paraSpaceAfter: 8 },
    );
    if (i < 2) s.addText("→", { x: x + 3.85, y: 3.55, w: 0.25, h: 0.5, fontFace: BODY, fontSize: 20, color: C.onDarkMuted, align: "center", margin: 0 });
  });
  mark(s, 0.6, 6.15, 0.55);
  s.addText(
    [
      { text: "Small Farms. Shared Resources. Smarter Decisions.", options: { fontFace: HEAD, color: "FFFFFF", breakLine: true } },
      { text: "The platform recommends. The farmer decides.", options: { color: C.onDark } },
    ],
    { x: 1.35, y: 6.1, w: 8, h: 0.7, fontFace: BODY, fontSize: 14, margin: 0, valign: "middle" },
  );
  s.addNotes(
    "Our vision is a network of intelligent agricultural clusters across India. Today, farms, information, resources, decisions and markets are fragmented. With AgriCluster they are connected: shared resources, integrated data, cluster intelligence and coordinated decisions and markets. The result is more efficient, more resilient clusters, where farmers keep the decisions and technology does the coordinating. Small farms, shared resources, smarter decisions. Thank you.",
  );
}

await pres.writeFile({ fileName: "AgriCluster-pitch.pptx" });
console.log("Wrote AgriCluster-pitch.pptx");
