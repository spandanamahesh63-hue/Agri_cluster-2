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

**Reset demo** (sidebar or Profile) restores the starting data.

## Where data is stored

- **With Supabase configured** (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, see `.env.example`), data is saved in a PostgreSQL database.
  - Each browser works in its own *demo space*. Settings and the plan go in a `workspaces` row, and every listing, request and notification is its own `records` row.
  - Profile → "Where your data is saved" shows the status and a share link that opens the same space on another device.
  - A copy stays in the browser, so the app keeps working offline.
- **Without it**, and always in the double-click file and the published artifact, data stays in the browser only.

To set up the database, run `supabase/schema.sql` once in the Supabase SQL Editor. Row-level security lets a browser read and write only the space whose id it sends. This is prototype-grade: before storing real farmers' data, add Supabase Auth (phone OTP) and per-role policies. The sign-in session is never stored in the database.

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

### Government and private support

`data/catalog/support.ts` lists 12 government options (PM-KISAN, PMFBY, Per Drop More Crop, KCC, PM-KUSUM, Soil Health Card, MIDH, FPOs, Agriculture Infrastructure Fund, e-NWR loans, Karnataka's Krishi Bhagya, KVK training). It also lists 6 types of private-sector provider. Government facts were checked against official sources (scheme portals and PIB releases) on 28 Sept 2026, and each card links its source. Private options name kinds of provider, not companies.

AgriCluster never decides eligibility. The farmer's Support page explains why each option fits their plan, keeps a documents checklist, and sends "Ask for help applying" requests to the cluster office (`/cluster/support`). Both sides are notified as the request moves on. Re-check the facts and `LAST_CHECKED` before a real pilot.

### Pricing, policies and commission

- **Public pages:** `/pricing`, `/terms`, `/privacy`, `/refunds` and `/contact`, linked from the sign-in screen. The proposed plans, commission rates and business details all live in `src/data/pricing.ts`.
- **Before going live:**
  - replace the `[placeholders]` in `BUSINESS`
  - have the policy pages reviewed
  - add real sign-in and a payment gateway (for example Razorpay or Cashfree).
- **Commission tracking:** the cluster office's **Revenue** page works out the proposed commission on confirmed bookings, agreed deals and paid consultations. It records no money; nothing is charged or collected.

### Feedback

- **Where it is:** `/feedback` is linked from the sign-in screen ("Share your feedback") and from the footer of the public pages.
- **Anonymous:** no name, phone or demo-space id is sent. An email is sent only if the person asks for a reply.
- **Where responses go:** into the `feedback` table in Supabase (run `supabase/feedback.sql` once). The website can insert rows but not read them; read them in the Supabase dashboard.
- **Without a database** (offline file, embedded preview), the form offers "Copy my answers" and the support email instead of a Send button. Set `FALLBACK_FORM_URL` in `FeedbackPage.tsx` to use a Google Form instead.

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

## Image credits

- **Home page photo:** "Misty Morning Over Lush Rice Fields" by Sadek Husein on Unsplash ([photo page](https://unsplash.com/photos/a-lush-green-paddy-field-under-a-cloudy-sky-oS2AK15fCCI)), used under the Unsplash License.
- **Files:** `src/assets/farm-hero-800.webp` (68 KB, phones and tablets) and `farm-hero-1600.webp` (186 KB, desktops). Only one is downloaded per visit.
- **Section headings:** the crop-row motif on plan steps, Market, Resources and Support is CSS line art (`.agri-header` in `src/index.css`), with no image files.

## Legacy prototype

The original single-file prototype (`public/index.html` + `public/server.js`, Express) is kept unchanged in `public/`. Because of that, Vite serves static assets from `static/`. A backup of the original is in `_backup/`.
