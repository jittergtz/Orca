import * as crypto from "crypto";
import { ipcMain, nativeTheme, BrowserWindow, IpcMainInvokeEvent } from "electron";
import { readState, writeState } from "../state";
import { requireUnlocked } from "../session";
import { hashPin, validatePin } from "./auth";

const THEME_MODES = new Set(["system", "light", "dark"]);

export function registerSettingsHandlers() {
  ipcMain.handle("settings:get-theme", () => {
    const state = readState();
    return state.preferences.theme;
  });

  ipcMain.handle("settings:set-theme", (_event: IpcMainInvokeEvent, mode: string) => {
    if (!THEME_MODES.has(mode)) {
      throw new Error("THEME_INVALID");
    }

    const state = readState();
    state.preferences.theme = mode;
    writeState(state);
    return { ok: true };
  });

  ipcMain.handle("settings:get-effective-theme", () => {
    return nativeTheme.shouldUseDarkColors ? "dark" : "light";
  });

  nativeTheme.on("updated", () => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send("theme:system-changed", nativeTheme.shouldUseDarkColors ? "dark" : "light");
      }
    });
  });

  ipcMain.handle("settings:set-pin-enabled", (_event: IpcMainInvokeEvent, enabled: boolean) => {
    requireUnlocked();
    const state = readState();
    if (!state.security.pinHash) {
      throw new Error("PIN_NOT_SET");
    }
    state.security.pinEnabled = Boolean(enabled);
    writeState(state);
    return { ok: true };
  });

  ipcMain.handle("settings:verify-pin", (_event: IpcMainInvokeEvent, pin: string) => {
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
    return { ok: true };
  });

  ipcMain.handle("settings:change-pin", (_event: IpcMainInvokeEvent, currentPin: string, nextPin: string) => {
    requireUnlocked();
    if (!validatePin(currentPin) || !validatePin(nextPin)) {
      throw new Error("PIN_INVALID");
    }

    const state = readState();
    if (!state.security.pinHash || !state.security.salt) {
      throw new Error("PIN_NOT_SET");
    }

    const expected = hashPin(currentPin, state.security.salt);
    if (expected !== state.security.pinHash) {
      throw new Error("PIN_INCORRECT");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    state.security = {
      ...state.security,
      salt,
      pinHash: hashPin(nextPin, salt)
    };
    writeState(state);
    return { ok: true };
  });
}
