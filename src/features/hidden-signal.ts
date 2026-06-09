import type { Elements } from "../lib/elements";

const STORAGE_KEY = "vrc-profile-signal-sent";
const API_PATH = "/api/signal";

type SignalElements = {
  form: HTMLFormElement;
  nameInput: HTMLInputElement;
  submitBtn: HTMLButtonElement;
  status: HTMLElement;
};

function getSignalElements(): SignalElements | null {
  const form = document.getElementById("hidden-signal-form") as HTMLFormElement | null;
  const nameInput = document.getElementById("hidden-signal-name") as HTMLInputElement | null;
  const submitBtn = document.getElementById("hidden-signal-submit") as HTMLButtonElement | null;
  const status = document.getElementById("hidden-signal-status");

  if (!form || !nameInput || !submitBtn || !status) return null;

  return { form, nameInput, submitBtn, status };
}

function markSent(els: SignalElements, message: string) {
  localStorage.setItem(STORAGE_KEY, "1");
  els.nameInput.disabled = true;
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

  if (localStorage.getItem(STORAGE_KEY) === "1") {
    markSent(signalEls, "送信しました。");
    return;
  }

  signalEls.form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = signalEls.nameInput.value.trim();
    if (!name) {
      showError(signalEls, "名前を入力してください。");
      return;
    }

    signalEls.submitBtn.disabled = true;
    signalEls.status.hidden = true;

    try {
      const response = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        markSent(signalEls, "送信しました。SIGNAL RECEIVED.");
        return;
      }

      if (response.status === 429) {
        markSent(signalEls, "送信しました。");
        return;
      }

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (data?.error === "invalid_name") {
        showError(signalEls, "名前は1〜32文字で入力してください。");
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
