"use client";

import { formatDate } from "@/lib/date-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import type { PipelineVersion } from "@/lib/types";

interface VersionListProps {
  versions: PipelineVersion[];
  selectedVersionId: string;
  onVersionSelect: (versionId: string) => void;
}

export function VersionList({ versions, selectedVersionId, onVersionSelect }: VersionListProps) {
  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[140px] justify-between">
          Version {selectedVersion?.version || 1}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {versions.map((version) => (
          <DropdownMenuItem
            key={version.id}
            onClick={() => onVersionSelect(version.id)}
            className="flex items-center justify-between"
          >
            <div>
              <span className="font-medium">Version {version.version}</span>
              <p className="text-xs text-muted-foreground">
                {formatDate(version.created_at)}
              </p>
            </div>
            {version.id === selectedVersionId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
