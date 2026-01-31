"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PipelineSpec, PipelineNode } from "@/lib/types";
import {
  FileSpreadsheet,
  Filter,
  Columns,
  Copy,
  ArrowRightLeft,
  Sparkles,
  Mail,
  Calendar,
  FileOutput,
} from "lucide-react";

interface PipelineCanvasProps {
  spec: PipelineSpec | null;
  previousSpec?: PipelineSpec | null;
}

// Convert operation names to display names
function formatOpName(op: string): string {
  const names: Record<string, string> = {
    parse_csv: "Parse CSV",
    filter: "Filter Rows",
    select_columns: "Select Columns",
    dedupe: "Deduplicate",
    rename_columns: "Rename Columns",
    transform: "Transform",
    validate_email: "Validate Email",
    fix_dates: "Fix Dates",
    output_csv: "Output CSV",
  };
  return names[op] || op.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Get icon for operation
function getOpIcon(op: string) {
  const icons: Record<string, React.ReactNode> = {
    parse_csv: <FileSpreadsheet className="h-5 w-5" />,
    filter: <Filter className="h-5 w-5" />,
    select_columns: <Columns className="h-5 w-5" />,
    dedupe: <Copy className="h-5 w-5" />,
    rename_columns: <ArrowRightLeft className="h-5 w-5" />,
    transform: <Sparkles className="h-5 w-5" />,
    validate_email: <Mail className="h-5 w-5" />,
    fix_dates: <Calendar className="h-5 w-5" />,
    output_csv: <FileOutput className="h-5 w-5" />,
  };
  return icons[op] || <Sparkles className="h-5 w-5" />;
}

// Get color for operation
function getOpColor(op: string): string {
  const colors: Record<string, string> = {
    parse_csv: "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400",
    filter: "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400",
    select_columns: "bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400",
    dedupe: "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400",
    rename_columns: "bg-pink-500/10 border-pink-500/50 text-pink-600 dark:text-pink-400",
    transform: "bg-cyan-500/10 border-cyan-500/50 text-cyan-600 dark:text-cyan-400",
    validate_email: "bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-400",
    fix_dates: "bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400",
    output_csv: "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
  };
  return colors[op] || "bg-gray-500/10 border-gray-500/50 text-gray-600 dark:text-gray-400";
}

// Get description for node config
function getNodeDescription(node: PipelineNode): string {
  const config = node.config;
  
  switch (node.op) {
    case "filter":
      return config.condition ? `${config.condition}` : "";
    case "select_columns":
      return config.columns ? `${(config.columns as string[]).join(", ")}` : "";
    case "dedupe":
      return config.key_columns ? `Key: ${(config.key_columns as string[]).join(", ")}` : "";
    case "rename_columns":
      if (config.mapping) {
        const mapping = config.mapping as Record<string, string>;
        return Object.entries(mapping).map(([k, v]) => `${k} → ${v}`).join(", ");
      }
      return "";
    case "transform":
      return config.column ? `${config.column}: ${config.expression}` : "";
    case "validate_email":
      return config.column ? `Column: ${config.column}` : "";
    case "fix_dates":
      return config.column ? `${config.column} → ${config.format}` : "";
    default:
      return "";
  }
}

interface NodeCardProps {
  node: PipelineNode;
  index: number;
  isNew: boolean;
  isLast: boolean;
}

function NodeCard({ node, index, isNew, isLast }: NodeCardProps) {
  const [visible, setVisible] = useState(!isNew);
  
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const description = getNodeDescription(node);

  return (
    <div className="flex items-center gap-4">
      {/* Node Card */}
      <div
        className={cn(
          "relative flex items-center gap-4 rounded-xl border-2 px-5 py-4 transition-all duration-500 min-w-[220px]",
          getOpColor(node.op),
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          isNew && visible && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        {/* Index Badge */}
        <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-current text-xs font-bold">
          {index + 1}
        </div>
        
        {/* Icon */}
        <div className="shrink-0">
          {getOpIcon(node.op)}
        </div>
        
        {/* Content */}
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">
            {formatOpName(node.op)}
          </span>
          {description && (
            <span className="text-xs opacity-70 max-w-[180px] truncate">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Connector Arrow */}
      {!isLast && (
        <div className={cn(
          "flex items-center transition-all duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}>
          <div className="h-0.5 w-8 bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/20" />
          <div className="h-0 w-0 border-t-[6px] border-b-[6px] border-l-[8px] border-transparent border-l-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}

export function PipelineCanvas({ spec, previousSpec }: PipelineCanvasProps) {
  const [displayedNodes, setDisplayedNodes] = useState<PipelineNode[]>([]);
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!spec) {
      setDisplayedNodes([]);
      setNewNodeIds(new Set());
      return;
    }

    const previousIds = new Set(previousSpec?.nodes.map(n => n.id) || []);
    const newIds = new Set(
      spec.nodes.filter(n => !previousIds.has(n.id)).map(n => n.id)
    );

    // Animate nodes appearing one by one
    let currentIndex = displayedNodes.length;
    
    if (currentIndex < spec.nodes.length) {
      const interval = setInterval(() => {
        if (currentIndex < spec.nodes.length) {
          setDisplayedNodes(spec.nodes.slice(0, currentIndex + 1));
          setNewNodeIds(new Set([spec.nodes[currentIndex].id]));
          currentIndex++;
        } else {
          clearInterval(interval);
          setNewNodeIds(new Set());
        }
      }, 400);

      return () => clearInterval(interval);
    } else {
      setDisplayedNodes(spec.nodes);
      setNewNodeIds(newIds);
      
      // Clear new highlights after animation
      const timer = setTimeout(() => setNewNodeIds(new Set()), 1000);
      return () => clearTimeout(timer);
    }
  }, [spec]);

  if (!spec) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-muted-foreground animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            Generating pipeline...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium">Pipeline Flow</h3>
        <span className="text-xs text-muted-foreground">
          {displayedNodes.length} / {spec.nodes.length} nodes
        </span>
      </div>
      
      <div className="flex-1 rounded-xl border bg-muted/20 p-6 overflow-auto">
        <div className="flex flex-wrap items-center gap-y-6">
          {displayedNodes.map((node, index) => (
            <NodeCard
              key={node.id}
              node={node}
              index={index}
              isNew={newNodeIds.has(node.id)}
              isLast={index === spec.nodes.length - 1}
            />
          ))}
          
          {/* Loading indicator for next node */}
          {displayedNodes.length < spec.nodes.length && (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 px-5 py-4 min-w-[220px]">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-5 rounded bg-muted-foreground/20" />
                  <div className="h-4 w-24 rounded bg-muted-foreground/20" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
