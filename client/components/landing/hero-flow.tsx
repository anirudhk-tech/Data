"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  FileSpreadsheet, 
  Sparkles, 
  Filter, 
  Merge, 
  Calendar,
  CheckCircle,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom node component
function PipelineNode({ data }: { data: { label: string; icon: string; active?: boolean; completed?: boolean; pulse?: boolean } }) {
  const icons: Record<string, React.ReactNode> = {
    file: <FileSpreadsheet className="h-4 w-4" />,
    sparkles: <Sparkles className="h-4 w-4" />,
    filter: <Filter className="h-4 w-4" />,
    merge: <Merge className="h-4 w-4" />,
    calendar: <Calendar className="h-4 w-4" />,
    check: <CheckCircle className="h-4 w-4" />,
    zap: <Zap className="h-4 w-4" />,
  };

  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-xl border bg-[#0a0a0a]/90 backdrop-blur-sm transition-all duration-500",
        data.completed 
          ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
          : data.active 
            ? "border-primary/50 shadow-[0_0_25px_rgba(196,60,44,0.4)]" 
            : "border-white/10",
        data.pulse && "animate-pulse"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-white/20 !border-0 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-500",
          data.completed 
            ? "bg-emerald-500/20 text-emerald-400" 
            : data.active 
              ? "bg-primary/20 text-primary" 
              : "bg-white/10 text-muted-foreground"
        )}>
          {icons[data.icon]}
        </div>
        <span className={cn(
          "text-sm font-medium transition-colors duration-500",
          data.completed 
            ? "text-emerald-400" 
            : data.active 
              ? "text-white" 
              : "text-muted-foreground"
        )}>
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-white/20 !border-0 !w-2 !h-2" />
      
      {/* Glow effect */}
      {(data.active || data.completed) && (
        <div className={cn(
          "absolute inset-0 rounded-xl -z-10 blur-xl transition-opacity duration-500",
          data.completed ? "bg-emerald-500/20" : "bg-primary/20"
        )} />
      )}
    </div>
  );
}

// Custom edge with animated particle
function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  data,
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  style?: React.CSSProperties;
  data?: { active?: boolean; completed?: boolean };
}) {
  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + 50} ${sourceY} ${targetX - 50} ${targetY} ${targetX} ${targetY}`;
  
  return (
    <>
      {/* Background edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={data?.completed ? "rgba(16,185,129,0.3)" : data?.active ? "rgba(196,60,44,0.3)" : "rgba(255,255,255,0.1)"}
        strokeWidth={2}
        className="transition-all duration-500"
      />
      
      {/* Animated particle */}
      {data?.active && (
        <>
          <circle r="4" fill="#c43c2c" className="drop-shadow-[0_0_6px_rgba(196,60,44,0.8)]">
            <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="2" fill="white">
            <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}
      
      {/* Completed state - static glow */}
      {data?.completed && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(16,185,129,0.6)"
          strokeWidth={2}
          className="drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"
        />
      )}
    </>
  );
}

const nodeTypes = { pipeline: PipelineNode };
const edgeTypes = { animated: AnimatedEdge };

const initialNodes: Node[] = [
  {
    id: "input",
    type: "pipeline",
    position: { x: 0, y: 100 },
    data: { label: "Raw Data", icon: "file", active: false, completed: false },
  },
  {
    id: "dedupe",
    type: "pipeline",
    position: { x: 180, y: 30 },
    data: { label: "Remove Duplicates", icon: "merge", active: false, completed: false },
  },
  {
    id: "format",
    type: "pipeline",
    position: { x: 180, y: 170 },
    data: { label: "Fix Dates", icon: "calendar", active: false, completed: false },
  },
  {
    id: "filter",
    type: "pipeline",
    position: { x: 400, y: 100 },
    data: { label: "Filter Active", icon: "filter", active: false, completed: false },
  },
  {
    id: "output",
    type: "pipeline",
    position: { x: 580, y: 100 },
    data: { label: "Ready!", icon: "check", active: false, completed: false },
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "input", target: "dedupe", type: "animated", data: { active: false, completed: false } },
  { id: "e2", source: "input", target: "format", type: "animated", data: { active: false, completed: false } },
  { id: "e3", source: "dedupe", target: "filter", type: "animated", data: { active: false, completed: false } },
  { id: "e4", source: "format", target: "filter", type: "animated", data: { active: false, completed: false } },
  { id: "e5", source: "filter", target: "output", type: "animated", data: { active: false, completed: false } },
];

export function HeroFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [step, setStep] = useState(0);

  // Animation sequence
  useEffect(() => {
    const sequence = [
      // Step 0: Input active
      () => {
        setNodes(nds => nds.map(n => ({
          ...n,
          data: { ...n.data, active: n.id === "input", completed: false }
        })));
        setEdges(eds => eds.map(e => ({
          ...e,
          data: { active: false, completed: false }
        })));
      },
      // Step 1: Input completed, edges to dedupe/format active
      () => {
        setNodes(nds => nds.map(n => ({
          ...n,
          data: { 
            ...n.data, 
            active: n.id === "dedupe" || n.id === "format",
            completed: n.id === "input"
          }
        })));
        setEdges(eds => eds.map(e => ({
          ...e,
          data: { 
            active: e.id === "e1" || e.id === "e2",
            completed: false
          }
        })));
      },
      // Step 2: dedupe/format completed, filter active
      () => {
        setNodes(nds => nds.map(n => ({
          ...n,
          data: { 
            ...n.data, 
            active: n.id === "filter",
            completed: n.id === "input" || n.id === "dedupe" || n.id === "format"
          }
        })));
        setEdges(eds => eds.map(e => ({
          ...e,
          data: { 
            active: e.id === "e3" || e.id === "e4",
            completed: e.id === "e1" || e.id === "e2"
          }
        })));
      },
      // Step 3: filter completed, output active
      () => {
        setNodes(nds => nds.map(n => ({
          ...n,
          data: { 
            ...n.data, 
            active: n.id === "output",
            completed: n.id !== "output"
          }
        })));
        setEdges(eds => eds.map(e => ({
          ...e,
          data: { 
            active: e.id === "e5",
            completed: e.id !== "e5"
          }
        })));
      },
      // Step 4: All completed
      () => {
        setNodes(nds => nds.map(n => ({
          ...n,
          data: { ...n.data, active: false, completed: true }
        })));
        setEdges(eds => eds.map(e => ({
          ...e,
          data: { active: false, completed: true }
        })));
      },
    ];

    const interval = setInterval(() => {
      setStep(s => {
        const nextStep = (s + 1) % (sequence.length + 2); // +2 for pause at end
        if (nextStep < sequence.length) {
          sequence[nextStep]();
        }
        return nextStep;
      });
    }, 1200);

    // Start sequence
    sequence[0]();

    return () => clearInterval(interval);
  }, [setNodes, setEdges]);

  return (
    <div className="h-[300px] w-full rounded-2xl border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-sm overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
      >
        <Background color="rgba(255,255,255,0.03)" gap={20} />
      </ReactFlow>
    </div>
  );
}
