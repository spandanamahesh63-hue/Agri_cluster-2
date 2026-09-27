import type { ReactNode } from "react";
import { Fragment, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Logo } from "../../components/layout/Logo";
import { cluster } from "../../data/mock/cluster";

const flow = ["Connect", "Collect", "Analyze", "Recommend", "Coordinate"];

/** Two-pane auth layout: product story on the left, the form on the right. */
export function AuthLayout({ children, title }: { children: ReactNode; title: string }) {
  useEffect(() => {
    document.title = `${title} · AgriCluster`;
  }, [title]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(28rem,36rem)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <Logo inverted />

        <div className="max-w-lg">
          <p className="text-sm font-medium text-brand-200">Small Farms. Shared Resources. Smarter Decisions.</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            Fragmented farms, connected into one intelligent cluster.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-brand-100/80">
            AgriCluster combines farm, weather, sensor, resource and market data to suggest practical actions — and
            coordinates shared machinery, labour, expertise and buyers across nearby farms.
          </p>

          <ol className="mt-8 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[13px]" aria-label="How AgriCluster works">
            {flow.map((step, i) => (
              <Fragment key={step}>
                <li className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1">{step}</li>
                {i < flow.length - 1 && <ChevronRight aria-hidden className="size-3.5 text-brand-200/60" />}
              </Fragment>
            ))}
          </ol>
        </div>

        <div className="flex items-end justify-between gap-6 text-[13px] text-brand-100/70">
          <p className="max-w-xs">
            <span className="font-medium text-white">The platform recommends. The farmer decides.</span>
          </p>
          <p className="text-right">
            Demo cluster: {cluster.name}
            <br />
            {cluster.farmerCount} farmers · {cluster.cultivatedAcres} acres
          </p>
        </div>

        <ClusterPattern />
      </section>

      <section className="flex flex-col bg-surface px-5 py-8 sm:px-10 lg:justify-center lg:px-14">
        <div className="mb-8 lg:hidden">
          <Logo />
          <p className="mt-3 text-sm text-ink-muted">Small Farms. Shared Resources. Smarter Decisions.</p>
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </section>
    </div>
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
