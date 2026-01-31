"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Settings,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DaggerIcon } from "@/components/shared/dagger-icon";

const navigation = [
  {
    name: "My Projects",
    href: "/pipelines",
    icon: Workflow,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-white/5 bg-[#080808]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-red-700 text-white glow-sm">
          <DaggerIcon className="h-6 w-6 drop-shadow-lg" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight glow-text">Dagger</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Data Magic</span>
        </div>
      </div>

      {/* Create Pipeline Button */}
      <div className="p-4">
        <Button asChild className="w-full justify-start gap-2 glow-sm hover:glow transition-all duration-300">
          <Link href="/pipelines/new">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Divider with gradient */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary glow-border"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary glow-sm" />
              )}
              <item.icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        
        {/* Version badge */}
        <div className="mt-4 flex items-center justify-center">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            v1.0.0-beta
          </span>
        </div>
      </div>
    </div>
  );
}
