const BANNER_STORAGE_KEY = "fh-waitlist-banner-dismissed";
const FORMSPREE_URL = "https://formspree.io/f/xwvjylno";
const SUBMIT_LABEL = "Join the Waitlist";
const SUBMIT_LOADING_LABEL = "Joining…";

async function submitWaitlist(form) {
  const res = await fetch(FORMSPREE_URL, {
    method: "POST",
    body: new FormData(form),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Submission failed. Please try again.");
  }
}

function initWaitlistBanner() {
  const banner = document.getElementById("waitlistBanner");
  const closeBtn = document.getElementById("waitlistBannerClose");
  if (!banner || !closeBtn) return;

  if (localStorage.getItem(BANNER_STORAGE_KEY) === "1") {
    banner.classList.add("is-dismissed");
    return;
  }

  closeBtn.addEventListener("click", () => {
    banner.classList.add("is-dismissed");
    localStorage.setItem(BANNER_STORAGE_KEY, "1");
  });
}

function initWaitlistModal() {
  const modal = document.getElementById("waitlistModal");
  const form = document.getElementById("waitlistForm");
  const submitBtn = document.getElementById("waitlistSubmit");
  const errorEl = document.getElementById("waitlistError");
  const firstName = document.getElementById("waitlistFirstName");
  const lastName = document.getElementById("waitlistLastName");
  const email = document.getElementById("waitlistEmail");
  const beta = document.getElementById("waitlistBeta");

  if (!modal || !form || !submitBtn || !firstName || !lastName || !email || !beta) return;

  let lastTrigger = null;

  function isFormValid() {
    return (
      firstName.value.trim() !== "" &&
      lastName.value.trim() !== "" &&
      email.value.trim() !== "" &&
      email.checkValidity()
    );
  }

  function updateSubmitState() {
    submitBtn.disabled = !isFormValid();
  }

  function hideError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function resetModal() {
    form.reset();
    modal.classList.remove("is-success");
    submitBtn.textContent = SUBMIT_LABEL;
    hideError();
    updateSubmitState();
  }

  function openModal(trigger) {
    lastTrigger = trigger || null;
    resetModal();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("waitlist-modal-open");
    firstName.focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("waitlist-modal-open");
    resetModal();
    if (lastTrigger && typeof lastTrigger.focus === "function") {
      lastTrigger.focus();
    }
    lastTrigger = null;
  }

  document.addEventListener("click", (e) => {
    const openTrigger = e.target.closest("[data-waitlist-open]");
    if (openTrigger) {
      e.preventDefault();
      openModal(openTrigger);
      return;
    }

    if (e.target.closest("[data-waitlist-close]")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });

  [firstName, lastName, email].forEach((field) => {
    field.addEventListener("input", () => {
      hideError();
      updateSubmitState();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    hideError();
    submitBtn.disabled = true;
    submitBtn.textContent = SUBMIT_LOADING_LABEL;

    try {
      await submitWaitlist(form);
      modal.classList.add("is-success");
      window.setTimeout(closeModal, 1500);
    } catch (err) {
      showError(err.message || "Submission failed. Please try again.");
      submitBtn.textContent = SUBMIT_LABEL;
      updateSubmitState();
    }
  });

  if (new URLSearchParams(window.location.search).has("waitlist")) {
    openModal();
    const url = new URL(window.location.href);
    url.searchParams.delete("waitlist");
    window.history.replaceState({}, "", url.pathname + url.hash);
  }
}

function initWaitlist() {
  initWaitlistBanner();
  initWaitlistModal();
}

initWaitlist();
