import type { Elements } from "../lib/elements";

const API_PATH = "/api/signal";

type SignalElements = {
  form: HTMLFormElement;
  nameInput: HTMLInputElement;
  messageInput: HTMLTextAreaElement;
  submitBtn: HTMLButtonElement;
  status: HTMLElement;
};

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

function unlockSendButton(els: SignalElements) {
  els.submitBtn.disabled = false;
  els.submitBtn.classList.remove("is-sent");
  els.submitBtn.removeAttribute("aria-disabled");
}

function showSuccess(els: SignalElements, message: string) {
  els.status.textContent = message;
  els.status.hidden = false;
  els.status.classList.remove("is-error");
  els.status.classList.add("is-success");
}

function showError(els: SignalElements, message: string) {
  els.status.textContent = message;
  els.status.hidden = false;
  els.status.classList.remove("is-success");
  els.status.classList.add("is-error");
}

export function setupHiddenSignal(_els: Elements) {
  const signalEls = getSignalElements();
  if (!signalEls) return;

  let sendLocked = false;

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
        showSuccess(signalEls, "SIGNAL RECEIVED.");
        return;
      }

      if (response.status === 429) {
        sendLocked = true;
        showError(signalEls, "Send limit exceeded.");
        return;
      }

      unlockSendButton(signalEls);

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (data?.error === "invalid_name") {
        showError(signalEls, "Name must be 1–32 characters.");
      } else if (data?.error === "invalid_message") {
        showError(signalEls, "Message must be 1–500 characters.");
      } else {
        showError(signalEls, "Send failed. Try again later.");
      }
    } catch {
      unlockSendButton(signalEls);
      showError(signalEls, "Send failed. Try again later.");
    }
  });
}
