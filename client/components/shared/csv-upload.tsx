"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParsedCSV } from "@/lib/types";

interface CSVUploadProps {
  onDataParsed: (data: ParsedCSV, rawContent: string) => void;
  className?: string;
}

export function CSVUpload({ onDataParsed, className }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastedContent, setPastedContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parseCSV = useCallback((content: string): ParsedCSV | null => {
    try {
      const lines = content.trim().split("\n");
      if (lines.length < 2) {
        setError("CSV must have at least a header row and one data row");
        return null;
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map((line) => 
        line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
      );

      setError(null);
      return { headers, rows };
    } catch {
      setError("Failed to parse CSV content");
      return null;
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      if (parsed) {
        setFileName(file.name);
        onDataParsed(parsed, content);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  }, [parseCSV, onDataParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handlePasteSubmit = useCallback(() => {
    if (!pastedContent.trim()) {
      setError("Please paste some CSV content");
      return;
    }
    const parsed = parseCSV(pastedContent);
    if (parsed) {
      setFileName("pasted-data.csv");
      onDataParsed(parsed, pastedContent);
    }
  }, [pastedContent, parseCSV, onDataParsed]);

  const handleClear = useCallback(() => {
    setFileName(null);
    setPastedContent("");
    setError(null);
  }, []);

  if (fileName) {
    return (
      <div className={cn("rounded-xl border border-primary/20 bg-primary/5 p-4 glow-border", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{fileName}</p>
              <p className="text-sm text-muted-foreground">File loaded successfully</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClear} className="hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2 bg-white/5">
          <TabsTrigger value="upload">Upload a File</TabsTrigger>
          <TabsTrigger value="paste">Copy & Paste</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative rounded-xl border-2 border-dashed p-10 transition-all duration-300",
              isDragging
                ? "border-primary bg-primary/10 glow"
                : "border-white/10 hover:border-primary/50 hover:bg-white/[0.02]"
            )}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
              <div className="flex flex-col items-center gap-3 text-center">
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300",
                  isDragging ? "bg-primary/20 glow-sm" : "bg-white/5"
                )}>
                  <Upload className={cn(
                    "h-7 w-7 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="font-medium">Drop your file here</p>
                  <p className="text-sm text-muted-foreground">or click to pick one (CSV or Excel export)</p>
                </div>
              </div>
          </div>
        </TabsContent>
        
        <TabsContent value="paste" className="mt-4 space-y-4">
          <Textarea
            placeholder="Paste your data here...&#10;&#10;Example:&#10;email,name,company&#10;john@acme.com,John Smith,Acme Corp"
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <Button onClick={handlePasteSubmit} className="w-full">
            Use This Data
          </Button>
        </TabsContent>
      </Tabs>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
