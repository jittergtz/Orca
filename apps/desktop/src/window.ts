import * as path from "path";
import { app, BrowserWindow, Menu } from "electron";

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");
const shouldOpenDevTools = process.env.ORCA_OPEN_DEVTOOLS === "1";

export function getMainWindow() {
  return mainWindow;
}

function rendererUrl() {
  if (process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL;
  }
  if (isDev) {
    return "http://localhost:5173";
  }
  return null;
}

export function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 660,
    icon: path.join(__dirname, "..", "..", "build", "icon.png"),
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
    if (shouldOpenDevTools) {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }
  mainWindow.once("ready-to-show", () => mainWindow?.show());
}
