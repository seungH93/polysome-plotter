import { useRef, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PolysomeChartProps {
  data: { fraction: number; absorbance: number }[];
}

const PolysomeChart = ({ data }: PolysomeChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

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

  // Downsample for performance if > 1000 points
  const displayData =
    data.length > 1000
      ? data.filter((_, i) => i % Math.ceil(data.length / 800) === 0)
      : data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Absorbance Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.length.toLocaleString()} data points
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export PNG
        </Button>
      </div>

      <div
        ref={chartRef}
        className="rounded-xl border border-border bg-card p-6"
      >
        <ResponsiveContainer width="100%" height={420}>
          <AreaChart data={displayData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <defs>
              <linearGradient id="absGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(192, 70%, 35%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(192, 70%, 35%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
            <XAxis
              dataKey="fraction"
              label={{ value: "Fraction Number", position: "insideBottom", offset: -10, style: { fill: "hsl(210, 10%, 50%)", fontSize: 13 } }}
              tick={{ fontSize: 11, fill: "hsl(210, 10%, 50%)" }}
              tickLine={false}
            />
            <YAxis
              label={{ value: "Absorbance (OD254)", angle: -90, position: "insideLeft", offset: 5, style: { fill: "hsl(210, 10%, 50%)", fontSize: 13 } }}
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
              strokeWidth={2}
              fill="url(#absGradient)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: "hsl(192, 70%, 35%)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PolysomeChart;
