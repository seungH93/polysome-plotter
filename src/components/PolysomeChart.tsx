import { useRef, useCallback, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
  ReferenceLine,
} from "recharts";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Sample, DataPoint } from "@/types/sample";

interface PolysomeChartProps {
  samples: Sample[];
}

function downsampleLTTB(data: DataPoint[], threshold: number): DataPoint[] {
  if (data.length <= threshold) return data;
  const sampled: DataPoint[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);
  sampled.push(data[0]);
  let a = 0;
  for (let i = 1; i < threshold - 1; i++) {
    const rangeStart = Math.floor((i - 1) * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor(i * bucketSize) + 1, data.length);
    const nextStart = Math.floor(i * bucketSize) + 1;
    const nextEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length);
    let avgX = 0, avgY = 0;
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += data[j].fraction;
      avgY += data[j].absorbance;
    }
    avgX /= (nextEnd - nextStart);
    avgY /= (nextEnd - nextStart);
    let maxArea = -1;
    let maxIdx = rangeStart;
    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (data[a].fraction - avgX) * (data[j].absorbance - data[a].absorbance) -
        (data[a].fraction - data[j].fraction) * (avgY - data[a].absorbance)
      );
      if (area > maxArea) { maxArea = area; maxIdx = j; }
    }
    sampled.push(data[maxIdx]);
    a = maxIdx;
  }
  sampled.push(data[data.length - 1]);
  return sampled;
}

const PolysomeChart = ({ samples }: PolysomeChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [yMax, setYMax] = useState<number | "auto">("auto");
  const [tubeCount, setTubeCount] = useState(26);
  const [showTubes, setShowTubes] = useState(true);
  const [xUnit, setXUnit] = useState<"fraction" | "time">("fraction");
  const [totalMinutes, setTotalMinutes] = useState(10);

  // Apply shifts and downsample each sample.
  const processedSamples = useMemo(() => {
    return samples.map((s) => {
      const shifted = s.data.map((d) => ({
        fraction: d.fraction + s.xShift,
        absorbance: d.absorbance + s.yShift,
      }));
      return {
        ...s,
        displayData: downsampleLTTB(shifted, 800),
      };
    });
  }, [samples]);

  // Determine global X range from all visible samples (post-shift).
  const { xMin, xMax } = useMemo(() => {
    const visible = processedSamples.filter((s) => s.visible);
    if (!visible.length) return { xMin: 0, xMax: 1 };
    let mn = Infinity, mx = -Infinity;
    for (const s of visible) {
      for (const d of s.displayData) {
        if (d.fraction < mn) mn = d.fraction;
        if (d.fraction > mx) mx = d.fraction;
      }
    }
    return { xMin: mn, xMax: mx };
  }, [processedSamples]);

  // Merge into a single data array keyed by fraction for Recharts (interpolated lookup per sample).
  // For overlay we use independent arrays via separate <Line data={...}/>.
  const computedYMax = useMemo(() => {
    const all: number[] = [];
    for (const s of processedSamples) {
      if (!s.visible) continue;
      for (const d of s.data) all.push(d.absorbance + s.yShift);
    }
    if (!all.length) return 1;
    all.sort((a, b) => a - b);
    const p95 = all[Math.floor(all.length * 0.95)];
    return Math.ceil(p95 * 1.3 * 100) / 100;
  }, [processedSamples]);

  const actualMax = useMemo(() => {
    let mx = 0;
    for (const s of processedSamples) {
      if (!s.visible) continue;
      for (const d of s.data) mx = Math.max(mx, d.absorbance + s.yShift);
    }
    return mx;
  }, [processedSamples]);

  const activeYMax = yMax === "auto" ? computedYMax : yMax;

  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;
    const png = await toPng(chartRef.current, { backgroundColor: "#ffffff", pixelRatio: 3 });
    const link = document.createElement("a");
    link.download = "polysome-comparison.png";
    link.href = png;
    link.click();
  }, []);

  // Tube divider positions (evenly spaced across the X range).
  const tubeLines = useMemo(() => {
    if (!showTubes || tubeCount < 2) return [];
    const step = (xMax - xMin) / tubeCount;
    return Array.from({ length: tubeCount + 1 }, (_, i) => xMin + i * step);
  }, [showTubes, tubeCount, xMin, xMax]);

  // X tick formatter: optionally convert to time (min).
  const fractionToTime = useCallback(
    (f: number) => {
      if (xUnit === "fraction" || xMax === xMin) return f;
      return ((f - xMin) / (xMax - xMin)) * totalMinutes;
    },
    [xUnit, xMin, xMax, totalMinutes]
  );

  const formatX = (v: number) =>
    xUnit === "time" ? `${fractionToTime(v).toFixed(1)} min` : v.toFixed(0);

  const totalPoints = samples.reduce((acc, s) => acc + s.data.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Absorbance Profile</h2>
          <p className="text-sm text-muted-foreground">
            {samples.length} sample{samples.length === 1 ? "" : "s"} ·{" "}
            {totalPoints.toLocaleString()} points · Y-max: {activeYMax.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border">
            <Label htmlFor="x-unit" className="text-xs text-muted-foreground">
              Fraction
            </Label>
            <Switch
              id="x-unit"
              checked={xUnit === "time"}
              onCheckedChange={(v) => setXUnit(v ? "time" : "fraction")}
            />
            <Label htmlFor="x-unit" className="text-xs text-muted-foreground">
              Time
            </Label>
          </div>
          {xUnit === "time" && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Total min</Label>
              <Input
                type="number"
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="h-8 w-16 text-sm"
              />
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border">
            <Switch
              id="tubes"
              checked={showTubes}
              onCheckedChange={setShowTubes}
            />
            <Label htmlFor="tubes" className="text-xs text-muted-foreground">Tubes</Label>
            <Input
              type="number"
              value={tubeCount}
              onChange={(e) => setTubeCount(Math.max(1, Number(e.target.value) || 1))}
              className="h-8 w-14 text-sm"
              disabled={!showTubes}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setYMax((p) => {
            const c = p === "auto" ? computedYMax : p; return Math.max(0.1, c / 1.5);
          })} title="Zoom in Y">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setYMax((p) => {
            const c = p === "auto" ? computedYMax : p; return c * 1.5;
          })} title="Zoom out Y">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setYMax(actualMax * 1.05)} title="Full Y range">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setYMax("auto")}>Auto</Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />Export PNG
          </Button>
        </div>
      </div>

      <div ref={chartRef} className="rounded-xl border border-border bg-card p-6">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart margin={{ top: 30, right: 20, bottom: 30, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
            <XAxis
              dataKey="fraction"
              type="number"
              domain={[xMin, xMax]}
              allowDataOverflow
              tickFormatter={formatX}
              label={{
                value: xUnit === "time" ? "Time (min)" : "Fraction Number",
                position: "insideBottom",
                offset: -15,
                style: { fill: "hsl(210, 10%, 50%)", fontSize: 13, fontWeight: 500 },
              }}
              tick={{ fontSize: 11, fill: "hsl(210, 10%, 50%)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, activeYMax]}
              allowDataOverflow
              label={{
                value: "Absorbance (OD254)",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                style: { fill: "hsl(210, 10%, 50%)", fontSize: 13, fontWeight: 500 },
              }}
              tick={{ fontSize: 11, fill: "hsl(210, 10%, 50%)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid hsl(210, 20%, 90%)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
              formatter={(value: number, name: string) => [Number(value).toFixed(4), name]}
              labelFormatter={(label) =>
                xUnit === "time"
                  ? `Time: ${fractionToTime(Number(label)).toFixed(2)} min`
                  : `Fraction: ${Number(label).toFixed(1)}`
              }
            />
            <Legend
              verticalAlign="top"
              height={28}
              iconType="line"
              wrapperStyle={{ fontSize: 12 }}
            />

            {tubeLines.map((x, i) => (
              <ReferenceLine
                key={`tube-${i}`}
                x={x}
                stroke="hsl(210, 20%, 80%)"
                strokeDasharray="2 4"
                label={
                  i < tubeLines.length - 1
                    ? {
                        value: `T${i + 1}`,
                        position: "top",
                        fill: "hsl(210, 10%, 55%)",
                        fontSize: 9,
                      }
                    : undefined
                }
              />
            ))}

            {processedSamples
              .filter((s) => s.visible)
              .map((s) => (
                <Line
                  key={s.id}
                  data={s.displayData}
                  dataKey="absorbance"
                  name={s.name}
                  type="monotone"
                  stroke={s.color}
                  strokeWidth={1.8}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: s.color }}
                  isAnimationActive={false}
                />
              ))}

            <Brush
              dataKey="fraction"
              height={28}
              stroke="hsl(192, 70%, 35%)"
              fill="hsl(210, 20%, 98%)"
              travellerWidth={10}
              data={processedSamples[0]?.displayData}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PolysomeChart;
