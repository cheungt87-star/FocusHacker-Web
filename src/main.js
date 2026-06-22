import { inject } from "@vercel/analytics";
import { setupProblemVizPlayback } from "./problem-viz.js";
import { initHowStack } from "./how-stack.js";
import { initHowMocks } from "./how-mocks.js";
import "./waitlist.js";

inject();

/* ====== TWEAKS DEFAULTS ====== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  accent: "flame",
}/*EDITMODE-END*/;

const ACCENTS = {
  flame: { c: "#FF6B2C", c2: "#FF8A55", deep: "#E55A1F" },
  sunset: { c: "#E25F5F", c2: "#F08484", deep: "#A03E3E" },
  saffron: { c: "#C99238", c2: "#E0B05A", deep: "#8E6624" },
  cobalt: { c: "#3B6FD8", c2: "#6390E5", deep: "#274FA8" },
};

function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

function applyAccent(key) {
  const p = ACCENTS[key] || ACCENTS.flame;
  const r = document.documentElement.style;
  r.setProperty("--flame", p.c);
  r.setProperty("--flame-2", p.c2);
  r.setProperty("--flame-soft", hexToRgba(p.c, 0.12));
  /* gold/cyan tokens stay fixed — semantic roles independent of accent tweak */
}

const state = { ...TWEAK_DEFAULTS };
applyAccent(state.accent);

/* ====== Hero FH desktop animation (React) ====== */
const heroAnimationEl = document.getElementById("heroAnimation");
if (heroAnimationEl) {
  import("./hero/mount.jsx").then((m) => m.mountHeroAnimation(heroAnimationEl));
}

/* ====== Problem section viz playback ====== */
(function initProblemVizPlayback() {
  const cols = document.querySelectorAll(".problem-col[data-problem-viz]");
  if (!cols.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noObserver = !("IntersectionObserver" in window);

  setupProblemVizPlayback(cols, { reduced, noObserver });

  if (reduced || noObserver) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("viz-playing", entry.isIntersecting);
      });
    },
    { threshold: 0.3, rootMargin: "0px 0px -8% 0px" },
  );
  cols.forEach((col) => io.observe(col));
})();

/* ====== How section — sticky card stack + product mocks ====== */
initHowMocks();
initHowStack();

/* ====== Mobile nav (hamburger + CTA) ====== */
(function initMobileNav() {
  const nav = document.getElementById("nav");
  const btn = document.getElementById("navMenuBtn");
  const links = document.getElementById("navLinks");
  if (!nav || !btn || !links) return;

  const mqMobile = window.matchMedia("(max-width: 980px)");

  function setOpen(open) {
    nav.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-menu-open", open);
  }

  function close() {
    setOpen(false);
  }

  btn.addEventListener("click", () => {
    setOpen(!nav.classList.contains("nav-open"));
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", close);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("nav-open")) return;
    if (!nav.contains(e.target)) close();
  });

  mqMobile.addEventListener("change", () => {
    if (!mqMobile.matches) close();
  });
})();

/* ====== Scroll reveal (hero visual + proof cards) ====== */
(function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  els.forEach((el) => io.observe(el));
})();

/* ====== FAQ accordion ====== */
document.querySelectorAll(".faq-item").forEach((item) => {
  const q = item.querySelector(".faq-q");
  const a = item.querySelector(".faq-a");
  q.addEventListener("click", () => {
    const open = item.classList.toggle("open");
    a.style.maxHeight = open ? `${a.scrollHeight}px` : 0;
  });
});

/* ====== Tweaks panel ====== */
(function tweaks() {
  const panel = document.getElementById("tweaks");
  const close = document.getElementById("tweaksClose");
  const swEl = document.getElementById("swatches");
  if (!panel || !close || !swEl) return;

  Object.entries(ACCENTS).forEach(([key, p]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + (state.accent === key ? " active" : "");
    b.style.background = `linear-gradient(160deg, ${p.c2}, ${p.deep})`;
    b.dataset.accent = key;
    b.title = key;
    swEl.appendChild(b);
  });

  function persist(edits) {
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*");
  }

  swEl.addEventListener("click", (e) => {
    const b = e.target.closest(".swatch");
    if (!b) return;
    const key = b.dataset.accent;
    state.accent = key;
    applyAccent(key);
    swEl.querySelectorAll(".swatch").forEach((s) =>
      s.classList.toggle("active", s === b),
    );
    persist({ accent: key });
  });

  window.addEventListener("message", (e) => {
    const t = e?.data?.type;
    if (t === "__activate_edit_mode") panel.classList.add("open");
    else if (t === "__deactivate_edit_mode") panel.classList.remove("open");
  });

  close.addEventListener("click", () => {
    panel.classList.remove("open");
    window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*");
  });

  window.parent.postMessage({ type: "__edit_mode_available" }, "*");
})();
