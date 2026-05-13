const SESSION_KEY = "owner-patrol-watch:unlocked";

export function isUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function unlockSession() {
  sessionStorage.setItem(SESSION_KEY, "true");
}

export function lockSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
