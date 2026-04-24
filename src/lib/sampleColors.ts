// HSL color palette for overlaying up to 5 polysome samples.
// Index 0 is reserved for "Control" (black) — matches reference image convention.
export const SAMPLE_COLORS = [
  "hsl(0, 0%, 15%)",      // Control - near black
  "hsl(0, 75%, 50%)",     // red
  "hsl(220, 75%, 50%)",   // blue
  "hsl(140, 60%, 38%)",   // green
  "hsl(280, 60%, 50%)",   // purple
] as const;

export const MAX_SAMPLES = 5;
