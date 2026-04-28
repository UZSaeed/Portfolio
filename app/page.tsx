"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import NodePanel from "@/components/NodePanel";
import {
  BuiltWith,
  ContactLinks,
  StarshipPrompt,
  TopLeftHint,
} from "@/components/TerminalChrome";
import type { GraphNode } from "@/lib/graph-data";

// The graph imports `react-force-graph-2d` which pulls in `window` —
// load it client-only to keep the first paint server-friendly.
const ForceGraph = dynamic(() => import("@/components/ForceGraph"), {
  ssr: false,
  loading: () => <BootSplash />,
});

export default function Page() {
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const handleSelect = useCallback((n: GraphNode) => {
    setSelected(n);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <ForceGraph
          onSelectPrimary={handleSelect}
          expandedCategory={selected?.id ?? null}
        />
      </div>

      <NodePanel node={selected} onClose={handleClose} />

      <TopLeftHint />
      <ContactLinks />
      <StarshipPrompt />
      <BuiltWith />

      {/* Accessible heading for SEO + screen readers (visually hidden) */}
      <h1 className="sr-only">Uzair Saeed — interactive portfolio</h1>
    </main>
  );
}

function BootSplash() {
  return (
    <div className="absolute inset-0 flex items-center justify-center font-mono text-tn-comment text-sm">
      <div className="terminal-window rounded-lg px-4 py-3">
        <span className="text-tn-green">❯</span> booting graph{" "}
        <span className="prompt-caret" />
      </div>
    </div>
  );
}
