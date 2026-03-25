import * as crypto from "crypto";
import { ipcMain, IpcMainInvokeEvent } from "electron";
import { readState, writeState } from "../state";
import { isSessionUnlocked, setSessionUnlocked } from "../session";

export function hashPin(pin: string, salt: string) {
  return crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}

export function validatePin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export function registerAuthHandlers() {
  ipcMain.handle("auth:get-status", () => {
    const state = readState();
    const pinEnabled = state.security.pinEnabled === true;

    if (!pinEnabled && state.security.pinHash) {
      setSessionUnlocked(true);
    }

    return {
      hasPin: Boolean(state.security.pinHash && state.security.salt),
      pinEnabled,
      unlocked: isSessionUnlocked()
    };
  });

  ipcMain.handle("auth:setup-pin", (_event: IpcMainInvokeEvent, pin: string) => {
    if (!validatePin(pin)) {
      throw new Error("PIN_INVALID");
    }

    const state = readState();
    if (state.security.pinHash) {
      throw new Error("PIN_ALREADY_EXISTS");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    state.security = {
      ...state.security,
      salt,
      pinHash: hashPin(pin, salt)
    };

    writeState(state);
    setSessionUnlocked(true);
    return { ok: true };
  });

  ipcMain.handle("auth:unlock", (_event: IpcMainInvokeEvent, pin: string) => {
    if (!validatePin(pin)) {
      return { ok: false, error: "PIN_INVALID" };
    }

    const state = readState();
    if (!state.security.pinHash || !state.security.salt) {
      return { ok: false, error: "PIN_NOT_SET" };
    }

    if (hashPin(pin, state.security.salt) !== state.security.pinHash) {
      return { ok: false, error: "PIN_INCORRECT" };
    }

    setSessionUnlocked(true);
    return { ok: true };
  });

  ipcMain.handle("auth:lock", () => {
    setSessionUnlocked(false);
    return { ok: true };
  });
}
