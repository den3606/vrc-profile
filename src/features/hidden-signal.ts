import type { Elements } from "../lib/elements";

const STORAGE_KEY = "vrc-profile-signal-sent";
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

function lockSend(els: SignalElements, message: string, { persist = false } = {}) {
  if (persist) localStorage.setItem(STORAGE_KEY, "1");
  els.submitBtn.disabled = true;
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

  let sendLocked = localStorage.getItem(STORAGE_KEY) === "1";
  if (sendLocked) {
    lockSend(signalEls, "SIGNAL RECEIVED.", { persist: true });
  }

  signalEls.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sendLocked) return;

    const name = signalEls.nameInput.value.trim();
    const message = signalEls.messageInput.value.trim();

    if (!name) {
      showError(signalEls, "名前を入力してください。");
      return;
    }

    if (!message) {
      showError(signalEls, "メッセージを入力してください。");
      return;
    }

    signalEls.submitBtn.disabled = true;
    signalEls.status.hidden = true;

    try {
      const response = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (response.ok) {
        sendLocked = true;
        lockSend(signalEls, "SIGNAL RECEIVED.", { persist: true });
        return;
      }

      if (response.status === 429) {
        sendLocked = true;
        lockSend(signalEls, "Rate limit reached.");
        return;
      }

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (data?.error === "invalid_name") {
        showError(signalEls, "名前は1〜32文字で入力してください。");
      } else if (data?.error === "invalid_message") {
        showError(signalEls, "メッセージは1〜500文字で入力してください。");
      } else {
        showError(signalEls, "送信に失敗しました。あとでもう一度試してください。");
      }
      signalEls.submitBtn.disabled = false;
    } catch {
      showError(signalEls, "送信に失敗しました。あとでもう一度試してください。");
      signalEls.submitBtn.disabled = false;
    }
  });
}
