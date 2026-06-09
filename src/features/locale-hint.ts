import { openAccessTerminal } from "../lib/access-terminal";
import type { AppContext } from "../lib/app-context";
import { runLangHelp } from "./terminal";

export function setupLocaleHint(ctx: AppContext): void {
  const hint = document.getElementById("locale-hint");
  if (!hint) return;

  hint.addEventListener("click", () => {
    openAccessTerminal(ctx.els);
    runLangHelp(ctx);
  });
}
