import type { Elements } from "./elements";

export function openAccessTerminal(els: Elements, { clearOutput = true } = {}): void {
  els.accessTerminal.hidden = false;
  els.codeInput.focus();
  if (clearOutput) {
    els.terminalOutput.textContent = "";
    els.terminalOutput.classList.remove("error");
  }
}
