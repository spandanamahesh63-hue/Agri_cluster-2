import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Presentation, RotateCw, X } from "lucide-react";
import type { Role } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Button } from "../../components/ui/Button";

// Guided demo following the competition demo flow (spec §37) and the
// demo scenario (spec §38): Spandana, 1 acre near Chamarajanagara, ₹1,50,000.
interface Step {
  title: string;
  say: string;
  role: Role | null;
  path: string;
}

export const demoSteps: Step[] = [
  { title: "Open AGRI CLUSTER", role: null, path: "/login", say: "Right Crop. Right Technology. Right Resource. Right Investment. Right Support. Seven roles share one farming cluster." },
  { title: "Choose Farmer", role: "farmer", path: "/farmer", say: "Meet Spandana: 1 acre near Chamarajanagara. Her dashboard shows what needs attention today and where her season plan stands." },
  { title: "Enter farm details", role: "farmer", path: "/farmer/plan/assessment", say: "Only questions that change a recommendation: land, soil, water, energy, money and experience. Spandana's answers are filled in; press Continue through the three parts and save." },
  { title: "Select a farming goal", role: "farmer", path: "/farmer/plan/vision", say: "Three ways to start: money to invest, an income goal, or no idea yet. Spandana has ₹1,50,000 to invest. Press “See crop options”." },
  { title: "Receive crop options", role: "farmer", path: "/farmer/plan/crop", say: "Crops ranked for her land and budget, with water, labour, investment, harvest and demand. Open “Why are we suggesting this crop?” on tomato." },
  { title: "Select a crop", role: "farmer", path: "/farmer/plan/crop", say: "Tomato is the best match. Every figure is an indicative range, never a guarantee. Press “Choose tomato”." },
  { title: "See suitable farming methods", role: "farmer", path: "/farmer/plan/method", say: "Only methods that suit tomato on her farm, best match first, with water, labour, technology and what to consider." },
  { title: "Watch “How it works”", role: "farmer", path: "/farmer/plan/method", say: "Open the precision farming walkthrough. It is an illustrated placeholder in the prototype, and says so." },
  { title: "Select a method", role: "farmer", path: "/farmer/plan/method", say: "Press “Use precision farming”." },
  { title: "Optimise investment", role: "farmer", path: "/farmer/plan/investment", say: "Move the slider: the split updates live and always adds up. Rent is the default, and buying shows the one-time cost. Save the plan." },
  { title: "See shared machinery and services", role: "farmer", path: "/farmer/resources?tab=machinery", say: "Machinery and technology from cluster providers: price, availability, service type, suitable crops. Tick two and press Compare." },
  { title: "View market analysis", role: "farmer", path: "/farmer/plan/market", say: "Sample seasonal prices with her harvest month marked, demand, buyer categories and live buyer requests. Clearly labelled as sample data." },
  { title: "Generate the cropping plan", role: "farmer", path: "/farmer/plan/schedule", say: "A calendar from planting on 28 June to first harvest around 4 October, with who can help at each step. Press “Confirm my plan”." },
  { title: "See experts, labour and resources", role: "farmer", path: "/farmer/plan/resources", say: "Matched to her crop and method: equipment to rent, crews, experts and support. Support is never shown as verified eligibility. Press “Finish planning”." },
  { title: "Complete the farming plan", role: "farmer", path: "/farmer/plan", say: "All eight steps are done: crop, method, budget, calendar and resources in one plan. Her dashboard now shows the season and the next task." },
  { title: "Create a harvest listing", role: "farmer", path: "/farmer/market/upload", say: "2,000 kg of Grade A tomato, precision farming. Spandana chooses what buyers can see: method, photos, village, name. Publish it." },
  { title: "Switch to Buyer", role: "buyer", path: "/buyer", say: "Kaveri Fresh Aggregators sees saved crops, requests and active purchases." },
  { title: "Search for the crop", role: "buyer", path: "/buyer/supply?q=tomato", say: "Search and filter by location, quantity, grade, harvest date and farming method." },
  { title: "View farmer-approved information", role: "buyer", path: "/buyer/supply?q=tomato", say: "Press “View crop” on Farm #27. Only what Spandana approved is shown: no phone number, finances or exact location." },
  { title: "Request farmer connection", role: "buyer", path: "/buyer/supply?q=tomato", say: "Press “Request farmer”, set a price, and send. Nothing is agreed until the farmer accepts." },
  { title: "The farmer is notified", role: "farmer", path: "/farmer/market", say: "The bell shows “Buyer requested your tomato crop”, and the request waits under her listing. Spandana decides: accept or decline." },
];

const STORAGE_KEY = "agricluster:demo-guide";

interface GuideState {
  open: boolean;
  step: number;
  setOpen: (open: boolean) => void;
  goTo: (step: number) => void;
}

const GuideContext = createContext<GuideState | null>(null);

function load(): { open: boolean; step: number } {
  try {
    return { open: false, step: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return { open: false, step: 0 };
  }
}

export function DemoGuideProvider({ children }: { children: ReactNode }) {
  const [{ open, step }, setState] = useState(load);
  const { session } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, step }));
    } catch {
      /* storage unavailable — guide still works for this visit */
    }
  }, [open, step]);

  // A step that needs a different role navigates first and asks the destination's
  // route guard to switch roles (see RequireRole), so the page being left never
  // sees the new role and redirects away.
  const goTo = useCallback(
    (next: number) => {
      const s = demoSteps[Math.max(0, Math.min(next, demoSteps.length - 1))];
      setState((prev) => ({ ...prev, step: demoSteps.indexOf(s) }));
      navigate(s.path, s.role && session?.role !== s.role ? { state: { demoSwitchTo: s.role } } : undefined);
    },
    [session, navigate],
  );

  const value = useMemo(() => ({ open, step, setOpen: (o: boolean) => setState((p) => ({ ...p, open: o })), goTo }), [open, step, goTo]);
  return (
    <GuideContext.Provider value={value}>
      {children}
      {open && <GuidePanel />}
    </GuideContext.Provider>
  );
}

function useGuide(): GuideState {
  const g = useContext(GuideContext);
  if (!g) throw new Error("useGuide must be used inside <DemoGuideProvider>");
  return g;
}

/** Opens the guide. `compact` shows an icon-only button for the mobile header. */
export function DemoGuideButton({ compact = false, label = "Demo guide" }: { compact?: boolean; label?: string }) {
  const { open, setOpen } = useGuide();
  return (
    <Button
      variant={compact ? "ghost" : "secondary"}
      size="sm"
      aria-pressed={open}
      aria-label={compact ? label : undefined}
      icon={<Presentation aria-hidden className="size-4" />}
      onClick={() => setOpen(!open)}
      className={compact ? "size-9 px-0" : undefined}
    >
      {!compact && label}
    </Button>
  );
}

function GuidePanel() {
  const { step, goTo, setOpen } = useGuide();
  const { resetDemo } = useAppStore();
  const location = useLocation();
  const s = demoSteps[step];
  const here = location.pathname + location.search === s.path || (s.path === "/farmer" && location.pathname === "/farmer");
  const next = demoSteps[step + 1];

  return (
    <aside
      aria-label="Guided demo"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 rounded-xl border border-line bg-surface shadow-pop sm:inset-x-auto sm:right-6 sm:w-96 lg:bottom-6"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="text-[12px] font-medium text-ink-muted">
          Guided demo · step {step + 1} of {demoSteps.length}
        </div>
        <button type="button" aria-label="Close demo guide" onClick={() => setOpen(false)} className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-sunken">
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="px-4 py-3">
        <h2 className="text-[15px] font-semibold">{s.title}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{s.say}</p>
        {!here && (
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => goTo(step)}>
            Go to this step
          </Button>
        )}
        <ol className="mt-3 flex gap-1" aria-label="Progress">
          {demoSteps.map((d, i) => (
            <li key={d.title} className="flex-1">
              <button
                type="button"
                aria-label={`Step ${i + 1}: ${d.title}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => goTo(i)}
                className={clsx("block h-1.5 w-full rounded-full", i < step ? "bg-brand-500" : i === step ? "bg-brand-800" : "bg-line")}
              />
            </li>
          ))}
        </ol>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        {step === 0 ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCw aria-hidden className="size-3.5" />}
            onClick={() => {
              resetDemo();
              goTo(0);
            }}
          >
            Reset demo data
          </Button>
        ) : (
          <Button size="sm" variant="ghost" icon={<ChevronLeft aria-hidden className="size-4" />} onClick={() => goTo(step - 1)}>
            Back
          </Button>
        )}
        {next ? (
          <Button size="sm" onClick={() => goTo(step + 1)}>
            {next.title}
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => setOpen(false)}>
            Finish
          </Button>
        )}
      </div>
    </aside>
  );
}
