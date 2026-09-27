// Chart palette — categorical slots in fixed order (validated for CVD separation
// on the white card surface; slot 3 is below 3:1 contrast, so charts using it
// always ship direct labels and a table view). Chart chrome uses recessive greys.
export const series = ["#2a78d6", "#eb6834", "#1baf7a"] as const;

export const chrome = {
  grid: "#e9eae6",
  axis: "#cfd3cb",
  tick: "#687169", // ≥ 4.5:1 on the card surface
  surface: "#ffffff",
};

export const tickStyle = { fontSize: 11, fill: chrome.tick };
