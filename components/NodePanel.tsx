"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  categoryColor,
  subItems,
  type Category,
  type GraphNode,
} from "@/lib/graph-data";

interface Props {
  node: GraphNode | null;
  onClose: () => void;
}

export default function NodePanel({ node, onClose }: Props) {
  const open = !!node;

  return (
    <AnimatePresence>
      {open && node && (
        <motion.aside
          key="panel"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed top-20 bottom-6 right-6 z-40 w-[min(460px,calc(100vw-3rem))]"
        >
          <div className="terminal-window rounded-xl h-full flex flex-col overflow-hidden">
            <TitleBar title={node.tag ?? node.id} onClose={onClose} />
            <div className="tn-scroll flex-1 overflow-y-auto px-5 py-5 text-sm leading-relaxed">
              <Header node={node} />
              <p className="mt-4 text-tn-fgDark">
                {node.description}
              </p>

              {node.category !== "center" && (
                <SubList category={node.category} />
              )}

              <Footer />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function TitleBar({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="terminal-titlebar flex items-center px-3 py-2 gap-2">
      <button
        onClick={onClose}
        aria-label="Close"
        className="h-3 w-3 rounded-full bg-[#f7768e] hover:brightness-110 transition"
      />
      <span className="h-3 w-3 rounded-full bg-[#e0af68]" />
      <span className="h-3 w-3 rounded-full bg-[#9ece6a]" />
      <div className="flex-1 text-center text-xs text-tn-comment tracking-wide">
        {title}
      </div>
      <div className="w-[42px]" />
    </div>
  );
}

function Header({ node }: { node: GraphNode }) {
  const color = categoryColor[node.category];
  return (
    <div>
      <div className="flex items-baseline gap-2 text-xs text-tn-comment">
        <span style={{ color }}>❯</span>
        <span>cat</span>
        <span className="text-tn-fg">{node.tag ?? node.id}.md</span>
      </div>
      <h2
        className="mt-2 text-2xl font-semibold tracking-tight"
        style={{ color }}
      >
        {node.label}
      </h2>
      <div className="mt-1 text-xs text-tn-comment uppercase tracking-[0.18em]">
        {node.category}
      </div>
    </div>
  );
}

function SubList({ category }: { category: Category }) {
  if (category === "center") return null;
  const items = subItems[category];
  const color = categoryColor[category];
  return (
    <div className="mt-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-tn-comment">
        {"// sub-graph"}
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((s, i) => (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.25 }}
            className="rounded-lg border border-white/5 bg-black/20 p-3 hover:border-white/10 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div
                className="font-semibold"
                style={{ color }}
              >
                {s.label}
              </div>
              {s.link && (
                <a
                  href={s.link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-tn-cyan hover:underline"
                >
                  {s.link.label} ↗
                </a>
              )}
            </div>
            <p className="mt-1 text-tn-fgDark text-[13px]">{s.blurb}</p>
            {s.stack && s.stack.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.stack.map((t) => (
                  <span
                    key={t}
                    className="text-[10.5px] px-1.5 py-0.5 rounded border border-white/5 text-tn-fgDark bg-white/[0.02]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-8 pt-4 border-t border-white/5 text-[11px] text-tn-comment flex items-center justify-between">
      <span>esc · close</span>
      <span className="prompt-caret">uzair@graph</span>
    </div>
  );
}
