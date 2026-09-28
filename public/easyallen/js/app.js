import { hydrateSprites } from "./pixel.js";
import { esc, parseQuery } from "./util.js";
import * as home from "./views/home.js";
import * as cells from "./views/cells.js";
import * as cell from "./views/cell.js";
import * as compare from "./views/compare.js";
import * as lab from "./views/lab.js";
import * as guide from "./views/guide.js";

const routes = [
  { re: /^#?\/?$/, view: home, nav: null, title: "EasyAllen" },
  { re: /^#\/cells(?:\?(.*))?$/, view: cells, nav: "cells", title: "Cells" },
  { re: /^#\/cell\/(\d+)(?:\?(.*))?$/, view: cell, nav: "cells", title: "Cell" },
  { re: /^#\/compare(?:\?(.*))?$/, view: compare, nav: "compare", title: "Compare" },
  { re: /^#\/lab(?:\?(.*))?$/, view: lab, nav: "lab", title: "Lab" },
  { re: /^#\/guide(?:\/([\w-]+))?$/, view: guide, nav: "guide", title: "Guide" },
];

const main = document.getElementById("main");
let cleanup = null;
let lastPath = null;

async function route() {
  const hash = location.hash || "#/";
  const path = hash.split("?")[0];
  const match = routes.find((r) => r.re.test(hash)) || routes[0];
  const m = hash.match(match.re) || [];
  // Query-only changes (filters, sweep choice) are handled inside the view.
  if (path === lastPath && match.view.onQuery) {
    match.view.onQuery(parseQuery(hash));
    return;
  }
  lastPath = path;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === match.nav) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title = match.title === "EasyAllen" ? "EasyAllen" : `${match.title} – EasyAllen`;
  main.innerHTML = "";
  window.scrollTo(0, 0);
  try {
    cleanup = (await match.view.render(main, { params: m.slice(1), query: parseQuery(hash) })) || null;
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="wrap"><div class="error-box"><div><b>This page failed to load.</b><p>${esc(err.message)}</p><a class="btn small" href="#/">Go to start</a></div></div></div>`;
  }
  hydrateSprites(main);
}

window.addEventListener("hashchange", route);
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    const s = document.querySelector("[data-search]");
    if (s) { e.preventDefault(); s.focus(); }
  }
});
hydrateSprites();
route();
