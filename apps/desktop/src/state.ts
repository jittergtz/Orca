import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  security: {
    pinHash: string;
    salt: string;
    pinEnabled: boolean;
  };
  preferences: {
    theme: string;
  };
  notes: Note[];
}

export function dataFilePath() {
  return path.join(app.getPath("userData"), "orca-data.json");
}

export function defaultState(): AppState {
  return {
    security: {
      pinHash: "",
      salt: "",
      pinEnabled: false
    },
    preferences: {
      theme: "system"
    },
    notes: []
  };
}

export function readState(): AppState {
  const file = dataFilePath();
  if (!fs.existsSync(file)) {
    return defaultState();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return {
      ...defaultState(),
      ...parsed,
      security: { ...defaultState().security, ...(parsed.security || {}) },
      preferences: { ...defaultState().preferences, ...(parsed.preferences || {}) },
      notes: Array.isArray(parsed.notes) ? parsed.notes : []
    };
  } catch {
    return defaultState();
  }
}

export function writeState(state: AppState) {
  fs.mkdirSync(path.dirname(dataFilePath()), { recursive: true });
  fs.writeFileSync(dataFilePath(), JSON.stringify(state, null, 2), "utf8");
}
