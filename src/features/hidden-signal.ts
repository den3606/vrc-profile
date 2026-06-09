import type { Elements } from "../lib/elements";

const STORAGE_KEY = "vrc-profile-signal-sent";
const API_PATH = "/api/signal";
const STATUS_HIDE_MS = 3500;

type SignalElements = {
  form: HTMLFormElement;
  nameInput: HTMLInputElement;
  messageInput: HTMLTextAreaElement;
  submitBtn: HTMLButtonElement;
  status: HTMLElement;
};

let statusHideTimer = 0;

function getSignalElements(): SignalElements | null {
  const form = document.getElementById("hidden-signal-form") as HTMLFormElement | null;
  const nameInput = document.getElementById("hidden-signal-name") as HTMLInputElement | null;
  const messageInput = document.getElementById("hidden-signal-message") as HTMLTextAreaElement | null;
  const submitBtn = document.getElementById("hidden-signal-submit") as HTMLButtonElement | null;
  const status = document.getElementById("hidden-signal-status");

  if (!form || !nameInput || !messageInput || !submitBtn || !status) return null;

  return { form, nameInput, messageInput, submitBtn, status };
}

function lockSendButton(els: SignalElements) {
  els.submitBtn.disabled = true;
  els.submitBtn.classList.add("is-sent");
  els.submitBtn.setAttribute("aria-disabled", "true");
}

function showStatus(els: SignalElements, message: string, { autoHide = false } = {}) {
  els.status.textContent = message;
  els.status.hidden = false;
  els.status.classList.remove("is-error");
  els.status.classList.add("is-success");

  clearTimeout(statusHideTimer);
  if (!autoHide) return;

  statusHideTimer = window.setTimeout(() => {
    els.status.hidden = true;
  }, STATUS_HIDE_MS);
}

function showError(els: SignalElements, message: string) {
  clearTimeout(statusHideTimer);
  els.status.textContent = message;
  els.status.hidden = false;
  els.status.classList.remove("is-success");
  els.status.classList.add("is-error");
}

function markSubmitted(els: SignalElements, message: string, { persist = false, autoHide = true } = {}) {
  if (persist) localStorage.setItem(STORAGE_KEY, "1");
  lockSendButton(els);
  showStatus(els, message, { autoHide });
}

export function setupHiddenSignal(_els: Elements) {
  const signalEls = getSignalElements();
  if (!signalEls) return;

  let sendLocked = localStorage.getItem(STORAGE_KEY) === "1";
  if (sendLocked) {
    lockSendButton(signalEls);
  }

  signalEls.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sendLocked) return;

    const name = signalEls.nameInput.value.trim();
    const message = signalEls.messageInput.value.trim();

    if (!name) {
      showError(signalEls, "Enter a name.");
      return;
    }

    if (!message) {
      showError(signalEls, "Enter a message.");
      return;
    }

    lockSendButton(signalEls);
    signalEls.status.hidden = true;

    try {
      const response = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (response.ok) {
        sendLocked = true;
        markSubmitted(signalEls, "SIGNAL RECEIVED.", { persist: true, autoHide: true });
        return;
      }

      if (response.status === 429) {
        sendLocked = true;
        markSubmitted(signalEls, "Rate limit reached.", { autoHide: true });
        return;
      }

      signalEls.submitBtn.disabled = false;
      signalEls.submitBtn.classList.remove("is-sent");
      signalEls.submitBtn.removeAttribute("aria-disabled");

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (data?.error === "invalid_name") {
        showError(signalEls, "Name must be 1–32 characters.");
      } else if (data?.error === "invalid_message") {
        showError(signalEls, "Message must be 1–500 characters.");
      } else {
        showError(signalEls, "Send failed. Try again later.");
      }
    } catch {
      signalEls.submitBtn.disabled = false;
      signalEls.submitBtn.classList.remove("is-sent");
      signalEls.submitBtn.removeAttribute("aria-disabled");
      showError(signalEls, "Send failed. Try again later.");
    }
  });
}
