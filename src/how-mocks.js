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
      id: "overview",
      label:
        "Blocked Items overview. Blocking 9 websites and 4 apps during the next focus session.",
    },
    {
      id: "add-website",
      label:
        "Add website dialog. Enter a domain or URL to block during focus sessions.",
    },
    {
      id: "distractions",
      label:
        "Blocked apps and most common distractions. Toggle popular sites to add to your blocklist.",
    },
  ];

  const FADE_MS = 250;
  const INTERVAL_MS = 2000;
  let activeIndex = 0;
  let intervalId = null;
  let fadeTimeoutId = null;

  function applySlide(index) {
    activeIndex = ((index % slides.length) + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === activeIndex);
      slide.classList.remove("is-fading");
    });
    root.setAttribute("aria-label", SLIDES[activeIndex].label);
  }

  function renderSlide(index, animate) {
    const nextIndex =
      ((index % slides.length) + slides.length) % slides.length;
    if (!animate || nextIndex === activeIndex) {
      applySlide(nextIndex);
      return;
    }

    const current = slides[activeIndex];
    const next = slides[nextIndex];

    next.classList.add("is-active", "is-fading");
    clearTimeout(fadeTimeoutId);
    requestAnimationFrame(() => {
      current.classList.add("is-fading");
      next.classList.remove("is-fading");
    });
    fadeTimeoutId = setTimeout(() => {
      current.classList.remove("is-active", "is-fading");
      activeIndex = nextIndex;
      root.setAttribute("aria-label", SLIDES[activeIndex].label);
    }, FADE_MS);
  }

  function tick() {
    renderSlide(activeIndex + 1, true);
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

  applySlide(0);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  const VIEWS = [
    {
      id: "levels",
      label:
        "Focus legend progression. Beginner is active; locked tiers lead from Iron through Diamond to Legend.",
    },
    {
      id: "weekly-streaks",
      label:
        "Weekly focus streaks. Current streak 2 weeks, personal best 8 weeks, with a year of weekly goal progress.",
    },
    {
      id: "weekly-goal",
      label:
        "Weekly focus goal. Target 500 focus minutes, 175 completed, 225 remaining, 35% progress.",
    },
  ];

  const FADE_MS = 250;
  const INTERVAL_MS = 2000;
  let activeIndex = 0;
  let intervalId = null;
  let fadeTimeoutId = null;

  function applyView(index) {
    activeIndex = ((index % views.length) + views.length) % views.length;
    views.forEach((view, i) => {
      view.classList.toggle("is-active", i === activeIndex);
      view.classList.remove("is-fading");
    });
    root.setAttribute("aria-label", VIEWS[activeIndex].label);
  }

  function renderView(index, animate) {
    const nextIndex =
      ((index % views.length) + views.length) % views.length;
    if (!animate || nextIndex === activeIndex) {
      applyView(nextIndex);
      return;
    }

    const current = views[activeIndex];
    const next = views[nextIndex];

    next.classList.add("is-active", "is-fading");
    clearTimeout(fadeTimeoutId);
    requestAnimationFrame(() => {
      current.classList.add("is-fading");
      next.classList.remove("is-fading");
    });
    fadeTimeoutId = setTimeout(() => {
      current.classList.remove("is-active", "is-fading");
      activeIndex = nextIndex;
      root.setAttribute("aria-label", VIEWS[activeIndex].label);
    }, FADE_MS);
  }

  function tick() {
    renderView(activeIndex + 1, true);
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

  applyView(0);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
