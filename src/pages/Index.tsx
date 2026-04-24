import { useCallback, useState } from "react";
import { FlaskConical } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import PolysomeChart from "@/components/PolysomeChart";
import SampleControls from "@/components/SampleControls";
import { Sample, DataPoint } from "@/types/sample";
import { SAMPLE_COLORS, MAX_SAMPLES } from "@/lib/sampleColors";

const Index = () => {
  const [samples, setSamples] = useState<Sample[]>([]);

  const handleSamplesAdded = useCallback(
    (incoming: { name: string; data: DataPoint[] }[]) => {
      setSamples((prev) => {
        const next = [...prev];
        for (const item of incoming) {
          if (next.length >= MAX_SAMPLES) break;
          const idx = next.length;
          next.push({
            id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
            name: idx === 0 ? `${item.name} (Control)` : item.name,
            color: SAMPLE_COLORS[idx],
            data: item.data,
            xShift: 0,
            yShift: 0,
            visible: true,
          });
        }
        return next;
      });
    },
    []
  );

  const handleUpdate = useCallback((id: string, patch: Partial<Sample>) => {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setSamples((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // Reassign colors so palette stays consistent (Control = first, etc.)
      return filtered.map((s, i) => ({ ...s, color: SAMPLE_COLORS[i] }));
    });
  }, []);

  // Estimate X range for slider bounds (use first sample's span).
  const xRange =
    samples[0]?.data.length
      ? Math.max(
          1,
          samples[0].data[samples[0].data.length - 1].fraction -
            samples[0].data[0].fraction
        )
      : 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FlaskConical className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Polysome Profiling Viewer
            </h1>
            <p className="text-xs text-muted-foreground">
              Compare up to {MAX_SAMPLES} samples · align Case to Control
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <FileUpload
          onSamplesAdded={handleSamplesAdded}
          disabled={samples.length >= MAX_SAMPLES}
          remainingSlots={MAX_SAMPLES - samples.length}
        />
        <SampleControls
          samples={samples}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          xRange={xRange}
        />
        {samples.length > 0 && <PolysomeChart samples={samples} />}
      </main>
    </div>
  );
};

export default Index;
