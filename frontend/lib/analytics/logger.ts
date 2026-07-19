import { getSessionId } from "./sessionManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface LogEventPayload {
  level_id: string;
  narrative_state?: string;

  // Performance data (Banihashem et al., 2023)
  event_type: "drag_drop_attempt" | "hint_request" | "level_complete" | "level_start";
  symptom_id?: string;
  target_region?: string;
  correct_region?: string;
  is_correct?: boolean;
  attempt_number?: number;

  // Process data (Banihashem et al., 2023)
  time_on_card_ms?: number;
  previous_wrong_targets?: string[];
  hints_used?: number;
  hint_level?: number;

  client_timestamp?: string;
}

/**
 * Sends a log event to the backend asynchronously.
 * Uses fire-and-forget pattern — never blocks the Phaser game loop.
 * The player never perceives this call (stealth assessment — Lu et al., 2025).
 */
export function logEvent(payload: LogEventPayload): void {
  const sessionId = getSessionId();

  const body = JSON.stringify({
    ...payload,
    session_id: sessionId,
    client_timestamp: new Date().toISOString(),
  });

  // Fire and forget — no await, no blocking
  fetch(`${API_URL}/logs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {
    // Silent fail — analytics should never break the game
    // In production, could queue events locally for retry
  });
}

/**
 * Builds the export download URL for the current session.
 * Called by ResultScene to offer the JSON download button.
 */
export function getExportUrl(): string {
  const sessionId = getSessionId();
  return `${API_URL}/logs/export/${sessionId}`;
}

/**
 * Fetches session data for the ResultScene uncertainty map.
 */
export async function fetchSessionData(sessionId: string) {
  const res = await fetch(`${API_URL}/logs/session/${sessionId}`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}
