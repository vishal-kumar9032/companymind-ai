"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import cytoscape, { Core, NodeSingular } from "cytoscape";
import { GraphData } from "@/lib/schema";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  X,
  MessageSquare,
  Network,
  Tag,
  Share2,
} from "lucide-react";

interface GraphCanvasProps {
  data: GraphData;
  highlightHops: string[];
  highlightNodeIds?: string[];
  onAskAboutNode?: (question: string) => void;
  onSelectNode?: (nodeId: string) => void;
}

const LABEL_COLORS: Record<string, string> = {
  Person: "#60a5fa",       // Blue
  Team: "#818cf8",         // Indigo
  Service: "#a78bfa",      // Violet
  Decision: "#fb7185",     // Rose
  Doc: "#34d399",          // Emerald
  Meeting: "#fbbf24",      // Amber
  GitHubPR: "#22d3ee",     // Cyan
  GitHubIssue: "#facc15",  // Yellow
  AgentFinding: "#f472b6", // Pink
};

const NODE_SHAPES: Record<string, cytoscape.Css.NodeShape> = {
  Person: "ellipse",
  Team: "round-rectangle",
  Service: "round-rectangle",
  Decision: "diamond",
  Doc: "round-rectangle",
  Meeting: "round-rectangle",
  GitHubPR: "round-rectangle",
  GitHubIssue: "tag",
  AgentFinding: "hexagon",
};

const STORAGE_KEY = "falkordb_graph_positions_v1";

export function GraphCanvas({
  data,
  highlightHops,
  highlightNodeIds,
  onAskAboutNode,
  onSelectNode,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    Person: true,
    Team: true,
    Service: true,
    Decision: true,
    Doc: true,
    Meeting: true,
    GitHubPR: true,
    GitHubIssue: true,
    AgentFinding: true,
  });
  const [hasPath, setHasPath] = useState(false);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    // Check cached positions
    let cachedPositions: Record<string, { x: number; y: number }> | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cachedPositions = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore localStorage error
    }

    // Convert data to Cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [
      ...data.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.name,
          category: node.label,
          color: LABEL_COLORS[node.label] || "#a1a1aa",
          shape: NODE_SHAPES[node.label] || "round-rectangle",
          props: node.properties,
        },
        position: cachedPositions?.[node.id] ? cachedPositions[node.id] : undefined,
      })),
      ...data.edges.map((edge) => ({
        data: {
          id: `edge-${edge.id}`,
          source: edge.source,
          target: edge.target,
          label: edge.label,
        },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            shape: "data(shape)" as any,
            color: "#ffffff",
            "font-size": "11px",
            "font-family": "var(--font-jetbrains-mono), monospace",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "text-outline-color": "#08080c",
            "text-outline-width": 2,
            width: 24,
            height: 24,
            "border-width": 1.5,
            "border-color": "rgba(255, 255, 255, 0.15)",
            label: "", // Hidden by default for clean look
            "transition-property": "opacity, border-color, border-width, width, height, background-color",
            "transition-duration": 0.25,
          },
        },
        {
          selector: "node.show-label, node.top-degree, node.highlighted, node:selected",
          style: {
            label: "data(label)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "rgba(255, 255, 255, 0.12)",
            "target-arrow-color": "rgba(255, 255, 255, 0.2)",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.8,
            "font-size": "9px",
            "font-family": "var(--font-jetbrains-mono), monospace",
            color: "#71717a",
            "text-rotation": "autorotate",
            "text-margin-y": -4,
            "text-outline-color": "#08080c",
            "text-outline-width": 2,
            opacity: 0.6,
            label: "",
            "transition-property": "opacity, line-color, width",
            "transition-duration": 0.25,
          },
        },
        {
          selector: "edge.show-label, edge.highlighted",
          style: {
            label: "data(label)",
          },
        },
        {
          selector: ".dimmed",
          style: {
            opacity: 0.12,
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-color": "#facc15",
            "border-width": 3,
            width: 32,
            height: 32,
            "font-size": "12px",
            "font-weight": "bold",
            "text-outline-color": "#08080c",
            "text-outline-width": 2.5,
            color: "#fef08a",
            "z-index": 999,
            opacity: 1,
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            width: 2.5,
            "line-color": "#facc15",
            "target-arrow-color": "#facc15",
            opacity: 1,
            "z-index": 998,
          },
        },
        {
          selector: ".hidden",
          style: {
            display: "none",
          },
        },
      ],
      layout: cachedPositions
        ? { name: "preset" }
        : {
            name: "cose",
            animate: false,
            nodeRepulsion: () => 450000,
            idealEdgeLength: () => 90,
          },
    });

    // Mark top 8 highest-degree nodes so primary landmarks have visible labels
    const degrees = cy.nodes().map((n) => ({ id: n.id(), deg: n.degree() }));
    degrees.sort((a, b) => b.deg - a.deg);
    const topLandmarkIds = degrees.slice(0, 8).map((d) => d.id);
    topLandmarkIds.forEach((id) => cy.getElementById(id).addClass("top-degree"));

    // Cache positions after layout finishes or manual drag
    cy.on("dragfree", () => {
      const positions: Record<string, { x: number; y: number }> = {};
      cy.nodes().forEach((n) => {
        positions[n.id()] = n.position();
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      } catch (e) {
        // Ignore
      }
    });

    // Tap node handler
    cy.on("tap", "node", (evt) => {
      const node = evt.target as NodeSingular;
      const data = node.data();
      const connected = node.neighborhood("node").map((n) => ({
        id: n.id(),
        name: n.data("label"),
        category: n.data("category"),
      }));
      setSelectedNode({ ...data, connected });
      onSelectNode?.(data.label || node.id());
    });

    // Tap background handler
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    // Mouseover / Mouseout label preview
    cy.on("mouseover", "node", (evt) => {
      evt.target.addClass("show-label");
    });
    cy.on("mouseout", "node", (evt) => {
      if (!evt.target.hasClass("top-degree") && !evt.target.hasClass("highlighted")) {
        evt.target.removeClass("show-label");
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [data]);

  // Sequential Step-by-Step Path Animation (Requirement #4)
  const animatePath = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    // Determine target nodes: match by node id first, fall back to name (Bug #5 fix)
    const allNodes = cy.nodes();
    const orderedNodes: NodeSingular[] = [];

    if (highlightNodeIds && highlightNodeIds.length > 0) {
      highlightNodeIds.forEach((id) => {
        const found = cy.getElementById(id);
        if (found.length) orderedNodes.push(found);
      });
    } else if (highlightHops && highlightHops.length > 0) {
      highlightHops.forEach((hopName) => {
        const lower = hopName.toLowerCase();
        const found = allNodes.filter((n) => (n.data("label") || "").toLowerCase() === lower);
        if (found.length) orderedNodes.push(found[0]);
      });
    }

    if (!orderedNodes.length) {
      cy.elements().removeClass("dimmed highlighted");
      setHasPath(false);
      return;
    }

    setHasPath(true);

    // Step 1: Dim everything to ~12% opacity
    cy.elements().addClass("dimmed").removeClass("highlighted");

    // Step 2: Step through each node in order, lighting up node + edge
    let step = 0;

    const highlightNext = () => {
      if (step >= orderedNodes.length) {
        // Final: Fit view to path
        const allHighlighted = cy.elements(".highlighted");
        if (allHighlighted.length > 0) {
          cy.animate({
            fit: { eles: allHighlighted, padding: 50 },
            duration: 400,
          });
        }
        return;
      }

      const currNode = orderedNodes[step];
      currNode.removeClass("dimmed").addClass("highlighted");

      if (step > 0) {
        const prevNode = orderedNodes[step - 1];
        const connectingEdge = prevNode.edgesWith(currNode);
        connectingEdge.removeClass("dimmed").addClass("highlighted");
      }

      // Smooth pan to current node
      cy.animate({
        center: { eles: currNode },
        duration: 250,
      });

      step++;
      animationTimerRef.current = setTimeout(highlightNext, 300);
    };

    highlightNext();
  }, [highlightHops, highlightNodeIds]);

  useEffect(() => {
    animatePath();
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, [animatePath]);

  // Clear Path Highlights
  const handleClearHighlights = () => {
    if (!cyRef.current) return;
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    cyRef.current.elements().removeClass("dimmed highlighted");
    setHasPath(false);
  };

  // Toggle Category Filter from Legend (Requirement #5)
  const toggleFilter = (category: string) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const nextState = !activeFilters[category];
    const newFilters = { ...activeFilters, [category]: nextState };
    setActiveFilters(newFilters);

    cy.nodes().forEach((n) => {
      const cat = n.data("category");
      if (newFilters[cat] === false) {
        n.addClass("hidden");
        n.connectedEdges().addClass("hidden");
      } else {
        n.removeClass("hidden");
        n.connectedEdges().removeClass("hidden");
      }
    });
  };

  return (
    <div className="relative w-full h-full dot-grid rounded-card border border-border overflow-hidden">
      {/* Cytoscape Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Controls: Zoom, Fit, Replay, Clear */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 bg-surface/90 backdrop-blur-md border border-border rounded-lg shadow-card z-10">
        {hasPath && (
          <>
            <button
              onClick={animatePath}
              className="flex items-center gap-1 px-2 py-1 text-2xs font-mono rounded bg-accent/15 text-accent hover:bg-accent/25 transition-colors cursor-pointer"
              title="Replay Causal Path Animation"
            >
              <Play size={11} strokeWidth={2} />
              <span>Replay</span>
            </button>
            <button
              onClick={handleClearHighlights}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Clear Highlighted Path"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
            <span className="w-px h-3.5 bg-border" />
          </>
        )}

        <button
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => cyRef.current?.fit(undefined, 40)}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Fit Graph to Viewport"
          aria-label="Fit Graph"
        >
          <Maximize2 size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* Interactive Legend & Category Filter (Requirement #5) */}
      <div className="absolute bottom-3 left-3 p-2 bg-surface/90 backdrop-blur-md border border-border rounded-xl text-2xs font-mono flex flex-wrap gap-x-2.5 gap-y-1.5 max-w-lg z-10 shadow-card">
        {Object.entries(LABEL_COLORS).map(([label, color]) => {
          const isActive = activeFilters[label] !== false;
          return (
            <button
              key={label}
              onClick={() => toggleFilter(label)}
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                isActive ? "opacity-100" : "opacity-35 line-through"
              }`}
              title={`Toggle ${label} visibility`}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-zinc-300">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Slide-in Node Detail Drawer inside Card (Requirement #7) */}
      {selectedNode && (
        <div className="absolute top-0 right-0 w-72 sm:w-80 h-full bg-bg/95 backdrop-blur-xl border-l border-border p-4 flex flex-col justify-between z-20 shadow-card animate-in slide-in-from-right duration-200 text-xs">
          <div className="space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: selectedNode.color }}
                />
                <span className="font-semibold text-sm text-zinc-100 truncate">
                  {selectedNode.label}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                aria-label="Close details"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>

            {/* Entity Type Badge */}
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono uppercase px-2 py-0.5 rounded-full bg-surface border border-border text-zinc-300">
                {selectedNode.category}
              </span>
              <span className="text-2xs font-mono text-zinc-500">ID: {selectedNode.id}</span>
            </div>

            {/* Properties key/value rows */}
            <div className="space-y-2">
              <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400 block font-medium">
                Properties:
              </span>
              <div className="space-y-1.5 p-2.5 rounded-xl bg-surface border border-border font-mono text-2xs">
                {Object.entries(selectedNode.props || {}).map(([key, val]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-zinc-500 uppercase">{key}:</span>
                    <span className="text-zinc-200 font-sans break-words">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected Node Chips */}
            {selectedNode.connected && selectedNode.connected.length > 0 && (
              <div className="space-y-2">
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400 block font-medium">
                  Connected Entities ({selectedNode.connected.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.connected.map((item: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (cyRef.current) {
                          const target = cyRef.current.getElementById(item.id);
                          if (target.length) {
                            cyRef.current.animate({ center: { eles: target }, zoom: 1.5, duration: 300 });
                            target.addClass("highlighted");
                          }
                        }
                      }}
                      className="text-2xs font-mono px-2 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action: Ask about this node in Chat */}
          <div className="pt-3 border-t border-border">
            <button
              onClick={() => {
                if (onAskAboutNode) {
                  onAskAboutNode(`What is the impact and role of ${selectedNode.label} in the company graph?`);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer shadow-md shadow-accent/20"
            >
              <MessageSquare size={13} strokeWidth={2} />
              <span>Ask Oracle About This</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
