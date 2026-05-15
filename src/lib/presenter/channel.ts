"use client";

// BroadcastChannel sincroniza o modo apresentador entre as duas janelas:
//   - Aba do pastor: posta navegação + estado (controlador)
//   - Janela da audiência: escuta navegação + ack quando entra em fullscreen
//
// O channel é namespaced por sermonId pra não cruzar sermões diferentes.

export type PresenterMessage =
  | { type: "navigate"; index: number }
  | { type: "audience-ready"; sermonId: string }
  | { type: "audience-bye" }
  | { type: "request-state" } // audiência pede estado atual ao montar
  | { type: "exit" };

export function channelName(sermonId: string): string {
  return `vox-presenter:${sermonId}`;
}

export function openChannel(sermonId: string): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  return new BroadcastChannel(channelName(sermonId));
}

export function postMessage(
  channel: BroadcastChannel | null,
  message: PresenterMessage
): void {
  if (!channel) return;
  try {
    channel.postMessage(message);
  } catch {
    // janela já fechou
  }
}

/** Abre a janela da audiência em popup. */
export function openAudienceWindow(sermonId: string): Window | null {
  if (typeof window === "undefined") return null;
  const url = `/sermons/${sermonId}/present?mode=presenter&role=audience`;
  const features = "popup,width=1280,height=720,resizable=yes";
  const win = window.open(url, `vox-audience-${sermonId}`, features);
  return win ?? null;
}
