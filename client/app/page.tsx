"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Play,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DaggerIcon } from "@/components/shared/dagger-icon";

// Dynamic imports for heavy components
const HeroFlow = dynamic(
  () => import("@/components/landing/hero-flow").then((mod) => mod.HeroFlow),
  { ssr: false, loading: () => <div className="h-[300px] w-full rounded-2xl border border-white/10 bg-[#0a0a0a]/50 animate-pulse" /> }
);

const FloatingParticles = dynamic(
  () => import("@/components/landing/floating-particles").then((mod) => mod.FloatingParticles),
  { ssr: false }
);

const ComparisonToggle = dynamic(
  () => import("@/components/landing/comparison-toggle").then((mod) => mod.ComparisonToggle),
  { ssr: false }
);

const TypingDemo = dynamic(
  () => import("@/components/landing/typing-demo").then((mod) => mod.TypingDemo),
  { ssr: false }
);

const OrbitAnimation = dynamic(
  () => import("@/components/landing/orbit-animation").then((mod) => mod.OrbitAnimation),
  { ssr: false }
);

const AnimatedSteps = dynamic(
  () => import("@/components/landing/animated-steps").then((mod) => mod.AnimatedSteps),
  { ssr: false }
);

const LoopAnimation = dynamic(
  () => import("@/components/landing/loop-animation").then((mod) => mod.LoopAnimation),
  { ssr: false }
);

const SparkleButton = dynamic(
  () => import("@/components/landing/sparkle-button").then((mod) => mod.SparkleButton),
  { ssr: false }
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] overflow-hidden">
      {/* Interactive particle background */}
      <div className="fixed inset-0 overflow-hidden">
        <FloatingParticles />
      </div>

      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-red-700 text-white glow-sm">
            <DaggerIcon className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Dagger</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button variant="ghost" asChild>
            <Link href="/pipelines">Dashboard</Link>
          </Button>
          <Button asChild className="glow-sm">
            <Link href="/pipelines/new">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 pt-16 pb-24 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8 glow-sm backdrop-blur-sm"
          >
            <Bot className="h-4 w-4" />
            <span>AI builds it once. You run it forever.</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-white">Automate your data work</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-red-400 to-primary bg-clip-text text-transparent">
              without writing code
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Describe what you need in plain English. Dagger&apos;s AI creates a reusable workflow 
            you can run on any new file — same steps, same results, every single time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <Button size="lg" asChild className="text-lg px-8 py-6 glow">
              <Link href="/pipelines/new">
                <Play className="mr-2 h-5 w-5" />
                Build Your First Workflow
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 backdrop-blur-sm">
              <Link href="#how-it-works">
                How It Works
              </Link>
            </Button>
          </motion.div>

          {/* Interactive Flow Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <HeroFlow />
            <p className="text-xs text-muted-foreground mt-3">
              Watch your workflow come to life — data flows through each step automatically
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who it's for - with orbit animation */}
      <section className="relative z-10 px-8 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground mb-6 text-lg"
          >
            Built for teams who work with data but shouldn&apos;t need an engineer
          </motion.p>
          <OrbitAnimation />
        </div>
      </section>

      {/* The Problem - Interactive Comparison */}
      <section className="relative z-10 px-8 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-4 text-center"
          >
            See the difference yourself
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg mb-12 text-center"
          >
            Try running the same request multiple times
          </motion.p>
          <ComparisonToggle />
        </div>
      </section>

      {/* How It Works Section - Animated Steps */}
      <section id="how-it-works" className="relative z-10 px-8 py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">AI does the hard part. You get a reliable workflow.</p>
          </motion.div>

          <AnimatedSteps />
        </div>
      </section>

      {/* Key benefit - Loop Animation */}
      <section className="relative z-10 px-8 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/20 text-primary mb-6"
            >
              <Sparkles className="h-8 w-8" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Build once. Run forever.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Every Monday, you get the same report. Every semester, you process student data the same way.
            </p>
          </motion.div>

          <LoopAnimation />
        </div>
      </section>

      {/* Example Requests - Typing Demo */}
      <section className="relative z-10 px-8 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">See it in action</h2>
            <p className="text-muted-foreground text-lg">Real workflows, described in plain English</p>
          </motion.div>

          <TypingDemo />

          {/* Additional examples grid */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto mt-12"
          >
            {[
              "Score leads based on company size and engagement",
              "Flag transactions that look unusual",
              "Group users by signup month for cohort analysis",
              "Remove test data before reporting",
            ].map((request, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4 transition-all hover:border-primary/30 cursor-default"
              >
                <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5 transition-all group-hover:scale-110" />
                <span className="text-muted-foreground text-sm">&ldquo;{request}&rdquo;</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section - with Sparkle Button */}
      <section className="relative z-10 px-8 py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm p-12 glow-border"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Ready to automate your data work?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg mb-8"
            >
              Build your first workflow in minutes. Run it for years.
            </motion.p>
            
            <SparkleButton />

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mt-6"
            >
              Free to try • No credit card required
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-red-700 text-white">
              <DaggerIcon className="h-4 w-4" />
            </div>
            <span className="font-semibold">Dagger</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm text-muted-foreground"
          >
            Pipelines powered by AI. Results you can trust.
          </motion.p>
        </div>
      </footer>
    </div>
  );
}
