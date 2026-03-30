import { useRef, useCallback, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface PolysomeChartProps {
  data: { fraction: number; absorbance: number }[];
}

function downsampleLTTB(
  data: { fraction: number; absorbance: number }[],
  threshold: number
) {
  if (data.length <= threshold) return data;

  const sampled: { fraction: number; absorbance: number }[] = [];
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
      if (area > maxArea) {
        maxArea = area;
        maxIdx = j;
      }
    }
    sampled.push(data[maxIdx]);
    a = maxIdx;
  }
  sampled.push(data[data.length - 1]);
  return sampled;
}

const PolysomeChart = ({ data }: PolysomeChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [yMax, setYMax] = useState<number | "auto">("auto");

  const displayData = useMemo(
    () => downsampleLTTB(data, 1200),
    [data]
  );

  const computedYMax = useMemo(() => {
    const sorted = [...data.map((d) => d.absorbance)].sort((a, b) => a - b);
    // Use 95th percentile to ignore outlier spikes
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    return Math.ceil(p95 * 1.3 * 100) / 100;
  }, [data]);

  const activeYMax = yMax === "auto" ? computedYMax : yMax;

  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;
    const png = await toPng(chartRef.current, {
      backgroundColor: "#ffffff",
      pixelRatio: 3,
    });
    const link = document.createElement("a");
    link.download = "polysome-profile.png";
    link.href = png;
    link.click();
  }, []);

  const actualMax = useMemo(
    () => Math.max(...data.map((d) => d.absorbance)),
    [data]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Absorbance Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.length.toLocaleString()} data points · Y-max:{" "}
            {activeYMax.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYMax((prev) => {
              const current = prev === "auto" ? computedYMax : prev;
              return Math.max(0.1, current / 1.5);
            })}
            title="Zoom in Y-axis"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYMax((prev) => {
              const current = prev === "auto" ? computedYMax : prev;
              return current * 1.5;
            })}
            title="Zoom out Y-axis"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYMax(actualMax * 1.05)}
            title="Show full range"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setYMax("auto")}>
            Auto
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export PNG
          </Button>
        </div>
      </div>

      <div
        ref={chartRef}
        className="rounded-xl border border-border bg-card p-6"
      >
        <ResponsiveContainer width="100%" height={450}>
          <AreaChart
            data={displayData}
            margin={{ top: 10, right: 20, bottom: 30, left: 15 }}
          >
            <defs>
              <linearGradient id="absGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(192, 70%, 35%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(192, 70%, 35%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
            <XAxis
              dataKey="fraction"
              label={{
                value: "Fraction Number",
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
              formatter={(value: number) => [value.toFixed(4), "Absorbance"]}
              labelFormatter={(label) => `Fraction: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="absorbance"
              stroke="hsl(192, 70%, 35%)"
              strokeWidth={1.5}
              fill="url(#absGradient)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: "hsl(192, 70%, 35%)" }}
              isAnimationActive={false}
            />
            <Brush
              dataKey="fraction"
              height={30}
              stroke="hsl(192, 70%, 35%)"
              fill="hsl(210, 20%, 98%)"
              travellerWidth={10}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PolysomeChart;
