const SLOT_COUNT = 20;
const DISTRACTED_COUNT = 8;
const STATIC_SLOT_SEED = 42;
const RUSH_MINUTES = 23;
const INTERRUPT_CYCLES = [
  { start: 10 * 60 + 5 },
  { start: 12 * 60 + 48 },
  { start: 16 * 60 + 12 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDistractedIndices(seed) {
  const rng = seed != null ? mulberry32(seed) : Math.random;
  const indices = Array.from({ length: SLOT_COUNT }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, DISTRACTED_COUNT);
}

function formatClock(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDayStrip(strip) {
  if (!strip || strip.dataset.built) return;
  strip.dataset.built = "1";
  const frag = document.createDocumentFragment();
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = document.createElement("span");
    slot.className = "day-slot";
    slot.dataset.slot = String(i);
    frag.appendChild(slot);
  }
  strip.appendChild(frag);
}

function setDaySlots(strip, lostIndices) {
  const slots = strip.querySelectorAll(".day-slot");
  const lostSet = new Set(lostIndices);
  slots.forEach((slot, i) => {
    slot.classList.remove("lost", "lost-in");
    slot.textContent = "";
    if (lostSet.has(i)) {
      slot.classList.add("lost");
      slot.textContent = "Distracted";
    }
  });
}

async function animateDayStrip(strip, signal) {
  buildDayStrip(strip);
  while (!signal.aborted) {
    const indices = pickDistractedIndices();
    setDaySlots(strip, []);
    const slots = strip.querySelectorAll(".day-slot");
    for (let i = 0; i < indices.length; i++) {
      if (signal.aborted) return;
      const slot = slots[indices[i]];
      slot.classList.add("lost", "lost-in");
      slot.textContent = "Distracted";
      await sleep(100);
    }
    await sleep(2000);
  }
}

function dayStripSeed(strip) {
  const raw = strip?.dataset?.daySeed;
  if (raw == null || raw === "") return STATIC_SLOT_SEED;
  const n = Number(raw);
  return Number.isFinite(n) ? n : STATIC_SLOT_SEED;
}

function applyStaticDayStrip(strip) {
  buildDayStrip(strip);
  setDaySlots(strip, pickDistractedIndices(dayStripSeed(strip)));
  strip.querySelectorAll(".day-slot.lost").forEach((s) => s.classList.add("lost-in"));
}

async function runInterruptLoop(root, signal) {
  const clockEl = root.querySelector(".interrupt-clock");
  const deltaEl = root.querySelector(".interrupt-delta");
  const apps = [...root.querySelectorAll(".interrupt-app")];
  if (!clockEl || !apps.length) return;

  let order = shuffle([0, 1, 2, 3]);
  let orderIdx = 0;

  const resetClock = (startMinutes = INTERRUPT_CYCLES[0].start) => {
    clockEl.textContent = formatClock(startMinutes);
    clockEl.removeAttribute("data-rushing");
    if (deltaEl) {
      deltaEl.hidden = true;
      deltaEl.classList.remove("interrupt-delta--show");
    }
  };

  const clearBadges = () => {
    apps.forEach((app) => app.classList.remove("has-badge"));
  };

  while (!signal.aborted) {
    resetClock(INTERRUPT_CYCLES[0].start);
    clearBadges();
    order = shuffle([0, 1, 2, 3]);
    orderIdx = 0;

    for (let cycle = 0; cycle < 3 && !signal.aborted; cycle++) {
      const baseMinutes = INTERRUPT_CYCLES[cycle].start;
      resetClock(baseMinutes);

      if (orderIdx >= order.length) {
        order = shuffle([0, 1, 2, 3]);
        orderIdx = 0;
      }
      const appIndex = order[orderIdx++];
      const app = apps[appIndex];
      app.classList.add("has-badge");
      await sleep(400);
      if (signal.aborted) return;

      clockEl.setAttribute("data-rushing", "true");
      let current = baseMinutes;
      const target = baseMinutes + RUSH_MINUTES;
      while (current < target && !signal.aborted) {
        current += 4;
        if (current > target) current = target;
        clockEl.textContent = formatClock(current);
        await sleep(45);
      }

      if (deltaEl) {
        deltaEl.hidden = false;
        deltaEl.classList.add("interrupt-delta--show");
      }
      await sleep(500);
      if (deltaEl) {
        deltaEl.classList.remove("interrupt-delta--show");
        deltaEl.hidden = true;
      }
      app.classList.remove("has-badge");
      const nextStart =
        cycle < 2 ? INTERRUPT_CYCLES[cycle + 1].start : INTERRUPT_CYCLES[0].start;
      resetClock(nextStart);
      await sleep(350);
    }
    await sleep(600);
  }
}

function applyStaticInterrupt(root) {
  const clockEl = root.querySelector(".interrupt-clock");
  const deltaEl = root.querySelector(".interrupt-delta");
  const apps = root.querySelectorAll(".interrupt-app");
  const lastCycle = INTERRUPT_CYCLES[INTERRUPT_CYCLES.length - 1];
  if (clockEl) clockEl.textContent = formatClock(lastCycle.start + RUSH_MINUTES);
  if (deltaEl) {
    deltaEl.hidden = false;
    deltaEl.classList.add("interrupt-delta--show");
  }
  apps.forEach((app, i) => {
    app.classList.toggle("has-badge", i === 0);
  });
}

const controllers = new WeakMap();

function stopCol(col) {
  const ctrl = controllers.get(col);
  if (ctrl) {
    ctrl.abort();
    controllers.delete(col);
  }
}

function startCol(col) {
  stopCol(col);
  const type = col.dataset.problemViz;
  const viz = col.querySelector(".problem-viz");
  if (!viz) return;

  const signal = new AbortController();
  controllers.set(col, signal);

  if (type === "slack") {
    runInterruptLoop(viz, signal.signal);
  } else if (type !== "sprint-comparison") {
    const strip = viz.querySelector("[data-day-strip]");
    if (strip) animateDayStrip(strip, signal.signal);
  }
}

function applyStaticCol(col) {
  const type = col.dataset.problemViz;
  const viz = col.querySelector(".problem-viz");
  if (!viz) return;

  if (type === "slack") {
    applyStaticInterrupt(viz);
  } else if (type !== "sprint-comparison") {
    const strip = viz.querySelector("[data-day-strip]");
    if (strip) applyStaticDayStrip(strip);
  }
}

function initProblemViz() {
  const cols = document.querySelectorAll(".problem-col[data-problem-viz]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  cols.forEach((col) => {
    const strip = col.querySelector("[data-day-strip]");
    if (strip) buildDayStrip(strip);
    if (reduced || col.classList.contains("viz-static")) {
      applyStaticCol(col);
    }
  });
}

function observeProblemCol(col) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const mo = new MutationObserver(() => {
    if (col.classList.contains("viz-static")) {
      stopCol(col);
      applyStaticCol(col);
      return;
    }
    if (col.classList.contains("viz-playing")) {
      startCol(col);
    } else {
      stopCol(col);
    }
  });

  mo.observe(col, { attributes: true, attributeFilter: ["class"] });

  if (col.classList.contains("viz-playing")) {
    startCol(col);
  }
}

export function setupProblemVizPlayback(cols, { reduced, noObserver }) {
  initProblemViz();

  if (reduced) {
    cols.forEach((col) => col.classList.add("viz-static"));
    return;
  }

  cols.forEach((col) => observeProblemCol(col));

  if (noObserver) {
    cols.forEach((col) => {
      col.classList.add("viz-playing");
      startCol(col);
    });
  }
}
