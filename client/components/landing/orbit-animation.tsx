"use client";

import { motion } from "framer-motion";
import { 
  Building2, 
  GraduationCap, 
  Users, 
  FileSpreadsheet,
  Database,
  BarChart3,
  Mail,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

const orbitItems = [
  { icon: FileSpreadsheet, label: "Spreadsheets", delay: 0 },
  { icon: Database, label: "Databases", delay: 0.5 },
  { icon: BarChart3, label: "Reports", delay: 1 },
  { icon: Mail, label: "CRM Data", delay: 1.5 },
  { icon: Calendar, label: "Schedules", delay: 2 },
];

const audiences = [
  {
    icon: Building2,
    title: "Operations Teams",
    description: "Process vendor files and reports without waiting on IT",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  {
    icon: GraduationCap,
    title: "Researchers",
    description: "Build reproducible data processing for studies",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  {
    icon: Users,
    title: "Growing Teams",
    description: "Scale data work without hiring specialists",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
];

export function OrbitAnimation() {
  return (
    <div className="relative py-12">
      {/* Center content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative flex flex-col items-center text-center p-6 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all hover:border-primary/30"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <motion.div
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-xl mb-4 transition-all",
                  audience.bgColor,
                  audience.color
                )}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <audience.icon className="h-7 w-7" />
                
                {/* Orbiting dots */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-current opacity-40"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      transformOrigin: "28px 28px",
                    }}
                  />
                ))}
              </motion.div>

              <h3 className="relative font-semibold mb-2">{audience.title}</h3>
              <p className="relative text-sm text-muted-foreground">{audience.description}</p>

              {/* Floating data icons */}
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-primary/50"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating orbit elements in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {orbitItems.map((item, index) => (
          <motion.div
            key={item.label}
            className="absolute"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              x: [
                Math.cos((index / orbitItems.length) * Math.PI * 2) * 200 + 50 + "%",
                Math.cos(((index + 1) / orbitItems.length) * Math.PI * 2) * 200 + 50 + "%",
              ],
              y: [
                Math.sin((index / orbitItems.length) * Math.PI * 2) * 100 + 50 + "%",
                Math.sin(((index + 1) / orbitItems.length) * Math.PI * 2) * 100 + 50 + "%",
              ],
            }}
            transition={{
              duration: 20,
              delay: item.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
              <item.icon className="h-3 w-3 text-primary/70" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
