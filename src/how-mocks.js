function mockSlideshowObserverOptions() {
  return {
    threshold: 0.08,
    rootMargin: "0px 0px -5% 0px",
  };
}

function observeMockSlideshow(root, start, stop) {
  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) start();
      else stop();
    });
  }, mockSlideshowObserverOptions());
  io.observe(root);
}

function initFocusSessionMock() {
  const root = document.getElementById("focusSessionMock");
  const selectorEl = document.getElementById("focusSessionSelector");
  const nameEl = document.getElementById("focusSessionName");
  const metaEl = document.getElementById("focusSessionMeta");
  const configEl = document.getElementById("focusSessionConfig");
  const stageEl = document.getElementById("focusSessionStage");
  const ctaEl = document.getElementById("focusSessionCta");
  const timerEl = document.getElementById("focusSessionTimer");
  const cycleEl = document.getElementById("focusSessionCycle");
  if (
    !root ||
    !selectorEl ||
    !nameEl ||
    !metaEl ||
    !configEl ||
    !stageEl ||
    !ctaEl ||
    !timerEl ||
    !cycleEl
  )
    return;

  const PRESETS = [
    {
      id: "classic",
      name: "Classic",
      label: "Classic preset",
      meta: "25 min · 5 min break · 4 cycles",
      timer: "25:00",
      cycle: "1 / 4",
    },
    {
      id: "expert",
      name: "Expert",
      label: "Expert preset",
      meta: "50 min · 10 min break · 3 cycles",
      timer: "50:00",
      cycle: "1 / 3",
    },
    {
      id: "intense",
      name: "Intense",
      label: "Intense preset",
      meta: "40 min · 10 min break · 3 cycles",
      timer: "40:00",
      cycle: "1 / 3",
    },
    {
      id: "custom",
      name: "Create Custom",
      label: "Create Custom preset",
      meta: "Custom session",
    },
  ];

  const FADE_MS = 250;
  const PULSE_MS = 150;
  const INTERVAL_MS = 2000;
  let activeIndex = 0;
  let intervalId = null;
  let fadeTimeoutId = null;
  let pulseTimeoutId = null;

  function isCustomPreset(preset) {
    return preset.id === "custom";
  }

  function viewFadeEls(isCustom) {
    return isCustom ? [configEl] : [stageEl, ctaEl];
  }

  function formatTimer(timer) {
    const [mins, secs] = timer.split(":");
    return `${mins}<span class="focus-session-stage__colon">:</span>${secs}`;
  }

  function formatCycle(cycle) {
    const [current, total] = cycle.split(" / ");
    return `Cycle <em>${current}</em> / ${total}`;
  }

  function applyPresetContent(preset) {
    const isCustom = isCustomPreset(preset);
    nameEl.textContent = preset.name;
    metaEl.textContent = preset.meta;
    root.classList.toggle("focus-session-mock--custom", isCustom);
    configEl.hidden = !isCustom;

    if (!isCustom) {
      timerEl.innerHTML = formatTimer(preset.timer);
      cycleEl.innerHTML = formatCycle(preset.cycle);
      root.setAttribute(
        "aria-label",
        `Focus session presets: ${preset.label}. ${preset.meta}. Timer ${preset.timer}.`,
      );
    } else {
      root.setAttribute(
        "aria-label",
        `Focus session presets: ${preset.label}. Configure focus time, breaks, and sets.`,
      );
    }
  }

  function pulseSelector() {
    selectorEl.classList.add("focus-session-selector--pulse");
    clearTimeout(pulseTimeoutId);
    pulseTimeoutId = setTimeout(() => {
      selectorEl.classList.remove("focus-session-selector--pulse");
    }, PULSE_MS);
  }

  function renderPreset(index, animate) {
    activeIndex = ((index % PRESETS.length) + PRESETS.length) % PRESETS.length;
    const preset = PRESETS[activeIndex];
    const wasCustom = root.classList.contains("focus-session-mock--custom");

    if (!animate) {
      applyPresetContent(preset);
      return;
    }

    const toFade = [metaEl, ...viewFadeEls(wasCustom)];
    toFade.forEach((el) => el.classList.add("is-fading"));
    clearTimeout(fadeTimeoutId);
    fadeTimeoutId = setTimeout(() => {
      applyPresetContent(preset);
      const isCustom = isCustomPreset(preset);
      toFade.forEach((el) => el.classList.remove("is-fading"));
      const incoming = viewFadeEls(isCustom);
      incoming.forEach((el) => el.classList.add("is-fading"));
      requestAnimationFrame(() => {
        incoming.forEach((el) => el.classList.remove("is-fading"));
      });
      pulseSelector();
    }, FADE_MS);
  }

  function tick() {
    renderPreset(activeIndex + 1, true);
  }

  function start() {
    if (intervalId) return;
    intervalId = setInterval(tick, INTERVAL_MS);
  }

  function stop() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  }

  renderPreset(0, false);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) start();
          else stop();
        });
      },
      { threshold: 0.15 },
    );
    io.observe(root);
  } else {
    start();
  }
}

function initBlockedItemsMock() {
  const root = document.getElementById("blockedItemsMock");
  if (!root) return;

  const slides = [...root.querySelectorAll(".blocked-items-view")];
  if (!slides.length) return;

  const SLIDES = [
    {
      id: "pick-websites",
      label: "Most common distracting websites. Selecting sites to block.",
      dwellMs: 3800,
      toggles: ["facebook.com", "x.com", "tiktok.com"],
      toggleDelayMs: 550,
    },
    {
      id: "add-website",
      label:
        "Add website dialog. Enter a domain or URL to block during focus sessions.",
      dwellMs: 2500,
    },
    {
      id: "pick-apps",
      label: "Common distracting apps. Selecting apps to block.",
      dwellMs: 3200,
      toggles: ["WhatsApp", "Slack"],
      toggleDelayMs: 550,
    },
    {
      id: "success",
      label: "Blocklist ready.",
      dwellMs: 2500,
    },
  ];

  const FADE_MS = 250;
  let activeIndex = 0;
  let slideTimeoutId = null;
  let fadeTimeoutId = null;
  let toggleTimeoutIds = [];
  let isRunning = false;
  let webCount = 0;
  let appCount = 0;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const webCountEl = root.querySelector("[data-blocked-count-web]");
  const appCountEl = root.querySelector("[data-blocked-count-app]");

  function clearToggleTimers() {
    toggleTimeoutIds.forEach(clearTimeout);
    toggleTimeoutIds = [];
  }

  function resetToggles() {
    root.querySelectorAll("[data-bi-toggle].is-on").forEach((toggle) => {
      toggle.classList.remove("is-on");
    });
    root.querySelectorAll(".blocked-items-row.is-selected").forEach((row) => {
      row.classList.remove("is-selected");
    });
  }

  function toggleRow(itemName) {
    const row = root.querySelector(
      `.blocked-items-view.is-active [data-item-name="${itemName}"]`,
    );
    if (!row) return;
    const toggle = row.querySelector("[data-bi-toggle]");
    if (toggle) toggle.classList.add("is-on");
    row.classList.add("is-selected");
  }

  function updateSuccessCounts() {
    const webSlide = SLIDES.find((s) => s.id === "pick-websites");
    const appSlide = SLIDES.find((s) => s.id === "pick-apps");
    webCount = webSlide?.toggles?.length ?? 0;
    appCount = appSlide?.toggles?.length ?? 0;
    if (webCountEl) webCountEl.textContent = String(webCount);
    if (appCountEl) appCountEl.textContent = String(appCount);
    const successSlide = SLIDES.find((s) => s.id === "success");
    if (successSlide) {
      successSlide.label = `Blocklist ready. ${webCount} websites and ${appCount} apps blocked during focus sessions.`;
    }
  }

  function runToggleSequence(slide) {
    clearToggleTimers();
    if (!slide.toggles?.length) return;

    if (reduced) {
      slide.toggles.forEach((name) => toggleRow(name));
      return;
    }

    slide.toggles.forEach((name, i) => {
      const id = setTimeout(() => toggleRow(name), slide.toggleDelayMs * i);
      toggleTimeoutIds.push(id);
    });
  }

  function clearSlideTimer() {
    if (slideTimeoutId) {
      clearTimeout(slideTimeoutId);
      slideTimeoutId = null;
    }
  }

  function onSlideActivated(index) {
    activeIndex = ((index % slides.length) + slides.length) % slides.length;
    const slide = SLIDES[activeIndex];

    slides.forEach((el, i) => {
      el.classList.toggle("is-active", i === activeIndex);
      el.classList.remove("is-fading", "is-entering");
    });

    resetToggles();

    if (slide.id === "success") {
      updateSuccessCounts();
    } else if (slide.toggles) {
      runToggleSequence(slide);
    }

    root.setAttribute("aria-label", slide.label);

    clearSlideTimer();
    if (isRunning && !reduced) {
      slideTimeoutId = setTimeout(() => {
        renderSlide(activeIndex + 1, true);
      }, slide.dwellMs);
    }
  }

  function renderSlide(index, animate) {
    const nextIndex =
      ((index % slides.length) + slides.length) % slides.length;
    if (!animate || nextIndex === activeIndex) {
      onSlideActivated(nextIndex);
      return;
    }

    const current = slides[activeIndex];
    const next = slides[nextIndex];

    clearSlideTimer();
    clearToggleTimers();

    next.classList.add("is-active", "is-fading", "is-entering");
    clearTimeout(fadeTimeoutId);
    requestAnimationFrame(() => {
      current.classList.add("is-fading");
      next.classList.remove("is-fading");
    });
    fadeTimeoutId = setTimeout(() => {
      current.classList.remove("is-active", "is-fading", "is-entering");
      onSlideActivated(nextIndex);
    }, FADE_MS);
  }

  function start() {
    if (isRunning) {
      onSlideActivated(activeIndex);
      return;
    }
    isRunning = true;
    onSlideActivated(activeIndex);
  }

  function stop() {
    isRunning = false;
    clearSlideTimer();
    clearToggleTimers();
  }

  updateSuccessCounts();
  onSlideActivated(0);

  if (reduced) return;

  observeMockSlideshow(root, start, stop);
}

function initGuidedSessionMock() {
  const root = document.getElementById("guidedSessionMock");
  if (!root) return;

  const slides = [...root.querySelectorAll(".guided-session-view")];
  if (!slides.length) return;

  const SLIDES = [
    {
      id: "countdown",
      label: "Get ready. Three second countdown before focus begins.",
      dwellMs: 3000,
      tickMs: 1000,
      tickSteps: 2,
    },
    {
      id: "focus",
      label:
        "Focus in progress. Twenty-four minutes fifty-five seconds remaining, cycle one of four.",
      dwellMs: 2500,
      tickMs: 833,
      tickSteps: 2,
    },
    {
      id: "rest",
      label:
        "Rest in progress. Short break, four minutes fifty-five seconds remaining.",
      dwellMs: 2500,
      tickMs: 833,
      tickSteps: 2,
    },
  ];

  const FADE_MS = 250;
  let activeIndex = 0;
  let slideTimeoutId = null;
  let fadeTimeoutId = null;
  let sceneIntervalId = null;
  let isRunning = false;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timerEls = [...root.querySelectorAll("[data-guided-timer]")];

  function formatTimer(min, sec) {
    const m = String(Math.max(0, min)).padStart(2, "0");
    const s = String(Math.max(0, sec)).padStart(2, "0");
    return `${m}<span class="guided-scene__colon">:</span>${s}`;
  }

  function resetTimer(el) {
    const min = parseInt(el.dataset.initialMin, 10) || 0;
    const sec = parseInt(el.dataset.initialSec, 10) || 0;
    el.innerHTML = formatTimer(min, sec);
  }

  function stopSceneTimer() {
    if (sceneIntervalId) {
      clearInterval(sceneIntervalId);
      sceneIntervalId = null;
    }
    timerEls.forEach(resetTimer);
  }

  function decrementTime(min, sec) {
    let m = min;
    let s = sec - 1;
    if (s < 0) {
      s = 59;
      m -= 1;
    }
    return { min: Math.max(0, m), sec: Math.max(0, s) };
  }

  function startSceneTimer(slideId) {
    if (sceneIntervalId) {
      clearInterval(sceneIntervalId);
      sceneIntervalId = null;
    }
    if (reduced) return;

    const slide = SLIDES.find((s) => s.id === slideId);
    const el = root.querySelector(`[data-view="${slideId}"] [data-guided-timer]`);
    if (!slide || !el) return;

    let min = parseInt(el.dataset.initialMin, 10) || 0;
    let sec = parseInt(el.dataset.initialSec, 10) || 0;
    el.innerHTML = formatTimer(min, sec);

    let steps = 0;
    sceneIntervalId = setInterval(() => {
      const next = decrementTime(min, sec);
      min = next.min;
      sec = next.sec;
      el.innerHTML = formatTimer(min, sec);
      steps += 1;
      if (steps >= slide.tickSteps) {
        clearInterval(sceneIntervalId);
        sceneIntervalId = null;
      }
    }, slide.tickMs);
  }

  function clearSlideTimer() {
    if (slideTimeoutId) {
      clearTimeout(slideTimeoutId);
      slideTimeoutId = null;
    }
  }

  function onSlideActivated(index) {
    activeIndex = ((index % slides.length) + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === activeIndex);
      slide.classList.remove("is-fading");
    });
    root.setAttribute("aria-label", SLIDES[activeIndex].label);
    stopSceneTimer();
    startSceneTimer(SLIDES[activeIndex].id);
    clearSlideTimer();
    if (isRunning && !reduced) {
      slideTimeoutId = setTimeout(() => {
        renderSlide(activeIndex + 1, true);
      }, SLIDES[activeIndex].dwellMs);
    }
  }

  function renderSlide(index, animate) {
    const nextIndex =
      ((index % slides.length) + slides.length) % slides.length;
    if (!animate || nextIndex === activeIndex) {
      onSlideActivated(nextIndex);
      return;
    }

    const current = slides[activeIndex];
    const next = slides[nextIndex];

    clearSlideTimer();
    stopSceneTimer();

    next.classList.add("is-active", "is-fading");
    clearTimeout(fadeTimeoutId);
    requestAnimationFrame(() => {
      current.classList.add("is-fading");
      next.classList.remove("is-fading");
    });
    fadeTimeoutId = setTimeout(() => {
      current.classList.remove("is-active", "is-fading");
      onSlideActivated(nextIndex);
    }, FADE_MS);
  }

  function replaySceneEntrance() {
    const slide = slides[activeIndex];
    if (!slide) return;
    slide.classList.remove("is-active");
    requestAnimationFrame(() => {
      slide.classList.add("is-active");
      stopSceneTimer();
      startSceneTimer(SLIDES[activeIndex].id);
    });
  }

  function start() {
    if (isRunning) {
      replaySceneEntrance();
      return;
    }
    isRunning = true;
    onSlideActivated(activeIndex);
  }

  function stop() {
    isRunning = false;
    clearSlideTimer();
    stopSceneTimer();
  }

  onSlideActivated(0);

  if (reduced) return;

  observeMockSlideshow(root, start, stop);
}

function initVisualProgressMock() {
  const root = document.getElementById("visualProgressMock");
  if (!root) return;

  const views = [...root.querySelectorAll(".visual-progress-view")];
  if (!views.length) return;

  const XP_SEGMENTS = [
    { toLevel: 1, toXp: 500, durationMs: 700 },
    { toLevel: 2, toXp: 1000, durationMs: 700 },
    { toLevel: 3, toXp: 1750, durationMs: 700 },
    { toLevel: 10, toXp: 50000, durationMs: 350, surge: true },
  ];

  const SLIDES = [
    {
      id: "levels",
      label:
        "Focus legend progression. XP rising through Iron, Bronze, and Silver, then surging to Legend at fifty thousand XP.",
      dwellMs: 4000,
    },
    {
      id: "streak-stats",
      label:
        "Weekly focus streaks. Current streak 2 weeks, personal best 8 weeks.",
      dwellMs: 2500,
    },
    {
      id: "streak-heatmap",
      label:
        "Weekly streak trend. Year heatmap showing hits, misses, and upcoming weeks.",
      dwellMs: 3000,
    },
    {
      id: "weekly-goal",
      label:
        "Weekly focus goal. Target 500 focus minutes, 175 completed, 225 remaining, 35% progress.",
      dwellMs: 2500,
    },
  ];

  const FADE_MS = 250;
  let activeIndex = 0;
  let slideTimeoutId = null;
  let fadeTimeoutId = null;
  let levelTimeoutIds = [];
  let levelRafId = null;
  let isRunning = false;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const levelNodes = [...root.querySelectorAll(".vp-level-node[data-level]")];
  const captionEl = root.querySelector("[data-level-caption]");
  const xpEl = root.querySelector("[data-xp-counter]");
  const LEVEL_NAMES = { 0: "Beginner", 1: "Iron", 2: "Bronze", 3: "Silver", 10: "Legend" };

  function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
  }

  function easeInExpo(t) {
    return t === 0 ? 0 : 2 ** (10 * t - 10);
  }

  function formatXp(value) {
    return Math.round(value).toLocaleString("en-US");
  }

  function setXpDisplay(xp) {
    if (xpEl) {
      xpEl.textContent = formatXp(xp);
    }
  }

  function clearLevelTimers() {
    levelTimeoutIds.forEach(clearTimeout);
    levelTimeoutIds = [];
    if (levelRafId !== null) {
      cancelAnimationFrame(levelRafId);
      levelRafId = null;
    }
    xpEl?.classList.remove("is-surging");
  }

  function animateXp(fromXp, toXp, durationMs, { ease = easeOutCubic, onFrame, onComplete } = {}) {
    return new Promise((resolve) => {
      const start = performance.now();

      function frame(now) {
        const elapsed = now - start;
        const t = durationMs <= 0 ? 1 : Math.min(elapsed / durationMs, 1);
        const eased = ease(t);
        const value = fromXp + (toXp - fromXp) * eased;
        onFrame?.(value);
        if (t < 1) {
          levelRafId = requestAnimationFrame(frame);
        } else {
          levelRafId = null;
          onComplete?.();
          resolve();
        }
      }

      levelRafId = requestAnimationFrame(frame);
    });
  }

  function setOrbLabel(node, level) {
    const orb = node.querySelector(".vp-level-node__orb");
    if (!orb) return;
    orb.textContent = String(level);
    orb.removeAttribute("aria-hidden");
  }

  function clearOrbLabel(node) {
    const orb = node.querySelector(".vp-level-node__orb");
    if (!orb) return;
    orb.textContent = "";
    orb.setAttribute("aria-hidden", "true");
  }

  function resetLevels() {
    levelNodes.forEach((node) => {
      const level = parseInt(node.dataset.level, 10);
      node.classList.remove("is-active", "is-unlocked");
      node.classList.add("is-locked");
      if (level === 0) {
        node.classList.remove("is-locked");
        node.classList.add("is-active");
        setOrbLabel(node, 0);
      } else {
        clearOrbLabel(node);
      }
    });
    if (captionEl) {
      captionEl.textContent = `LVL 0 · ${LEVEL_NAMES[0]}`;
    }
    setXpDisplay(0);
    xpEl?.classList.remove("is-surging");
  }

  function activateLevel(level) {
    levelNodes.forEach((node) => {
      const nodeLevel = parseInt(node.dataset.level, 10);
      node.classList.remove("is-active", "is-unlocked", "is-locked");

      if (nodeLevel === level) {
        node.classList.add("is-active");
        setOrbLabel(node, level);
      } else if (nodeLevel < level) {
        node.classList.add("is-unlocked");
        setOrbLabel(node, nodeLevel);
      } else {
        node.classList.add("is-locked");
        clearOrbLabel(node);
      }
    });

    const name = LEVEL_NAMES[level] ?? `level ${level}`;
    if (captionEl) {
      captionEl.textContent = `LVL ${level} · ${name}`;
    }

    const activeSlide = SLIDES.find((s) => s.id === "levels");
    if (activeSlide) {
      activeSlide.label = `Focus legend progression. Currently at ${name}.`;
    }
  }

  async function runLevelSequence() {
    clearLevelTimers();
    resetLevels();

    if (reduced) {
      setXpDisplay(50000);
      activateLevel(10);
      return;
    }

    let fromXp = 0;

    for (const segment of XP_SEGMENTS) {
      if (segment.surge) {
        xpEl?.classList.add("is-surging");
      }

      await animateXp(fromXp, segment.toXp, segment.durationMs, {
        ease: segment.surge ? easeInExpo : easeOutCubic,
        onFrame: (value) => setXpDisplay(value),
      });

      if (segment.surge) {
        xpEl?.classList.remove("is-surging");
      }

      activateLevel(segment.toLevel);
      fromXp = segment.toXp;
    }
  }

  function clearSlideTimer() {
    if (slideTimeoutId) {
      clearTimeout(slideTimeoutId);
      slideTimeoutId = null;
    }
  }

  function onViewActivated(index) {
    activeIndex = ((index % views.length) + views.length) % views.length;
    const slide = SLIDES[activeIndex];

    views.forEach((view, i) => {
      view.classList.toggle("is-active", i === activeIndex);
      view.classList.remove("is-fading", "is-entering");
    });

    clearLevelTimers();
    if (slide.id === "levels") {
      runLevelSequence();
    } else {
      resetLevels();
    }

    root.setAttribute("aria-label", slide.label);

    clearSlideTimer();
    if (isRunning && !reduced) {
      slideTimeoutId = setTimeout(() => {
        renderView(activeIndex + 1, true);
      }, slide.dwellMs);
    }
  }

  function renderView(index, animate) {
    const nextIndex =
      ((index % views.length) + views.length) % views.length;
    if (!animate || nextIndex === activeIndex) {
      onViewActivated(nextIndex);
      return;
    }

    const current = views[activeIndex];
    const next = views[nextIndex];

    clearSlideTimer();
    clearLevelTimers();

    next.classList.add("is-active", "is-fading", "is-entering");
    clearTimeout(fadeTimeoutId);
    requestAnimationFrame(() => {
      current.classList.add("is-fading");
      next.classList.remove("is-fading");
    });
    fadeTimeoutId = setTimeout(() => {
      current.classList.remove("is-active", "is-fading", "is-entering");
      onViewActivated(nextIndex);
    }, FADE_MS);
  }

  function start() {
    if (isRunning) {
      onViewActivated(activeIndex);
      return;
    }
    isRunning = true;
    onViewActivated(activeIndex);
  }

  function stop() {
    isRunning = false;
    clearSlideTimer();
    clearLevelTimers();
  }

  if (reduced) {
    setXpDisplay(50000);
    activateLevel(10);
  } else {
    resetLevels();
  }
  onViewActivated(0);

  if (reduced) return;

  observeMockSlideshow(root, start, stop);
}

/** Initialize all How-section product mock slideshows. */
export function initHowMocks() {
  initFocusSessionMock();
  initBlockedItemsMock();
  initGuidedSessionMock();
  initVisualProgressMock();
}
