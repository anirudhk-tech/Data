"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Upload, MessageSquare, Repeat, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload a sample file",
    description: "Drop in an example of the data you work with. Could be messy, could be clean — doesn't matter.",
    visual: "file",
  },
  {
    number: 2,
    icon: MessageSquare,
    title: "Describe what you need",
    description: "Tell Dagger what to do in plain English. The AI figures out the steps and builds your workflow.",
    visual: "prompt",
  },
  {
    number: 3,
    icon: Repeat,
    title: "Run it whenever you need",
    description: "Your workflow is saved. Drop in new files anytime and get consistent, predictable results.",
    visual: "repeat",
  },
];

function StepVisual({ type, isActive }: { type: string; isActive: boolean }) {
  if (type === "file") {
    return (
      <div className="relative w-full h-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isActive ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* File icon */}
          <motion.div
            animate={isActive ? { y: [0, -8, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-20 rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 flex items-center justify-center"
          >
            <Upload className="h-6 w-6 text-primary" />
          </motion.div>
          
          {/* Drop indicator */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: [0, 1, 0], y: [-20, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-primary"
            >
              Drop here
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  if (type === "prompt") {
    return (
      <div className="relative w-full h-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : {}}
          className="w-full max-w-xs"
        >
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <motion.div
              initial={{ width: 0 }}
              animate={isActive ? { width: "100%" } : {}}
              transition={{ duration: 2, ease: "easeOut" }}
              className="h-4 bg-gradient-to-r from-primary/50 to-primary/20 rounded"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={isActive ? { width: "70%" } : {}}
              transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
              className="h-4 bg-gradient-to-r from-primary/30 to-primary/10 rounded mt-2"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (type === "repeat") {
    return (
      <div className="relative w-full h-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : {}}
          className="flex items-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={isActive ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.3, duration: 0.3 }}
              className="flex items-center"
            >
              <div className="w-12 h-12 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              {i < 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isActive ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.3 + 0.2 }}
                >
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return null;
}

export function AnimatedSteps() {
  return (
    <div className="space-y-16">
      {steps.map((step, index) => {
        const ref = useRef(null);
        const isInView = useInView(ref, { once: false, margin: "-100px" });

        return (
          <motion.div
            key={step.number}
            ref={ref}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn(
              "grid md:grid-cols-2 gap-8 items-center",
              index % 2 === 1 && "md:flex-row-reverse"
            )}
          >
            {/* Content */}
            <div className={cn(index % 2 === 1 && "md:order-2")}>
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg"
                  animate={isInView ? { 
                    boxShadow: [
                      "0 0 0 0 rgba(196, 60, 44, 0)",
                      "0 0 0 10px rgba(196, 60, 44, 0.1)",
                      "0 0 0 20px rgba(196, 60, 44, 0)",
                    ] 
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {step.number}
                </motion.div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-lg">{step.description}</p>
            </div>

            {/* Visual */}
            <div className={cn(
              "rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6",
              index % 2 === 1 && "md:order-1"
            )}>
              <StepVisual type={step.visual} isActive={isInView} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
