import * as crypto from "crypto";
import { ipcMain, IpcMainInvokeEvent } from "electron";
import { readState, writeState, Note } from "../state";
import { requireUnlocked } from "../session";

export function registerNotesHandlers() {
  ipcMain.handle("notes:list", () => {
    requireUnlocked();
    const state = readState();
    return [...state.notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  });

  ipcMain.handle("notes:create", () => {
    requireUnlocked();
    const state = readState();
    const now = Date.now();
    const note: Note = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: "",
      createdAt: now,
      updatedAt: now
    };
    state.notes.unshift(note);
    writeState(state);
    return note;
  });

  ipcMain.handle("notes:update", (_event: IpcMainInvokeEvent, payload: any) => {
    requireUnlocked();

    if (!payload || typeof payload.id !== "string") {
      throw new Error("NOTE_INVALID");
    }

    const state = readState();
    const idx = state.notes.findIndex((note: Note) => note.id === payload.id);
    if (idx === -1) {
      throw new Error("NOTE_NOT_FOUND");
    }

    const current = state.notes[idx];
    const title = (payload.title || "Untitled").trim() || "Untitled";
    const content = typeof payload.content === "string" ? payload.content : "";

    const updated = {
      ...current,
      title,
      content,
      updatedAt: Date.now()
    };

    state.notes[idx] = updated;
    state.notes.sort((a: Note, b: Note) => (b.updatedAt || 0) - (a.updatedAt || 0));
    writeState(state);
    return updated;
  });

  ipcMain.handle("notes:delete", (_event: IpcMainInvokeEvent, id: string) => {
    requireUnlocked();
    if (typeof id !== "string") {
      throw new Error("NOTE_INVALID");
    }

    const state = readState();
    state.notes = state.notes.filter((note: Note) => note.id !== id);
    writeState(state);
    return { ok: true };
  });
}
