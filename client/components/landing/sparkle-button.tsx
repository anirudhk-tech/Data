"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export function SparkleButton() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const createSparkle = () => {
    const sparkle: Sparkle = {
      id: Date.now() + Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
    };
    setSparkles((prev) => [...prev, sparkle]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== sparkle.id));
    }, 1000);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Create initial burst
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createSparkle(), i * 100);
    }
  };

  const handleMouseMove = () => {
    if (isHovered && Math.random() > 0.7) {
      createSparkle();
    }
  };

  return (
    <div className="relative inline-block">
      {/* Sparkles container */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              initial={{ 
                opacity: 1, 
                scale: 0,
                x: `${sparkle.x}%`,
                y: `${sparkle.y}%`,
              }}
              animate={{ 
                opacity: 0, 
                scale: 1,
                y: `${sparkle.y - 50}%`,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
              }}
            >
              <svg
                width={sparkle.size}
                height={sparkle.size}
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: `rotate(${sparkle.rotation}deg)` }}
              >
                <path
                  d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
                  fill="#c43c2c"
                />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Button */}
      <motion.div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button 
          size="lg" 
          asChild 
          className="relative text-lg px-8 py-6 overflow-hidden group"
        >
          <Link href="/pipelines/new">
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary via-red-500 to-primary"
              animate={{
                backgroundPosition: isHovered ? ["0% 50%", "100% 50%", "0% 50%"] : "0% 50%",
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 200%" }}
            />
            
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              animate={isHovered ? { x: "100%" } : { x: "-100%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />

            {/* Content */}
            <span className="relative flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Start Building
              <motion.span
                animate={isHovered ? { x: [0, 5, 0] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </span>
          </Link>
        </Button>
      </motion.div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-lg blur-xl"
        animate={{
          backgroundColor: isHovered ? "rgba(196, 60, 44, 0.4)" : "rgba(196, 60, 44, 0.2)",
        }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
