"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, ArrowRight, Check, RefreshCw } from "lucide-react";

const files = [
  { name: "January_report.csv", rows: "2,341" },
  { name: "February_report.csv", rows: "2,567" },
  { name: "March_report.csv", rows: "2,892" },
  { name: "April_report.csv", rows: "3,124" },
  { name: "May_report.csv", rows: "2,987" },
];

export function LoopAnimation() {
  const [currentFile, setCurrentFile] = useState(0);
  const [phase, setPhase] = useState<"input" | "processing" | "output">("input");

  useEffect(() => {
    const sequence = () => {
      setPhase("input");
      setTimeout(() => setPhase("processing"), 800);
      setTimeout(() => setPhase("output"), 1800);
      setTimeout(() => {
        setCurrentFile((prev) => (prev + 1) % files.length);
        setPhase("input");
      }, 3000);
    };

    sequence();
    const interval = setInterval(sequence, 3500);
    return () => clearInterval(interval);
  }, []);

  const file = files[currentFile];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm p-8">
        <div className="flex items-center justify-between gap-4">
          {/* Input file */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={file.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.rows} rows</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Arrow / Processing */}
          <div className="flex flex-col items-center gap-2 px-4">
            <motion.div
              animate={phase === "processing" ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, ease: "linear", repeat: phase === "processing" ? Infinity : 0 }}
            >
              {phase === "processing" ? (
                <RefreshCw className="h-6 w-6 text-primary" />
              ) : (
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              )}
            </motion.div>
            <span className="text-xs text-muted-foreground">
              {phase === "processing" ? "Running..." : "Same workflow"}
            </span>
          </div>

          {/* Output */}
          <div className="flex-1">
            <motion.div
              animate={{
                borderColor: phase === "output" ? "rgba(16, 185, 129, 0.5)" : "rgba(255, 255, 255, 0.1)",
                backgroundColor: phase === "output" ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.02)",
              }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: phase === "output" ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Check className={`h-8 w-8 ${phase === "output" ? "text-emerald-400" : "text-muted-foreground"}`} />
                </motion.div>
                <div>
                  <p className={`font-medium text-sm ${phase === "output" ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {phase === "output" ? "Processed!" : "Waiting..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {phase === "output" ? "Same steps, same quality" : "Ready to process"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* File queue indicator */}
        <div className="flex justify-center gap-1.5 mt-6">
          {files.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === currentFile ? 24 : 6,
                backgroundColor: i === currentFile ? "#c43c2c" : "rgba(255, 255, 255, 0.2)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Same workflow processes every file automatically
        </p>
      </div>
    </div>
  );
}
