const SESSION_KEY = "owner-patrol-watch:unlocked";
const REMEMBER_KEY = "owner-patrol-watch:remembered-unlock";

export function isUnlocked() {
  return (
    sessionStorage.getItem(SESSION_KEY) === "true" ||
    localStorage.getItem(REMEMBER_KEY) === "true"
  );
}

export function unlockSession(rememberDevice = false) {
  sessionStorage.setItem(SESSION_KEY, "true");

  if (rememberDevice) {
    localStorage.setItem(REMEMBER_KEY, "true");
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function lockSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}
