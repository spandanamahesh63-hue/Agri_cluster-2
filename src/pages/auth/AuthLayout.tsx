import type { ReactNode } from "react";
import { Fragment, useEffect } from "react";
import { ChevronRight, Sprout } from "lucide-react";
import { roleList } from "../../components/navigation/navConfig";
import { formatINR } from "../../utils/format";
import { Logo } from "../../components/layout/Logo";
import { cluster } from "../../data/mock/cluster";
import { JOURNEY, PRINCIPLE, TAGLINE } from "../../data/brand";
import { FeedbackButton, PublicFooterLinks } from "../public/PublicPages";
import farmHero800 from "../../assets/farm-hero-800.webp";
import farmHero1600 from "../../assets/farm-hero-1600.webp";

/** Two-pane auth layout: product story on the left, the form on the right. */
export function AuthLayout({ children, title }: { children: ReactNode; title: string }) {
  useEffect(() => {
    document.title = `${title} · AgriCluster`;
  }, [title]);

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] lg:grid-cols-[1fr_minmax(28rem,36rem)]">
      <section className="relative isolate hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <FarmPhoto className="absolute inset-0 -z-20 size-full object-cover object-[60%_center]" sizes="(min-width: 1024px) 60vw, 100vw" />
        {/* Deep green wash so the white text stays readable over the photo */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-900/95 via-brand-900/80 to-brand-800/45" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-brand-900/90 to-transparent" />
        <Logo inverted />

        <div className="max-w-lg">
          <p className="text-sm font-medium text-brand-200">{TAGLINE}</p>
          <p className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            From farm information to a buyer, with the right support at every step.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-brand-100/80">
            AgriCluster helps a farmer decide what to grow, how to grow it and how much to invest. It connects them to the
            machinery, labour, experts and buyers they need, shared across a cluster of nearby farms.
          </p>

          <ol className="mt-8 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[13px]" aria-label="The farmer's journey in AgriCluster">
            {JOURNEY.map((step, i) => (
              <Fragment key={step}>
                <li className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1">{step}</li>
                {i < JOURNEY.length - 1 && <ChevronRight aria-hidden className="size-3.5 text-brand-200/60" />}
              </Fragment>
            ))}
          </ol>

          <SeasonSnapshot />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 text-[13px] text-brand-100/80">
          <div>
            <p className="font-medium text-white">{PRINCIPLE}</p>
            <p className="mt-1">Demo cluster: {cluster.name}</p>
          </div>
          <Stats />
        </div>

        <ClusterPattern />
      </section>

      <main id="main" className="flex flex-col bg-gradient-to-b from-brand-50/80 via-surface to-surface px-5 py-8 sm:px-10 lg:justify-center lg:px-14">
        <div className="mb-8 lg:hidden">
          <Logo />
          <div className="relative isolate mt-4 overflow-hidden rounded-2xl bg-brand-900 text-white shadow-card">
            <FarmPhoto small className="absolute inset-0 -z-20 size-full object-cover" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-900/95 via-brand-900/75 to-brand-800/40" />
            <div className="px-5 py-6 sm:px-6 sm:py-8">
              <p className="text-[12px] font-medium text-brand-200">{TAGLINE}</p>
              <p className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">From farm information to a buyer, with the right support at every step.</p>
              <Stats className="mt-4" />
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
        <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-center gap-3">
          <FeedbackButton />
          <PublicFooterLinks />
        </div>
      </main>
    </div>
  );
}

/** Headline numbers as small frosted tiles over the photo. */
function Stats({ className }: { className?: string }) {
  const items: [string, string][] = [
    [String(cluster.farmerCount), "farmers"],
    [String(cluster.cultivatedAcres), "acres"],
    [String(roleList.length), "roles"],
  ];
  return (
    <dl className={`flex gap-2 ${className ?? ""}`}>
      {items.map(([n, label]) => (
        <div key={label} className="min-w-[4.5rem] rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
          <dt className="sr-only">{label}</dt>
          <dd className="text-lg font-semibold leading-none tabular-nums text-white">{n}</dd>
          <dd aria-hidden className="mt-1 text-[11px] text-brand-100/80">
            {label}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** What the app produces, at a glance: the demo farmer's season (sample data). */
function SeasonSnapshot() {
  const rows: [string, string][] = [
    ["Crop", "Tomato · best match"],
    ["Method", "Precision farming"],
    ["Budget", formatINR(150000)],
    ["First harvest", "around 4 Oct"],
  ];
  return (
    <div className="mt-8 hidden max-w-md rounded-2xl border border-white/15 bg-white/10 p-4 shadow-pop backdrop-blur-md xl:block">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] font-medium text-white">
          <Sprout aria-hidden className="size-4 text-brand-200" />
          Spandana's season plan
        </div>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-brand-100">Sample</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] text-brand-100/70">{k}</dt>
            <dd className="font-medium text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-brand-100/80">
        <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
          <span className="block h-full w-full rounded-full bg-brand-200" />
        </span>
        8 of 8 steps · 2,000 kg listed · buyer request received
      </div>
    </div>
  );
}

/**
 * Decorative farm landscape: young rice in rows at the edge of a tree line.
 * Photo by Sadek Husein on Unsplash (Unsplash License). Two WebP sizes; the
 * browser picks the smaller one on phones.
 */
function FarmPhoto({ className, sizes, small }: { className: string; sizes?: string; small?: boolean }) {
  // loading="lazy": a photo in a panel hidden at this screen size is never downloaded.
  return small ? (
    <img src={farmHero800} alt="" aria-hidden loading="lazy" decoding="async" className={className} />
  ) : (
    <img
      src={farmHero1600}
      srcSet={`${farmHero800} 800w, ${farmHero1600} 1600w`}
      sizes={sizes}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}

/** Quiet background motif: farm plots joined into a network. */
function ClusterPattern() {
  const nodes: [number, number][] = [
    [420, 90], [520, 160], [470, 260], [600, 60], [640, 230], [560, 330], [700, 150],
  ];
  const links: [number, number][] = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 6], [4, 6], [4, 5], [1, 6]];
  return (
    <svg aria-hidden viewBox="0 0 720 400" className="pointer-events-none absolute -right-24 top-24 w-[46rem] opacity-[0.14]">
      {links.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="white" strokeWidth="1.5" />
      ))}
      {nodes.map(([x, y], i) => (
        <rect key={i} x={x - 18} y={y - 14} width="36" height="28" rx="4" fill="none" stroke="white" strokeWidth="1.5" />
      ))}
    </svg>
  );
}
