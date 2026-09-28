// 2-bit pixel sprites rendered as crisp inline SVG.
// Legend: '#' ink (currentColor), '+' accent blue, 'o' paper, '.' transparent.

export const SPRITES = {
  neuron: [
    "......#.........",
    "..#...#...#.....",
    "...#..#..#......",
    "....#.#.#.......",
    ".....###........",
    "....#####.......",
    "...##+++##......",
    "..###+++###.....",
    "...##+++##......",
    "....#####.......",
    "...#.###.#......",
    "..#...#...#.....",
    ".#....#....#....",
    "......#.........",
    "......##........",
    "......#.##......",
  ],
  pipette: [
    "............##..",
    "...........#oo#.",
    "..........#oo#..",
    ".........#oo#...",
    "........#oo#....",
    ".......#oo#.....",
    "......#oo#......",
    ".....#oo#.......",
    "....#oo#........",
    "...#o+#.........",
    "..#++#..........",
    "..##............",
  ],
  spiny: [
    "...#....",
    ".#.#.#..",
    "..###...",
    ".#####..",
    "..###...",
    ".#.#.#..",
    "...#....",
    "...#....",
  ],
  aspiny: [
    "........",
    "..#.#...",
    "...#....",
    ".#####..",
    ".#####..",
    "...#....",
    "..#.#...",
    "........",
  ],
};

const FILL = { "#": "currentColor", "+": "var(--blue)", o: "var(--paper)" };

export function spriteSVG(name, scale = 2, title = "") {
  const rows = SPRITES[name];
  if (!rows) return "";
  const h = rows.length;
  const w = rows[0].length;
  let rects = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const c = row[x];
      if (c === ".") { x++; continue; }
      let run = 1;
      while (x + run < w && row[x + run] === c) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${FILL[c]}"/>`;
      x += run;
    }
  });
  const label = title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"';
  return `<svg class="sprite" ${label} width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
}

export function hydrateSprites(root = document) {
  root.querySelectorAll("[data-sprite]").forEach((el) => {
    if (el.dataset.hydrated) return;
    el.innerHTML = spriteSVG(el.dataset.sprite, Number(el.dataset.scale || 2), el.dataset.title || "");
    el.dataset.hydrated = "1";
  });
}
