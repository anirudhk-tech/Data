"use client";

import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ValidationError } from "@/lib/types";

interface ValidationFeedProps {
  errors: ValidationError[];
}

export function ValidationFeed({ errors }: ValidationFeedProps) {
  if (errors.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Validation Feedback</h3>
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            No validation errors yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Validation Feedback</h3>
      <ScrollArea className="h-[200px] rounded-lg border">
        <div className="space-y-3 p-4">
          {errors.map((error, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 ${
                error.fixed
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                {error.fixed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm font-medium">
                  Iteration {error.iteration}
                  {error.fixed && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      (Fixed)
                    </span>
                  )}
                </span>
              </div>
              <ul className="space-y-1 pl-6">
                {error.errors.map((err, j) => (
                  <li
                    key={j}
                    className={`text-sm ${
                      error.fixed
                        ? "text-muted-foreground line-through"
                        : "text-destructive"
                    }`}
                  >
                    <AlertCircle className="mr-1 inline h-3 w-3" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
