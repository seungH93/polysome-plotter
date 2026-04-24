# Memory: index.md
Updated: just now

# Project Memory

## Core
Scientific data dashboard: Teal color palette, clean/professional UI.
Charts: Use LTTB downsampling for >6k points, 95th percentile Y-axis scaling.
Data: xlsx/csv uploads must map Col A to Fraction, Col B to Absorbance.
Multi-sample (max 5): Control = black (idx 0), Cases = red/blue/green/purple. Per-sample X/Y shift for manual alignment.

## Memories
- [UI Theme](mem://style/ui-theme) — Professional scientific data dashboard using Teal palette, gradients, and monotone curves.
- [Visualization Logic](mem://features/visualization-logic) — LTTB downsampling for large data (6k+ points) and 95th percentile adaptive Y-axis scaling.
- [Data Import/Export](mem://features/data-import-export) — xlsx/csv upload (Col A: Fraction, Col B: Absorbance), interactive X/Y zoom, high-res PNG export.
- [Multi-Sample Comparison](mem://features/multi-sample-comparison) — Overlay up to 5 samples, per-sample shift sliders, tube dividers, Fraction/Time toggle.
