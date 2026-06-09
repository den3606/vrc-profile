import type { Elements } from "./elements";
import type { ProfileState } from "./state";

export interface AppContext {
  els: Elements;
  state: ProfileState;
  petClicksSession: number;
  avatarEscapedSession: boolean;
}

export function createAppContext(els: Elements, state: ProfileState): AppContext {
  return {
    els,
    state,
    petClicksSession: 0,
    avatarEscapedSession: false,
  };
}
