"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Terminal,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Cpu,
  Sparkles,
  Shield,
  Play,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEntry, LogLevel, LogSource } from "@/lib/types";

interface ExecutionLogsProps {
  logs: LogEntry[];
}

const levelConfig: Record<LogLevel, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/5" },
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/5" },
  warn: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/5" },
  error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/5" },
  debug: { icon: Bug, color: "text-gray-500", bg: "bg-white/[0.02]" },
};

const sourceConfig: Record<LogSource, { icon: typeof Settings; label: string; color: string }> = {
  system: { icon: Settings, label: "System", color: "text-slate-400" },
  keywords: { icon: Sparkles, label: "Keywords AI", color: "text-primary" },
  wasm: { icon: Cpu, label: "WASM Engine", color: "text-orange-400" },
  validator: { icon: Shield, label: "Validator", color: "text-cyan-400" },
  executor: { icon: Play, label: "Executor", color: "text-emerald-400" },
};

function LogEntryItem({ log, isExpanded, onToggle }: { log: LogEntry; isExpanded: boolean; onToggle: () => void }) {
  const level = levelConfig[log.level] || levelConfig.info;
  const source = sourceConfig[log.source] || sourceConfig.system;
  const LevelIcon = level.icon;
  const SourceIcon = source.icon;
  const hasDetails = log.details && Object.keys(log.details).length > 0;

  const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className={cn("border-b last:border-b-0", level.bg)}>
      <button
        onClick={onToggle}
        disabled={!hasDetails}
        className={cn(
          "w-full flex items-start gap-2 px-3 py-2 text-left transition-colors",
          hasDetails && "hover:bg-muted/50 cursor-pointer"
        )}
      >
        {/* Expand indicator */}
        <div className="mt-0.5 w-4 flex-shrink-0">
          {hasDetails ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : null}
        </div>

        {/* Level icon */}
        <LevelIcon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", level.color)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{time}</span>
            <Badge variant="outline" className={cn("text-xs px-1.5 py-0", source.color)}>
              <SourceIcon className="h-3 w-3 mr-1" />
              {source.label}
            </Badge>
            {log.duration_ms !== undefined && (
              <span className="text-xs text-muted-foreground">
                {log.duration_ms}ms
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5 break-words">{log.message}</p>
        </div>
      </button>

      {/* Expanded details */}
      {hasDetails && isExpanded && (
        <div className="px-3 pb-3 pl-12">
          <pre className="text-xs bg-black/30 border border-white/5 rounded-lg p-3 overflow-x-auto text-muted-foreground">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ExecutionLogs({ logs }: ExecutionLogsProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<LogSource | "all">("all");

  const toggleLog = (index: number) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLogs(new Set(logs.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedLogs(new Set());
  };

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter((log) => log.source === filter);

  const sources = Array.from(new Set(logs.map((l) => l.source)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            What Happened (Technical Details)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse
            </Button>
          </div>
        </div>
        
        {/* Source filters */}
        <div className="flex items-center gap-1 flex-wrap mt-2">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs h-7"
          >
            All ({logs.length})
          </Button>
          {sources.map((source) => {
            const config = sourceConfig[source];
            const count = logs.filter((l) => l.source === source).length;
            const Icon = config.icon;
            return (
              <Button
                key={source}
                variant={filter === source ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter(source)}
                className={cn("text-xs h-7", filter === source && config.color)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {config.label} ({count})
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No logs to display
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const originalIndex = logs.indexOf(log);
                return (
                  <LogEntryItem
                    key={originalIndex}
                    log={log}
                    isExpanded={expandedLogs.has(originalIndex)}
                    onToggle={() => toggleLog(originalIndex)}
                  />
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
