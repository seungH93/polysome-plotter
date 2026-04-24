import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { DataPoint } from "@/types/sample";

interface FileUploadProps {
  onSamplesAdded: (samples: { name: string; data: DataPoint[] }[]) => void;
  disabled?: boolean;
  remainingSlots: number;
}

const FileUpload = ({ onSamplesAdded, disabled, remainingSlots }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).slice(0, remainingSlots);
      const XLSX = await import("xlsx");
      const parsed: { name: string; data: DataPoint[] }[] = [];

      for (const file of list) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const data = raw
          .filter((row) => typeof row[0] === "number" && typeof row[1] === "number")
          .map((row) => ({ fraction: row[0] as number, absorbance: row[1] as number }));

        const name = file.name.replace(/\.(xlsx|csv)$/i, "");
        parsed.push({ name, data });
      }

      if (parsed.length) onSamplesAdded(parsed);
    },
    [onSamplesAdded, remainingSlots]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      processFiles(e.dataTransfer.files);
    },
    [processFiles, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
      e.target.value = "";
    },
    [processFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all ${
        disabled
          ? "border-border bg-muted opacity-60 cursor-not-allowed"
          : isDragging
          ? "border-primary bg-drop-zone-active scale-[1.01] cursor-pointer"
          : "border-drop-zone-border bg-drop-zone hover:border-primary/60 cursor-pointer"
      }`}
      onClick={() => !disabled && document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.csv"
        multiple
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent mb-3">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <p className="text-base font-semibold text-foreground">
        {disabled ? "Maximum samples reached" : "Drop sample file(s) to add"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {disabled
          ? "Remove a sample to upload more"
          : `Supports .xlsx / .csv · ${remainingSlots} slot${remainingSlots === 1 ? "" : "s"} remaining`}
      </p>
    </div>
  );
};

export default FileUpload;
