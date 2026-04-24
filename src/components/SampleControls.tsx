import { Sample } from "@/types/sample";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, X, RotateCcw } from "lucide-react";

interface Props {
  samples: Sample[];
  onUpdate: (id: string, patch: Partial<Sample>) => void;
  onRemove: (id: string) => void;
  xRange: number;
}

const SampleControls = ({ samples, onUpdate, onRemove, xRange }: Props) => {
  if (samples.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-base font-semibold text-foreground">Samples & Alignment</h2>
      <div className="space-y-3">
        {samples.map((s, idx) => (
          <div
            key={s.id}
            className="rounded-lg border border-border bg-background p-3 space-y-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-sm shrink-0 border border-border"
                style={{ backgroundColor: s.color }}
              />
              <Input
                value={s.name}
                onChange={(e) => onUpdate(s.id, { name: e.target.value })}
                className="h-8 text-sm flex-1"
              />
              <span className="text-xs text-muted-foreground shrink-0">
                {idx === 0 ? "Control" : "Case"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate(s.id, { visible: !s.visible })}
                title={s.visible ? "Hide" : "Show"}
              >
                {s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate(s.id, { xShift: 0, yShift: 0 })}
                title="Reset alignment"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(s.id)}
                title="Remove"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>X shift</span>
                  <span className="font-mono">{s.xShift.toFixed(2)}</span>
                </div>
                <Slider
                  value={[s.xShift]}
                  min={-xRange / 2}
                  max={xRange / 2}
                  step={xRange / 500 || 0.01}
                  onValueChange={([v]) => onUpdate(s.id, { xShift: v })}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Y shift</span>
                  <span className="font-mono">{s.yShift.toFixed(3)}</span>
                </div>
                <Slider
                  value={[s.yShift]}
                  min={-0.5}
                  max={0.5}
                  step={0.005}
                  onValueChange={([v]) => onUpdate(s.id, { yShift: v })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SampleControls;
