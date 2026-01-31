"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PipelineSpec } from "@/lib/types";

interface LiveSpecViewerProps {
  spec: PipelineSpec | null;
  previousSpec?: PipelineSpec | null;
}

export function LiveSpecViewer({ spec, previousSpec }: LiveSpecViewerProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spec) {
      setDisplayedLines([]);
      return;
    }

    const fullJson = JSON.stringify(spec, null, 2);
    const lines = fullJson.split("\n");
    
    // Animate lines appearing one by one
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setDisplayedLines((prev) => [...prev.slice(0, currentLine), lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [spec]);

  // Get changed lines for highlighting
  const getChangedLines = (): Set<number> => {
    if (!spec || !previousSpec) return new Set();
    
    const currentJson = JSON.stringify(spec, null, 2).split("\n");
    const prevJson = JSON.stringify(previousSpec, null, 2).split("\n");
    
    const changed = new Set<number>();
    currentJson.forEach((line, i) => {
      if (line !== prevJson[i]) {
        changed.add(i);
      }
    });
    return changed;
  };

  const changedLines = getChangedLines();

  if (!spec) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30 p-8">
        <p className="text-sm text-muted-foreground">
          Waiting for spec generation...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Pipeline Spec</h3>
      <ScrollArea className="h-[400px] rounded-lg border bg-zinc-950 dark:bg-zinc-900" ref={scrollRef}>
        <pre className="p-4 text-sm">
          <code>
            {displayedLines.map((line, i) => (
              <div
                key={i}
                className={`${
                  changedLines.has(i)
                    ? "bg-green-500/20 text-green-400"
                    : "text-zinc-300"
                }`}
              >
                <span className="mr-4 inline-block w-6 select-none text-right text-zinc-600">
                  {i + 1}
                </span>
                {highlightJson(line)}
              </div>
            ))}
            {displayedLines.length < (spec ? JSON.stringify(spec, null, 2).split("\n").length : 0) && (
              <span className="animate-pulse text-primary">▊</span>
            )}
          </code>
        </pre>
      </ScrollArea>
    </div>
  );
}

// Simple JSON syntax highlighting
function highlightJson(line: string): React.ReactNode {
  // Match keys, strings, numbers, booleans, null
  const parts = line.split(/("(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|\b\d+\.?\d*\b)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      // Check if it's a key (followed by :)
      if (line.includes(`${part}:`)) {
        return (
          <span key={i} className="text-purple-400">
            {part}
          </span>
        );
      }
      // It's a string value
      return (
        <span key={i} className="text-green-400">
          {part}
        </span>
      );
    }
    if (part === "true" || part === "false") {
      return (
        <span key={i} className="text-yellow-400">
          {part}
        </span>
      );
    }
    if (part === "null") {
      return (
        <span key={i} className="text-red-400">
          {part}
        </span>
      );
    }
    if (/^\d+\.?\d*$/.test(part)) {
      return (
        <span key={i} className="text-blue-400">
          {part}
        </span>
      );
    }
    return part;
  });
}
