import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onDataParsed: (data: { fraction: number; absorbance: number }[]) => void;
}

const FileUpload = ({ onDataParsed }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const data = raw
        .filter((row) => typeof row[0] === "number" && typeof row[1] === "number")
        .map((row) => ({ fraction: row[0], absorbance: row[1] }));

      onDataParsed(data);
    },
    [onDataParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all cursor-pointer ${
        isDragging
          ? "border-primary bg-drop-zone-active scale-[1.01]"
          : "border-drop-zone-border bg-drop-zone hover:border-primary/60"
      }`}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleFileInput}
      />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-4">
        <Upload className="h-7 w-7 text-primary" />
      </div>
      <p className="text-lg font-semibold text-foreground">
        {fileName ? fileName : "Drop your data file here"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {fileName ? "Drop another file to replace" : "Supports .xlsx and .csv files"}
      </p>
    </div>
  );
};

export default FileUpload;
