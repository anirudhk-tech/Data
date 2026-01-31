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
import type { ParsedCSV } from "@/lib/types";

interface DataPreviewProps {
  data: ParsedCSV;
  maxRows?: number;
  className?: string;
}

export function DataPreview({ data, maxRows = 10, className }: DataPreviewProps) {
  const displayRows = data.rows.slice(0, maxRows);
  const hasMoreRows = data.rows.length > maxRows;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data.headers.length} columns, {data.rows.length} rows
        </span>
        {hasMoreRows && (
          <span>Showing first {maxRows} rows</span>
        )}
      </div>
      <ScrollArea className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {data.headers.map((header, i) => (
                <TableHead key={i} className="whitespace-nowrap font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="whitespace-nowrap">
                    {cell || <span className="text-muted-foreground italic">empty</span>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
