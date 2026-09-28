# AgriCluster

**Right Crop. Right Technology. Right Resource. Right Investment. Right Support.**

AgriCluster guides a small farmer from farm information to a buyer: assessment → goal → crop → method → investment → market → cropping plan → resources → harvest listing → buyer connection. Around that journey it connects the farmer to shared machinery and technology, labour, experts, community groups and support, across a cluster of nearby farms. It suggests practical actions with the reasoning shown.

> The platform recommends. The farmer decides.

This is a competition prototype. All data is **demo, simulated or indicative** and is labelled that way in the UI. No physical sensors, payments or live market feeds are connected.

---

## Run it

Requires Node 20+ (developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Sign in from the login screen with **Demo access**. Pick any of the seven roles:

- Farmer (Spandana, 1 acre near Chamarajanagara)
- Cluster Manager
- Buyer
- Machinery / Tech Owner
- Labour
- Expert
- Community

Everything you do is stored in your browser only. **Reset demo** (sidebar or Profile) restores the starting data.

## Sharing with judges

| Option | How | Needs |
|---|---|---|
| **Single file (recommended)** | `npm run build:single` → `release/AgriCluster.html`. Send `release/AgriCluster-demo.zip`, which holds the HTML file plus `HOW-TO-OPEN.txt`. Judges double-click the file. | A browser only; works offline |
| **Hosted page** | Publish `release/artifact/agricluster.html` (page content only; the host supplies `<html>`/`<body>`). | A host that accepts one HTML page |
| **Static hosting** | `npm run build`, then deploy `dist/` to Netlify (`_redirects` included) or Vercel (`vercel.json` included). | Any static host |
| **Local server** | `npm run build && npm run serve` → http://localhost:4173. Zero-dependency Node server with deep-link support. | Node |

The single-file build routes with the URL hash (`#/farmer/market`), so it works from `file://` and inside a hosted page. Everything is inlined except the Inter web font, which falls back to a system font offline.

## Pitch deck

`deck/AgriCluster-pitch.pptx` (plus `AgriCluster-pitch.pdf`) is the 12-slide pitch deck. It has speaker notes, sized for about 7 minutes. It is generated from app screenshots and demo figures:

```bash
cd deck && npm install && npm run build   # rewrites AgriCluster-pitch.pptx
```

To refresh screenshots after UI changes, recapture them into `deck/assets/` at 1440×810, 2× scale, then rebuild.

## Presenting the demo

Click **Guided demo** on the login screen, or the presentation icon in the app header. The panel walks through the 21-step competition demo flow (spec §37). Each step says what to show and what to press, and the panel switches roles automatically:

1. Open AGRI CLUSTER
2. Choose Farmer
3. Enter farm details
4. Select a farming goal
5. Receive crop options
6. Select a crop
7. See suitable farming methods
8. Watch "How it works"
9. Select a method
10. Optimise investment
11. See shared machinery and services
12. View market analysis
13. Generate the cropping plan
14. See experts, labour and resources
15. Complete the farming plan
16. Create a harvest listing
17. Switch to Buyer
18. Search for the crop
19. View farmer-approved information
20. Request farmer connection
21. The farmer is notified

Start with **Reset demo data** on step 1 so the plan and listings begin fresh.

The demo runs on a fixed **demo clock** (Sun 27 Sept 2026, 8:30 am IST), so "rain in 10 hours" and "harvest in 7 days" stay true whenever you present.

## How it fits together

```
src/
  types/                  Domain model (Farm, CropCycle, Recommendation, Booking, …)
  data/mock/              All demo data, centralised
    clusterFarms.ts       128-farm roster, generated deterministically and normalised
                          to the headline figures (128 farms, 312 acres, 42 t tomato…)
    activity.ts           Seeded activity from other members, so each role has an inbox
    community.ts          Farmer groups and events
  data/catalog/           Crops, methods, sample market series, support options (all indicative)
  services/
    api/demoApi.ts        The only place screens get data from. Replace with real APIs.
    intelligence/engine.ts  Rule-based IntelligenceEngine (farm + cluster analysis)
    planning/planner.ts   Crop, method, budget, buy-vs-rent and calendar rules for the farmer journey
  store/AppStore.tsx      Session + everything users create; shared by all roles
  features/notifications/rules.ts  Who is notified about each new record or status change
  features/               Feature logic & components (intelligence, water, cluster, buyer…)
  pages/                  One folder per role, plus auth and shared screens
  components/             Design system: ui, layout, navigation, forms, charts, modals
```

### The intelligence engine

`analyzeFarm()` and `analyzeCluster()` are deterministic rules. Each recommendation carries:

- what is happening;
- why it matters;
- the evidence behind it, with each value's data source;
- an indicative impact;
- the action;
- optionally, an `effect`, e.g. rescheduling irrigation when the farmer accepts.

An ML or LLM layer can sit behind the same interface later without changing any screen.

### Roles act on shared records

The app store holds bookings, labour requests, consultations, listings, buyer requests, requirements, equipment, community posts, groups and events. Each role sees the same records from its own side:

- A farmer's booking is what the machinery owner accepts.
- A farmer's listing is what the buyer searches and requests.
- A farmer's question is what the expert answers.

Every new record and status change notifies the other side through `features/notifications/rules.ts`, applied centrally in the store. Nobody is notified of their own action.

### Privacy

`features/shared/privacy.ts` decides who sees what. Buyers see only what the farmer approved on each listing (method, photos, village, name). They never see phone numbers, finances or documents. Labour sees the crop and village of the job. Experts see the message and chosen field.

The cluster view (`features/cluster/useClusterView.ts`) layers this activity onto the roster. For example, when Farm #27 delays irrigation, "farms irrigating before rain" drops from 24 to 23.

### Moving towards production

- **Data:** replace the functions in `services/api/demoApi.ts` with calls to a real backend (e.g. PostgreSQL). Screens don't import mock data directly.
- **Sensors and weather:** readings are typed as `SensorReading` / `WeatherForecast` with a `source`. Switch it to `"live"` only for real feeds.
- **Auth:** sign-in is simulated (`store/AppStore.tsx`).

## Design & accessibility

- **Tokens:** a single design-token set lives in `src/index.css`. Status is always shown with an icon and a word, never colour alone. Text colours meet WCAG AA contrast.
- **Charts** (Recharts):
  - use a colour-blind-checked palette (`components/charts/palette.ts`);
  - include a legend and a **Table** view;
  - never use a second y-axis.
- **Keyboard and screen readers:**
  - a skip link, page titles, and focus moving to the page on navigation;
  - dialogs trap focus and close on Escape;
  - the cluster map is one labelled image, with the farm list as its accessible equivalent.
- **Responsive:** phones get a bottom tab bar and a "More" drawer rather than a shrunken sidebar.

## Legacy prototype

The original single-file prototype (`public/index.html` + `public/server.js`, Express) is kept unchanged in `public/`. Because of that, Vite serves static assets from `static/`. A backup of the original is in `_backup/`.
