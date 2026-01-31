"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Check, X, RotateCcw } from "lucide-react";
import { DaggerIcon } from "@/components/shared/dagger-icon";
import { cn } from "@/lib/utils";

const chatbotResults = [
  "Here's a cleaned version of your data...",
  "I've removed some duplicates for you...",
  "The data has been processed...",
  "Here are the results with fixes...",
];

const daggerResult = "✓ 847 duplicates removed, 1,203 dates fixed. Same result every time.";

export function ComparisonToggle() {
  const [mode, setMode] = useState<"chatbot" | "dagger">("chatbot");
  const [chatbotIndex, setChatbotIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = () => {
    setIsRunning(true);
    if (mode === "chatbot") {
      // Chatbot gives different answer each time
      setChatbotIndex((prev) => (prev + 1) % chatbotResults.length);
    }
    setTimeout(() => setIsRunning(false), 500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setMode("chatbot")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            mode === "chatbot"
              ? "bg-white/10 text-white"
              : "text-muted-foreground hover:text-white"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          AI Chatbot
        </button>
        <button
          onClick={() => setMode("dagger")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            mode === "dagger"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-white"
          )}
        >
          <DaggerIcon className="h-4 w-4" />
          Dagger
        </button>
      </div>

      {/* Simulation Area */}
      <div className={cn(
        "rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300",
        mode === "dagger" 
          ? "border-primary/30 bg-primary/5" 
          : "border-white/10 bg-white/[0.02]"
      )}>
        {/* Input */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
          <div className="text-sm text-muted-foreground">Input:</div>
          <div className="text-sm">"Remove duplicates and fix dates"</div>
        </div>

        {/* Run button */}
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg mb-4 transition-all",
            mode === "dagger"
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-white/10 hover:bg-white/20"
          )}
        >
          <RotateCcw className={cn("h-4 w-4", isRunning && "animate-spin")} />
          Run {mode === "chatbot" ? "Again" : "Workflow"}
        </button>

        {/* Output */}
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Output:</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode === "chatbot" ? chatbotIndex : "dagger"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "rounded-lg p-4",
                mode === "dagger"
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-white/5 border border-white/10"
              )}
            >
              {mode === "chatbot" ? (
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm">{chatbotResults[chatbotIndex]}</p>
                    <p className="text-xs text-amber-400 mt-2">
                      ⚠️ Results vary each time you run it
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-emerald-400">{daggerResult}</p>
                    <p className="text-xs text-emerald-400/70 mt-2">
                      ✓ Deterministic — identical output guaranteed
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Run counter for chatbot */}
        {mode === "chatbot" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground mt-4 text-center"
          >
            Click "Run Again" to see different outputs
          </motion.p>
        )}
      </div>
    </div>
  );
}
