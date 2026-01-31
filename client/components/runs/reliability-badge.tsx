"use client";

import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReliabilityBadgeProps {
  passed: boolean | null;
  score?: number | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ReliabilityBadge({ 
  passed, 
  score, 
  size = "md",
  showLabel = true 
}: ReliabilityBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (passed === null) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className={cn(sizeClasses[size], "text-muted-foreground")} />
        {showLabel && (
          <span className={cn(textClasses[size], "text-muted-foreground")}>
            Not evaluated
          </span>
        )}
      </div>
    );
  }

  if (passed) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className={cn(sizeClasses[size], "text-green-500")} />
        {showLabel && (
          <span className={cn(textClasses[size], "font-medium text-green-700 dark:text-green-400")}>
            Passed {score !== null && score !== undefined && `(${(score * 100).toFixed(0)}%)`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <XCircle className={cn(sizeClasses[size], "text-destructive")} />
      {showLabel && (
        <span className={cn(textClasses[size], "font-medium text-destructive")}>
          Failed {score !== null && score !== undefined && `(${(score * 100).toFixed(0)}%)`}
        </span>
      )}
    </div>
  );
}
