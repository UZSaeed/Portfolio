import { hydrateSprites } from "./pixel.js";

export function parseQuery(hash = location.hash) {
  const q = hash.split("?")[1] || "";
  return Object.fromEntries(new URLSearchParams(q));
}

// Update the query string without re-rendering the whole view.
export function setQuery(obj, replace = true) {
  const path = (location.hash || "#/").split("?")[0];
  const qs = new URLSearchParams(Object.entries(obj).filter(([, v]) => v !== "" && v != null && v !== false)).toString();
  const next = qs ? `${path}?${qs}` : path;
  if (replace) history.replaceState(null, "", next);
  else location.hash = next;
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  hydrateSprites(t.content);
  return t.content.firstElementChild;
}

const dot = document.getElementById("status-dot");
const text = document.getElementById("status-text");
export function status(msg, state = "ok") {
  text.textContent = msg;
  dot.dataset.state = state;
}

export function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
