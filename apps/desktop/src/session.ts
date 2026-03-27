let sessionUnlocked = false;

export function isSessionUnlocked() {
  return sessionUnlocked;
}

export function setSessionUnlocked(unlocked: boolean) {
  sessionUnlocked = unlocked;
}

export function requireUnlocked() {
  if (!sessionUnlocked) {
    throw new Error("AUTH_REQUIRED");
  }
}
