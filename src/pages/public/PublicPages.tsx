import { useEffect, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";
import { Check, FileWarning, MessageSquareHeart } from "lucide-react";
import { Logo } from "../../components/layout/Logo";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { BUSINESS, FARMER_PROMISE, PRICING_STATUS, commissionRates, isPlaceholder, plans, type RevenueStream } from "../../data/pricing";
import { TAGLINE } from "../../data/brand";
import { databaseName } from "../../services/storage/cloud";
import { formatDate, formatINR } from "../../utils/format";

const links = [
  { to: "/pricing", label: "Pricing" },
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/refunds", label: "Refunds" },
  { to: "/contact", label: "Contact" },
  { to: "/feedback", label: "Feedback" },
];

/** The visible call to action that opens the feedback form. */
export function FeedbackButton({ className }: { className?: string }) {
  return (
    <ButtonLink to="/feedback" variant="secondary" size="sm" className={className} icon={<MessageSquareHeart aria-hidden className="size-4" />}>
      Share your feedback
    </ButtonLink>
  );
}

/** Links to the public pages, for the sign-in screen and page footers. */
export function PublicFooterLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="About AgriCluster" className={clsx("flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-ink-muted", className)}>
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="hover:text-ink hover:underline">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function PublicLayout({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · AgriCluster`;
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/login" aria-label="AgriCluster home">
            <Logo subtitle={false} />
          </Link>
          <nav aria-label="Public pages" className="flex flex-wrap gap-1 text-[13px]">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => clsx("rounded-md px-2.5 py-1.5", isActive ? "bg-brand-50 font-medium text-brand-800" : "text-ink-muted hover:text-ink")}
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/" className="rounded-md px-2.5 py-1.5 font-medium text-brand-700 hover:underline">
              Open the app
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {children}
      </main>
      <footer className="border-t border-line py-6">
        <p className="mb-2 text-center text-[12px] text-ink-subtle">{TAGLINE}</p>
        <PublicFooterLinks />
        {title !== "Share your feedback" && (
          <div className="mt-4 flex justify-center">
            <FeedbackButton />
          </div>
        )}
      </footer>
    </div>
  );
}

/** Legal pages are drafts until reviewed and the business details are filled in. */
function DraftNotice() {
  const missing = Object.entries(BUSINESS).some(([, v]) => isPlaceholder(v));
  return (
    <div className="mt-4 flex gap-2 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-[13px]">
      <FileWarning aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>
        <span className="font-medium">Draft for the prototype. </span>
        Have it reviewed by a lawyer before taking payments{missing ? ", and replace the [placeholders] with your business details" : ""}. Last updated{" "}
        {formatDate(BUSINESS.lastUpdated)}.
      </p>
    </div>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="mt-6 max-w-3xl space-y-6 text-[14px] leading-relaxed [&_h2]:text-[16px] [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-ink-muted [&_ul]:space-y-1 [&_ul]:text-ink-muted">{children}</div>;
}

const B = ({ v }: { v: string }) => (isPlaceholder(v) ? <mark className="rounded bg-warning-soft px-1 text-ink">{v}</mark> : <>{v}</>);

// ---------------------------------------------------------------------------

export function PricingPage() {
  return (
    <PublicLayout title="Pricing">
      <p className="mt-2 max-w-2xl text-[15px] text-ink-muted">
        Organisations that run a farming cluster pay a monthly subscription. Completed transactions carry a small commission. {FARMER_PROMISE}
      </p>
      <InfoNote className="mt-3">{PRICING_STATUS} Prices exclude GST.</InfoNote>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className={clsx("flex flex-col p-5", p.highlight && "ring-2 ring-brand-500")}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold">{p.name}</h2>
              {p.highlight && <Badge tone="brand">Most clusters</Badge>}
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">{p.forWho}</p>
            <p className="mt-4">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{p.price === null ? "Free" : formatINR(p.price)}</span>
              <span className="ml-1 text-[13px] text-ink-muted">{p.unit}</span>
            </p>
            <ul className="mt-4 space-y-1.5 text-[13px]">
              {p.includes.map((i) => (
                <li key={i} className="flex gap-2">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5">
              <ButtonLink to="/contact" variant={p.highlight ? "primary" : "secondary"} className="w-full">
                {p.id === "pilot" ? "Apply for a pilot" : "Talk to us"}
              </ButtonLink>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-[17px] font-semibold">Commission on completed transactions</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Transaction</th>
              <th scope="col" className="py-2 pr-4 font-medium">Rate</th>
              <th scope="col" className="py-2 pr-4 font-medium">Paid by</th>
              <th scope="col" className="py-2 font-medium">Charged on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(Object.keys(commissionRates) as RevenueStream[]).map((k) => {
              const c = commissionRates[k];
              return (
                <tr key={k}>
                  <td className="py-2.5 pr-4 font-medium">{c.label}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{Math.round(c.rate * 1000) / 10}%</td>
                  <td className="py-2.5 pr-4">{c.paidBy}</td>
                  <td className="py-2.5 text-ink-muted">{c.on}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ink-muted">Commission applies only when a transaction is confirmed. Nothing is charged for listing, searching, requesting or asking.</p>
    </PublicLayout>
  );
}

export function TermsPage() {
  return (
    <PublicLayout title="Terms of use">
      <DraftNotice />
      <Prose>
        <section>
          <h2>1. Who we are</h2>
          <p>
            AgriCluster is operated by <B v={BUSINESS.name} />, <B v={BUSINESS.address} /> (“we”). These terms apply to the AgriCluster website and app.
          </p>
        </section>
        <section>
          <h2>2. A prototype, with demonstration data</h2>
          <p>
            AgriCluster is currently a prototype. Farms, sensor readings, prices and many listings are demonstration or simulated data and are labelled on
            screen. Sign-in is simulated. Please don't enter real personal, financial or identity details.
          </p>
        </section>
        <section>
          <h2>3. Suggestions, not advice or guarantees</h2>
          <ul>
            <li>Crop, method, investment, market and support suggestions are indicative and based on simple rules and sample data.</li>
            <li>They are not financial, legal or agronomic advice, and income, yield or price figures are never guaranteed.</li>
            <li>AgriCluster does not decide eligibility for any government scheme or private offer. The scheme office or provider decides.</li>
            <li>You decide whether to act on any suggestion.</li>
          </ul>
        </section>
        <section>
          <h2>4. Transactions between users</h2>
          <p>
            Buyers, farmers, machinery owners, labour crews and experts deal with each other directly. We help them connect and may charge the commission
            shown on the Pricing page when a transaction is confirmed. We are not a party to their agreements and are not responsible for quality,
            delivery or payment between them.
          </p>
        </section>
        <section>
          <h2>5. Your responsibilities</h2>
          <ul>
            <li>Share only information you have the right to share, and keep it accurate.</li>
            <li>Don't misuse the service, interfere with it, or access other users' data.</li>
            <li>Anyone with a demo space's share link can open and change it; share it only with people you trust.</li>
          </ul>
        </section>
        <section>
          <h2>6. Fees</h2>
          <p>Subscriptions and commissions apply only once paid plans launch, at the prices on the Pricing page at that time. We will tell you before any charge.</p>
        </section>
        <section>
          <h2>7. Liability</h2>
          <p>
            The service is provided “as is”. To the extent the law allows, we are not liable for losses arising from decisions made using indicative
            information in the app.
          </p>
        </section>
        <section>
          <h2>8. Law and disputes</h2>
          <p>
            These terms are governed by the laws of India. Courts in <B v={BUSINESS.jurisdiction} /> have jurisdiction. Contact us first at{" "}
            <B v={BUSINESS.email} /> and we will try to resolve any issue.
          </p>
        </section>
      </Prose>
    </PublicLayout>
  );
}

export function PrivacyPage() {
  return (
    <PublicLayout title="Privacy policy">
      <DraftNotice />
      <Prose>
        <section>
          <h2>What we collect</h2>
          <ul>
            <li>The role you choose and the name you type at sign-in (sign-in is simulated; no phone number or password is used).</li>
            <li>What you enter in the app: farm assessment answers, your season plan, listings, requests, messages, questions and support requests.</li>
            <li>We don't collect payment details. We don't ask for Aadhaar numbers; please don't enter them.</li>
          </ul>
        </section>
        <section>
          <h2>Where it is stored</h2>
          <ul>
            <li>In your browser's local storage on your device, so the app works offline.</li>
            <li>
              On the hosted website, also in our cloud database ({databaseName}) under a random demo-space id. Database rules let a browser read and
              write only its own demo space. Anyone you give the share link to can open that space.
            </li>
            <li>The downloadable demo file and embedded previews keep data in your browser only.</li>
          </ul>
        </section>
        <section>
          <h2>Who sees what</h2>
          <p>
            Other users see only what the app shows for their role. For example, buyers see only the listing details a farmer chose to share, never the
            farmer's phone number, finances or documents. Experts see the question and chosen field; labour sees the job's crop and village.
          </p>
        </section>
        <section>
          <h2>Service providers</h2>
          <p>
            The website is hosted on Netlify and data is stored with {databaseName}. Fonts load from Google Fonts. These providers may keep standard technical
            logs (such as IP addresses). We don't sell your data or use advertising trackers.
          </p>
        </section>
        <section>
          <h2>How long we keep it</h2>
          <p>Demo spaces are for testing and may be deleted at any time. You can clear your browser copy with “Reset demo” or by clearing site data.</p>
        </section>
        <section>
          <h2>Your rights</h2>
          <p>
            Under India's Digital Personal Data Protection Act, 2023, you can ask to access, correct or erase your data, and raise a grievance. Contact our
            grievance officer, <B v={BUSINESS.grievanceOfficer} />, at <B v={BUSINESS.email} />. Include your demo space's share link so we can find it.
          </p>
        </section>
        <section>
          <h2>Children</h2>
          <p>AgriCluster is not intended for people under 18.</p>
        </section>
      </Prose>
    </PublicLayout>
  );
}

export function RefundsPage() {
  return (
    <PublicLayout title="Cancellation and refund policy">
      <DraftNotice />
      <Prose>
        <section>
          <h2>Today</h2>
          <p>AgriCluster does not collect any payment yet, so there is nothing to refund.</p>
        </section>
        <section>
          <h2>When subscriptions launch</h2>
          <ul>
            <li>You can cancel a monthly subscription at any time. It stays active until the end of the period already paid, and isn't renewed.</li>
            <li>We don't refund part-used months, except where the law requires it.</li>
            <li>If you are charged twice, or charged after cancelling, we refund the extra amount to the original payment method within 7 working days of confirming it.</li>
            <li>If a payment fails but money left your account, it is usually reversed by your bank or payment provider within 5–7 working days. Contact us if it isn't.</li>
          </ul>
        </section>
        <section>
          <h2>Commissions</h2>
          <p>
            Commission is charged only on confirmed transactions. If a booking or deal is cancelled before it takes place, no commission is due, and any
            commission already paid for it is refunded.
          </p>
        </section>
        <section>
          <h2>How to ask</h2>
          <p>
            Email <B v={BUSINESS.email} /> with your organisation name and payment reference. We reply within 2 working days.
          </p>
        </section>
      </Prose>
    </PublicLayout>
  );
}

export function ContactPage() {
  const rows: [string, string][] = [
    ["Business", BUSINESS.name],
    ["Address", BUSINESS.address],
    ["Email", BUSINESS.email],
    ["Phone", BUSINESS.phone],
    ["Grievance officer", BUSINESS.grievanceOfficer],
  ];
  return (
    <PublicLayout title="Contact us">
      <p className="mt-2 max-w-2xl text-[15px] text-ink-muted">For pilots, pricing, support or privacy requests.</p>
      {rows.some(([, v]) => isPlaceholder(v)) && (
        <InfoNote className="mt-3">Contact details will be added before launch. The highlighted fields are placeholders.</InfoNote>
      )}
      <Card className="mt-6 max-w-xl">
        <dl className="divide-y divide-line px-5 py-1 text-[14px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="font-medium sm:text-right">
                <B v={v} />
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <p className="mt-4 text-[13px] text-ink-muted">
        Farmers using the app can also ask their cluster office for help through <span className="font-medium">Support → Ask for help applying</span>.
      </p>
    </PublicLayout>
  );
}
