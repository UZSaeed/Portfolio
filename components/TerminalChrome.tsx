"use client";

/**
 * Decorative terminal chrome — Starship-style prompt + hint + stack chips.
 * All blocks use `pointer-events-auto` only on the inner card so the
 * outer wrapper never blocks graph interactions.
 */
export function TopLeftHint() {
  return (
    <header className="pointer-events-none fixed top-4 left-4 z-30">
      <div className="terminal-window pointer-events-auto rounded-lg px-3 py-2 text-[11.5px] font-mono flex items-center gap-3 text-tn-fgDark">
        <span className="text-tn-comment">hint</span>
        <span className="text-tn-comment">·</span>
        <span>
          <span className="text-tn-cyan">drag</span>,{" "}
          <span className="text-tn-magenta">throw</span>, or{" "}
          <span className="text-tn-green">click</span> a node
        </span>
      </div>
    </header>
  );
}

export function StarshipPrompt() {
  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-30 text-[12.5px] font-mono">
      <div className="terminal-window pointer-events-auto rounded-lg px-3 py-2 inline-flex items-center gap-2">
        <span className="text-tn-green">❯</span>
        <span className="text-tn-magenta">uzair</span>
        <span className="text-tn-comment">in</span>
        <span className="text-tn-blue">~/portfolio</span>
        <span className="text-tn-comment">on</span>
        <span className="text-tn-magenta">⎇ main</span>
        <span className="text-tn-orange">✱</span>
        <span className="text-tn-comment">via</span>
        <span className="text-tn-cyan"> Next 14</span>
        <span className="ml-1 prompt-caret" />
      </div>
    </div>
  );
}

const STACK: { label: string; color: string }[] = [
  { label: "Next 14", color: "text-tn-cyan" },
  { label: "TypeScript", color: "text-tn-blue" },
  { label: "d3-force", color: "text-tn-magenta" },
  { label: "Tailwind", color: "text-tn-cyan" },
  { label: "Framer Motion", color: "text-tn-green" },
  { label: "Tokyo Night", color: "text-tn-orange" },
];

export function BuiltWith() {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-30 text-[11.5px] font-mono max-w-[min(560px,calc(100vw-2.5rem))]">
      <div className="terminal-window pointer-events-auto rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap justify-end">
        <span className="text-tn-comment">$</span>
        <span className="text-tn-fgDark">cat</span>
        <span className="text-tn-fg">.stack</span>
        <span className="text-tn-comment mx-1">→</span>
        {STACK.map((s, i) => (
          <span key={s.label} className="flex items-center gap-2">
            <span className={s.color}>{s.label}</span>
            {i < STACK.length - 1 && (
              <span className="text-tn-comment">·</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
