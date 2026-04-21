# Uzair Saeed — Portfolio

An interactive, single-page portfolio where the site _is_ the navigation:
a live D3-force network with a central "Uzair Saeed" node and four primary
categories — **Code**, **Research**, **Outreach**, **Creativity** — each
expanding into its own sub-graph.

Themed after **Tokyo Night** and styled after the **Ghostty** terminal +
**Starship** prompt. Everything jiggles.

## Stack

| Layer      | Choice                                 | Why                                      |
| ---------- | -------------------------------------- | ---------------------------------------- |
| Framework  | Next.js 14 (App Router) + TypeScript   | SEO, fast routing, good Vercel story     |
| Graph      | `react-force-graph-2d` (d3-force)      | "Jiggle" is easier with the D3 sim       |
| Styling    | Tailwind CSS                           | Tokyo Night palette as design tokens     |
| Motion UI  | Framer Motion                          | Modal / panel transitions                |
| Deploy     | Vercel                                 | Zero-config, edge                        |

## Physics constants

Tuned in `components/ForceGraph.tsx`:

- `forceManyBody`: `-900` on the center, `-380` on primary nodes, `-160` on sub-nodes.
- `forceCollide`: `node radius + 10` — the spec's "bubble" effect.
- `alphaDecay`: `0.01` — long settle, lots of motion after interactions.
- `velocityDecay`: `0.22` — bouncy, not syrupy.
- `forceRadial`: gentle ring pull keeps the layout legible without pinning.
- The center has a soft positional spring (`forceX/forceY` strength `0.15`)
  — a "magnetic" pull toward the middle rather than a hard lock, so the
  whole graph breathes.
- Links use per-link `strength` + `distance`, and the **Code ↔ Outreach**
  link is the explicit "weak" one (`strength: 0.08`, `distance: 360`,
  dashed + red).

## Interactions

- **Hover**: node scales to 1.2×, radial glow intensifies, its links
  brighten and emit directional particles.
- **Click** a primary node: opens a right-hand terminal panel with its
  sub-items and pushes its sub-graph outward.
- **Drag**: grab and throw nodes; on release, pinning is cleared so the
  springs re-center with momentum intact.
- **Esc**: close the panel.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Editing content

Everything content-related lives in `lib/graph-data.ts`:

- `primaryNodes` — the four categories + center.
- `subItems` — per-category project/thought list.
- `crossPairs` inside `buildGraph()` — the cross-category links, including
  the "weak" one.

## Deploying

Push to GitHub, import on Vercel, done. No env vars required.
