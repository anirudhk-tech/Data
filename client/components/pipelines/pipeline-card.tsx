"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/date-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, ChevronRight, MoreVertical, Pencil, Check, X } from "lucide-react";
import { updatePipeline } from "@/lib/api";
import type { Pipeline } from "@/lib/types";

interface PipelineCardProps {
  pipeline: Pipeline;
  onUpdate?: (updated: Pipeline) => void;
}

export function PipelineCard({ pipeline, onUpdate }: PipelineCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pipeline.name);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setEditName(pipeline.name);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName(pipeline.name);
  };

  const saveChanges = async () => {
    if (!editName.trim()) return;
    
    setIsSaving(true);
    try {
      await updatePipeline(pipeline.id, { name: editName.trim() });
      onUpdate?.({ ...pipeline, name: editName.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update pipeline:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveChanges();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:glow-border">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-7 text-sm font-semibold bg-white/5 border-white/10"
                  autoFocus
                />
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-7 w-7" 
                  onClick={saveChanges}
                  disabled={!editName.trim() || isSaving}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-7 w-7" 
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <CardTitle className="text-lg">
                <Link 
                  href={`/pipelines/${pipeline.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {pipeline.name}
                </Link>
              </CardTitle>
            )}
            <CardDescription className="line-clamp-2">
              {pipeline.description || "No notes"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {pipeline.last_run_status && (
              <Badge 
                variant={pipeline.last_run_status === "success" ? "default" : "destructive"}
                className={pipeline.last_run_status === "success" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
              >
                {pipeline.last_run_status}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0d0d0d] border-white/10">
                <DropdownMenuItem onClick={startEditing} className="hover:bg-white/10">
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pipeline.last_run_at ? (
              <span>Used {formatDistanceToNow(pipeline.last_run_at)}</span>
            ) : (
              <span className="text-muted-foreground/60">Not used yet</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/pipelines/${pipeline.id}`}>
                <Play className="mr-1 h-3 w-3" />
                Use
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="group-hover:text-primary transition-colors">
              <Link href={`/pipelines/${pipeline.id}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
