import { PlayCircle } from "lucide-react";
import type { FarmingMethod } from "../../types";
import { methods } from "../../data/mock/planning";

/** "How it works" for a farming method, with a reserved slot for an explainer video. */
export function MethodExplainer({ method }: { method: FarmingMethod }) {
  const m = methods.find((x) => x.id === method)!;
  return (
    <section aria-labelledby="method-how" className="rounded-xl border border-line bg-canvas p-4">
      <h3 id="method-how" className="text-[13px] font-semibold">
        How {m.title.toLowerCase()} works
      </h3>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-ink-muted">
        {m.howItWorks.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <div className="mt-4 grid aspect-video w-full max-w-md place-items-center rounded-lg border border-dashed border-line-strong bg-surface text-center text-ink-subtle">
        <div>
          <PlayCircle aria-hidden className="mx-auto size-8" />
          <p className="mt-1 text-[12px]">Explainer video placeholder — add a local-language video here.</p>
        </div>
      </div>
    </section>
  );
}
