"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CSVUpload } from "@/components/shared/csv-upload";
import { DataPreview } from "@/components/shared/data-preview";
import type { ParsedCSV } from "@/lib/types";

interface PipelineFormProps {
  onSubmit: (data: { prompt: string; csvContent: string; parsedData: ParsedCSV }) => void;
  isSubmitting?: boolean;
}

export function PipelineForm({ onSubmit, isSubmitting }: PipelineFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [rawContent, setRawContent] = useState<string>("");
  const [prompt, setPrompt] = useState("");

  const handleDataParsed = (data: ParsedCSV, content: string) => {
    setParsedData(data);
    setRawContent(content);
  };

  const handleSubmit = () => {
    if (!parsedData || !prompt.trim()) return;
    onSubmit({
      prompt: prompt.trim(),
      csvContent: rawContent,
      parsedData,
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
          step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          1
        </div>
        <div className={`h-0.5 w-16 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
          step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          2
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Data</CardTitle>
            <CardDescription>
              Upload a CSV file or paste your data directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CSVUpload onDataParsed={handleDataParsed} />
            
            {parsedData && (
              <>
                <DataPreview data={parsedData} maxRows={5} />
                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Describe Your Goal</CardTitle>
            <CardDescription>
              Tell us what you want to do with your data in plain English
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {parsedData && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-2 text-sm font-medium">Your data:</p>
                <p className="text-sm text-muted-foreground">
                  {parsedData.headers.length} columns ({parsedData.headers.slice(0, 5).join(", ")}
                  {parsedData.headers.length > 5 && "..."}) &middot; {parsedData.rows.length} rows
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                placeholder="Example: Clean and dedupe customers; keep columns: email, name, company; drop rows with missing emails"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what columns to keep, how to handle duplicates, and any filtering criteria.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!prompt.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run Pipeline
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
