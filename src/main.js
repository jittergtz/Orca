const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, ipcMain, nativeTheme, Menu } = require("electron");

let mainWindow = null;
let sessionUnlocked = false;

const THEME_MODES = new Set(["system", "light", "dark"]);

function rendererUrl() {
  if (!app.isPackaged) {
    return process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
  }
  return null;
}

function dataFilePath() {
  return path.join(app.getPath("userData"), "orca-data.json");
}

function defaultState() {
  return {
    security: {
      pinHash: "",
      salt: ""
    },
    preferences: {
      theme: "system"
    },
    notes: []
  };
}

function readState() {
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

function writeState(state) {
  fs.mkdirSync(path.dirname(dataFilePath()), { recursive: true });
  fs.writeFileSync(dataFilePath(), JSON.stringify(state, null, 2), "utf8");
}

function hashPin(pin, salt) {
  return crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}

function validatePin(pin) {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

function requireUnlocked() {
  if (!sessionUnlocked) {
    throw new Error("AUTH_REQUIRED");
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 660,
    minWidth: 400,
    minHeight: 450,
    titleBarStyle: "hiddenInset",
    vibrancy: "under-window",
    visualEffectState: "active",
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  const devUrl = rendererUrl();
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }
  mainWindow.once("ready-to-show", () => mainWindow.show());
}

function registerIpc() {
  ipcMain.handle("auth:get-status", () => {
    const state = readState();
    return {
      hasPin: Boolean(state.security.pinHash && state.security.salt),
      unlocked: sessionUnlocked
    };
  });

  ipcMain.handle("auth:setup-pin", (_event, pin) => {
    if (!validatePin(pin)) {
      throw new Error("PIN_INVALID");
    }

    const state = readState();
    if (state.security.pinHash) {
      throw new Error("PIN_ALREADY_EXISTS");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    state.security = {
      salt,
      pinHash: hashPin(pin, salt)
    };
    writeState(state);
    sessionUnlocked = true;
    return { ok: true };
  });

  ipcMain.handle("auth:unlock", (_event, pin) => {
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

    sessionUnlocked = true;
    return { ok: true };
  });

  ipcMain.handle("auth:lock", () => {
    sessionUnlocked = false;
    return { ok: true };
  });

  ipcMain.handle("settings:get-theme", () => {
    const state = readState();
    return state.preferences.theme;
  });

  ipcMain.handle("settings:set-theme", (_event, mode) => {
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
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("theme:system-changed", nativeTheme.shouldUseDarkColors ? "dark" : "light");
    }
  });

  ipcMain.handle("settings:change-pin", (_event, currentPin, nextPin) => {
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
      salt,
      pinHash: hashPin(nextPin, salt)
    };
    writeState(state);
    return { ok: true };
  });

  ipcMain.handle("notes:list", () => {
    requireUnlocked();
    const state = readState();
    return [...state.notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  });

  ipcMain.handle("notes:create", () => {
    requireUnlocked();
    const state = readState();
    const now = Date.now();
    const note = {
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

  ipcMain.handle("notes:update", (_event, payload) => {
    requireUnlocked();

    if (!payload || typeof payload.id !== "string") {
      throw new Error("NOTE_INVALID");
    }

    const state = readState();
    const idx = state.notes.findIndex((note) => note.id === payload.id);
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
    state.notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    writeState(state);
    return updated;
  });

  ipcMain.handle("notes:delete", (_event, id) => {
    requireUnlocked();
    if (typeof id !== "string") {
      throw new Error("NOTE_INVALID");
    }

    const state = readState();
    state.notes = state.notes.filter((note) => note.id !== id);
    writeState(state);
    return { ok: true };
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  sessionUnlocked = false;
  if (process.platform !== "darwin") {
    app.quit();
  }
});
