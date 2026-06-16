/**
 * Sticky card stack for #how — desktop uses CSS runway; mobile uses flat scroll layout.
 * Toggles .how-stack--static when prefers-reduced-motion: reduce or viewport ≤980px.
 */
export function initHowStack() {
  const stack = document.querySelector(".how-stack");
  if (!stack) return;

  const mqStatic = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mqMobile = window.matchMedia("(max-width: 980px)");
  const pins = [...stack.querySelectorAll(".how-stack__pin")];
  const STEP_GAP = 32;
  const MIN_SLOT_VH = 0.85;

  let resizeObserver = null;
  let resizeTimeoutId = null;

  function clearMobileMetrics() {
    stack.style.removeProperty("min-height");
    pins.forEach((pin) => {
      pin.style.removeProperty("--stack-slot");
      pin.style.removeProperty("--stack-step-local");
      pin.style.removeProperty("min-height");
      pin.style.removeProperty("padding-bottom");
    });
  }

  function isFlatLayout() {
    return mqStatic.matches || mqMobile.matches;
  }

  function measureMobileStack() {
    if (isFlatLayout() || stack.classList.contains("how-stack--static")) {
      clearMobileMetrics();
      return;
    }

    const topPx =
      parseFloat(getComputedStyle(stack).getPropertyValue("--stack-top")) || 72;
    const minSlot = Math.max(
      320,
      Math.round(window.innerHeight * MIN_SLOT_VH - topPx - 16),
    );

    let totalFlow = 0;
    pins.forEach((pin, index) => {
      const card = pin.querySelector(".how-stack__card");
      if (!card) return;

      const cardHeight = Math.ceil(card.getBoundingClientRect().height);
      const slot = Math.max(cardHeight, minSlot);
      const step = cardHeight + STEP_GAP;

      pin.style.setProperty("--stack-slot", `${slot}px`);
      pin.style.setProperty("--stack-step-local", `${step}px`);
      pin.style.minHeight = `${slot}px`;
      totalFlow += slot + (index < pins.length - 1 ? STEP_GAP : 0);
    });

    stack.style.minHeight = `${totalFlow}px`;
  }

  function scheduleMeasure() {
    clearTimeout(resizeTimeoutId);
    resizeTimeoutId = setTimeout(measureMobileStack, 80);
  }

  function setupResizeObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (isFlatLayout()) return;

    resizeObserver = new ResizeObserver(scheduleMeasure);
    pins.forEach((pin) => {
      const card = pin.querySelector(".how-stack__card");
      if (card) resizeObserver.observe(card);
    });
  }

  function apply() {
    const isFlat = isFlatLayout();
    stack.classList.toggle("how-stack--static", isFlat);

    if (isFlat) {
      clearMobileMetrics();
      if (resizeObserver) resizeObserver.disconnect();
      return;
    }

    requestAnimationFrame(() => {
      measureMobileStack();
      setupResizeObserver();
    });
  }

  apply();
  mqStatic.addEventListener("change", apply);
  mqMobile.addEventListener("change", apply);
  window.addEventListener("resize", scheduleMeasure, { passive: true });
  window.addEventListener("load", scheduleMeasure);
  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleMeasure);
  }
}
