"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const examples = [
  {
    input: "Remove duplicate emails and keep the most recent entry",
    output: "Found 234 duplicates → Merged into 1,847 unique records",
  },
  {
    input: "Fix all the date formats to YYYY-MM-DD",
    output: "Standardized 3,291 dates across 4 different formats",
  },
  {
    input: "Only keep rows where status is 'active' or 'pending'",
    output: "Filtered 5,000 rows → 2,847 matching records",
  },
  {
    input: "Score leads 1-100 based on company size and engagement",
    output: "Scored 1,500 leads: 127 hot, 489 warm, 884 cold",
  },
];

export function TypingDemo() {
  const [currentExample, setCurrentExample] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "processing" | "result" | "pause">("typing");
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHovered) return;

    const example = examples[currentExample];

    if (phase === "typing") {
      let charIndex = 0;
      intervalRef.current = setInterval(() => {
        if (charIndex <= example.input.length) {
          setDisplayText(example.input.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(intervalRef.current!);
          setTimeout(() => setPhase("processing"), 300);
        }
      }, 40);
    } else if (phase === "processing") {
      setTimeout(() => setPhase("result"), 1500);
    } else if (phase === "result") {
      setTimeout(() => setPhase("pause"), 2500);
    } else if (phase === "pause") {
      setTimeout(() => {
        setCurrentExample((prev) => (prev + 1) % examples.length);
        setDisplayText("");
        setPhase("typing");
      }, 500);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, currentExample, isHovered]);

  const example = examples[currentExample];

  return (
    <div 
      className="max-w-xl mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">dagger workflow</span>
        </div>

        {/* Input area */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 min-h-[60px]">
                <p className="text-sm">
                  {displayText}
                  {phase === "typing" && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
                    />
                  )}
                </p>
              </div>
              
              {/* Send button */}
              <div className="flex justify-end mt-2">
                <motion.button
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                    phase === "typing" 
                      ? "bg-white/10 text-muted-foreground" 
                      : "bg-primary text-white"
                  )}
                  animate={phase !== "typing" ? { scale: [1, 0.95, 1] } : {}}
                >
                  <Send className="h-3 w-3" />
                  Run
                </motion.button>
              </div>
            </div>
          </div>

          {/* Processing / Result */}
          <AnimatePresence mode="wait">
            {phase === "processing" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Processing your request...
              </motion.div>
            )}

            {(phase === "result" || phase === "pause") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"
              >
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-400">{example.output}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Example indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {examples.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentExample(i);
              setDisplayText("");
              setPhase("typing");
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === currentExample ? "bg-primary w-6" : "bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}
