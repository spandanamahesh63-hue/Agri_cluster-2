# AgriCluster: talk track

A spoken script for the pitch (about 3 minutes), the live demo (about 4 minutes) and judges' questions. Read it aloud a few times; keep the numbers exact.

**Before you start**

- Open the app and click **Guided demo**. On step 1, press **Reset demo data**.
- Keep `AgriCluster-pitch.pptx` open in another window.
- If the Netlify site is private or the internet is slow, use `release/AgriCluster.html`. It works offline.

---

## Part 1: Pitch (about 3 minutes, slides 1–5)

**Slide 1 · Title (20 s)**
"AgriCluster helps a small farmer make the season's big decisions: which crop, which method, how much to invest and who to sell to. Right crop, right technology, right resource, right investment, right support. On the phone is our working prototype: the dashboard of Spandana, who farms one acre near Chamarajanagara."

**Slide 2 · Problem (35 s)**
"A small farmer decides alone. She hires tractors and labour farm by farm, in the same week as everyone else. Weather and soil data rarely reach her in a form she can act on. At harvest, a small lot means weak bargaining power. Our demonstration cluster has 128 farmers on 312 acres, about 2.4 acres each."

**Slide 3 · Why existing tools fall short (25 s)**
"Weather apps, sensor kits, advisory apps, rental apps and market platforms each solve one piece, and almost all of them are built for one farm at a time. Nothing coordinates the farms around each other."

**Slide 4 · Solution (30 s)**
"AgriCluster does three things. It **guides** the farmer from farm details to the right crop, method, investment and plan, and explains every suggestion. It **connects** her to machinery, labour, experts, buyers, and government and private support. It **coordinates** what is shared across 128 farms. One principle runs through all of it: the platform recommends, the farmer decides."

**Slide 5 · The farmer's journey (40 s)**
"Here is Spandana's season in the prototype.
- She has 1 acre of red soil with drip irrigation and ₹1,50,000 to invest.
- AgriCluster ranks tomato as the best match and shows why. Precision farming suits her drip and solar.
- It splits her budget across ten costs and suggests renting the tractor and sprayer rather than buying them.
- It builds a calendar to her first harvest around 4 October.
- She lists 2,000 kg of Grade A tomato and chooses what buyers can see. A buyer sends a request, and she decides.
Every figure is an indicative range, never a guarantee. Let me show you."

→ **Switch to the live demo.**

---

## Part 2: Live demo (about 4 minutes, guided tour)

The guide panel shows what to press at every step. Say one line per step; don't read the panel.

| Steps | Say |
|---|---|
| 1–2 Open, choose Farmer | "Seven roles share one cluster. This is Spandana's dashboard." |
| 3–4 Farm details, goal | "Only questions that change a recommendation. She starts from the money she has, ₹1,50,000." |
| 5–6 Crop | Open "Why are we suggesting this crop?" "Tomato fits her red soil, her water, her drip, and buyers are asking for it." |
| 7–9 Method + video | "Only methods that suit tomato on her farm. Precision farming is the best match." |
| 10 Investment | Move the slider. "The split always adds up. Renting is the default; buying shows the one-time cost." |
| 11 Shared machinery | Tick two, press **Compare**. "Providers in the cluster: price, availability, service type." |
| 12–13 Market, calendar | "Sample prices, clearly labelled. First harvest around 4 October." |
| 14–15 Resources, finished plan | "Crews, experts and support matched to her plan. Eligibility is never decided by the app." |
| 16 Harvest listing | "2,000 kg of Grade A tomato. She chooses what buyers see." |
| 17–20 Buyer | "The buyer searches, sees only what she approved, with no phone number or finances, and requests her." |
| 21 Notification | Open the bell. "Spandana is notified and decides: accept or decline." |

**If you have 30 seconds more:** open **Support** in the farmer menu.
"Twelve government schemes, like PM-KISAN, PMFBY crop insurance, the drip subsidy and the Kisan Credit Card, and six kinds of private support. The facts are checked against official sources with a date. She taps 'Ask for help applying', and the cluster office is notified."

---

## Part 3: Close (30 s, slides 8–12)

"We measure impact against a baseline and don't promise it. In the prototype, one accepted irrigation suggestion avoids about 15,000 litres of water on one acre. The cluster sees 42 tonnes of tomato against 35 tonnes of buyer demand a week ahead, and 14 tractor requests for 9 tractors a day ahead. The pilot is one cluster of more than 100 farmers over a season. Small farms, shared resources, smarter decisions. Thank you."

---

## Judges' questions: honest answers

**"Is this real data?"**
"The farms, sensors and prices are demonstration data, labelled on every screen. The government scheme facts are real, checked against official sources on 28 September 2026. What users do is stored in a real cloud database."

**"Where is the data stored? Is it secure?"**
"In a Supabase PostgreSQL database. Each demo space can read and write only its own rows; the database enforces that with row-level security, and we tested that one space can't read or change another. For real farmers we'd add phone-OTP sign-in and per-role permissions in the database. The design for that is already in the code."

**"Does the app decide who is eligible for a scheme?"**
"No. It shows why a scheme may fit and what documents are usually needed. The official office decides. The farmer can ask the cluster office for help applying."

**"How is the income estimated?"**
"From indicative yield and price ranges per crop. It's always shown as a range and never as a guarantee."

**"Why would a farmer trust the recommendations?"**
"Every suggestion shows its reasons and the data behind it, and the farmer can accept, ignore or check first. The platform recommends; the farmer decides."

**"How does it make money?"**
"A cluster subscription paid by FPOs and cluster organisations, plus a commission on completed equipment bookings. Expert, market-linkage and analytics fees come later."

**"What does it take to start a new cluster?"**
"The same rules, roles and screens. Only the local data changes: farms, providers, buyers and schemes."

**"What about farmers without smartphones?"**
"The cluster office and community organisers work on the farmer's behalf. That's why those are roles in the app. A regional-language interface is next."
