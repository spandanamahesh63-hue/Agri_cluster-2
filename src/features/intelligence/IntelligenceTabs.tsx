import { LinkTabs } from "../../components/navigation/Tabs";

export function IntelligenceTabs() {
  return (
    <LinkTabs
      label="Intelligence sections"
      tabs={[
        { to: "/farmer/intelligence", label: "Suggestions", end: true },
        { to: "/farmer/intelligence/water", label: "Water" },
        { to: "/farmer/intelligence/energy", label: "Energy" },
      ]}
    />
  );
}
