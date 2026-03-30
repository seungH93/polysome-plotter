import { useState } from "react";
import { FlaskConical } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import PolysomeChart from "@/components/PolysomeChart";

const Index = () => {
  const [data, setData] = useState<{ fraction: number; absorbance: number }[] | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FlaskConical className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Polysome Profiling Viewer
            </h1>
            <p className="text-xs text-muted-foreground">
              Upload &amp; visualize polysome fractionation data
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <FileUpload onDataParsed={setData} />
        {data && <PolysomeChart data={data} />}
      </main>
    </div>
  );
};

export default Index;
