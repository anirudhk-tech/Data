"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ParsedCSV } from "@/lib/types";

interface DataPreviewProps {
  data: ParsedCSV;
  maxRows?: number;
  className?: string;
  showHeader?: boolean;
}

export function DataPreview({ data, maxRows = 10, className, showHeader = true }: DataPreviewProps) {
  const displayRows = data.rows.slice(0, maxRows);
  const hasMoreRows = data.rows.length > maxRows;

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {showHeader && (
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 text-sm text-muted-foreground border-b bg-muted/30">
          <span>
            {data.headers.length} columns, {data.rows.length} rows
          </span>
          {hasMoreRows && (
            <span>Showing first {maxRows} rows</span>
          )}
        </div>
      )}
      <ScrollArea className="flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              {data.headers.map((header, i) => (
                <TableHead key={i} className="whitespace-nowrap font-semibold bg-muted/50">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="whitespace-nowrap max-w-[200px] truncate">
                    {cell || <span className="text-muted-foreground italic">empty</span>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
