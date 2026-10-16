"use client";

import React, { useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import { GraphData } from "@/lib/schema";
import { Maximize2, ZoomIn, ZoomOut, Info } from "lucide-react";

interface GraphCanvasProps {
  data: GraphData;
  highlightHops: string[];
}

const LABEL_COLORS: Record<string, string> = {
  Person: "#3b82f6",     // Blue
  Team: "#6366f1",       // Indigo
  Service: "#8b5cf6",    // Purple
  Meeting: "#f59e0b",    // Amber
  Doc: "#10b981",        // Emerald
  Decision: "#f43f5e",   // Rose
  GitHubPR: "#06b6d4",   // Cyan
  GitHubIssue: "#eab308",// Yellow
  AgentFinding: "#ec4899"// Pink
};

export function GraphCanvas({ data, highlightHops }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const handleFilterCategory = (cat: string) => {
    setCategoryFilter(cat);
    if (!cyRef.current) return;
    const cy = cyRef.current;
    if (cat === "All") {
      cy.elements().removeClass("hidden");
      cy.animate({ fit: { eles: cy.elements(), padding: 40 }, duration: 400 });
    } else {
      cy.elements().addClass("hidden");
      const targetNodes = cy.nodes().filter((n) => n.data("category") === cat);
      targetNodes.removeClass("hidden");
      targetNodes.connectedEdges().removeClass("hidden");
      if (targetNodes.length > 0) {
        cy.animate({ fit: { eles: targetNodes, padding: 50 }, duration: 400 });
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    // Convert data to Cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [
      ...data.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.name,
          category: node.label,
          color: LABEL_COLORS[node.label] || "#a1a1aa",
          props: node.properties,
        },
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
            label: "data(label)",
            "background-color": "data(color)",
            color: "#ffffff",
            "font-size": "10px",
            "font-family": "ui-monospace, monospace",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "text-outline-color": "#09090b",
            "text-outline-width": 2,
            width: 26,
            height: 26,
            "border-width": 2,
            "border-color": "#27272a",
            "transition-property": "border-color, border-width, width, height",
            "transition-duration": 0.3,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#3f3f46",
            "target-arrow-color": "#52525b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "8px",
            "font-family": "ui-monospace, monospace",
            color: "#71717a",
            "text-rotation": "autorotate",
            "text-margin-y": -5,
            "text-outline-color": "#09090b",
            "text-outline-width": 2,
            opacity: 0.8,
          },
        },
        {
          selector: ".highlighted",
          style: {
            "border-color": "#facc15",
            "border-width": 5,
            width: 36,
            height: 36,
            "line-color": "#facc15",
            "target-arrow-color": "#facc15",
            "font-size": "12px",
            "font-weight": "bold",
            "text-outline-color": "#facc15",
            "text-outline-width": 1,
            color: "#fef08a",
            "z-index": 999,
          },
        },
        {
          selector: ".hidden",
          style: {
            display: "none",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        randomize: false,
        nodeRepulsion: () => 450000,
        idealEdgeLength: () => 90,
      },
    });

    cy.on("tap", "node", (evt) => {
      setSelectedNode(evt.target.data());
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [data]);

  // Handle Highlights when hops change
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.elements().removeClass("highlighted");

    if (highlightHops && highlightHops.length > 0) {
      const lowerHops = highlightHops.map((h) => h.toLowerCase());
      const matchingNodes = cy.nodes().filter((node) => {
        const name = (node.data("label") || "").toLowerCase();
        return lowerHops.includes(name);
      });

      matchingNodes.addClass("highlighted");
      matchingNodes.connectedEdges().addClass("highlighted");

      if (matchingNodes.length > 0) {
        cy.animate({
          fit: { eles: matchingNodes, padding: 50 },
          duration: 500,
        });
      }
    }
  }, [highlightHops]);

  return (
    <div className="relative w-full h-full bg-[#0a0a0c] overflow-hidden rounded-xl border border-zinc-800/80 shadow-2xl">
      {/* Cytoscape Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Category Filter Pills */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-1 p-1 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg shadow-lg z-10 text-[11px] font-mono">
        {["All", "Service", "Decision", "Doc", "Meeting", "GitHubPR"].map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilterCategory(cat)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
              categoryFilter === cat
                ? "bg-falkor-600 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg shadow-lg z-10">
        <button
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          onClick={() => cyRef.current?.fit(undefined, 40)}
          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
          title="Fit View"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-2.5 bg-zinc-950/80 backdrop-blur border border-zinc-800/80 rounded-lg text-[11px] font-mono flex flex-wrap gap-x-3 gap-y-1.5 max-w-lg z-10">
        {Object.entries(LABEL_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-zinc-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="absolute top-14 left-4 p-4 bg-zinc-900/95 backdrop-blur border border-zinc-700/80 rounded-xl shadow-2xl max-w-sm text-xs z-20 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: selectedNode.color }}
              />
              <span className="font-semibold text-zinc-200 text-sm">
                {selectedNode.label}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {selectedNode.category}
            </span>
          </div>
          <div className="space-y-1.5 font-mono text-zinc-400">
            {Object.entries(selectedNode.props || {}).map(([key, val]) => (
              <div key={key} className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase">{key}:</span>
                <span className="text-zinc-300 font-sans break-words">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
