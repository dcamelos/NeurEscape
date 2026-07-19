import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "neurescape_session_id";

/**
 * Generates or retrieves an anonymous session ID.
 * Persists in sessionStorage so it survives page refreshes within the same tab
 * but resets when the browser is closed — fully anonymous.
 * (Lu et al., 2025 — stealth assessment principle)
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return uuidv4();

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetSession(): string {
  const newId = uuidv4();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, newId);
  }
  return newId;
}
