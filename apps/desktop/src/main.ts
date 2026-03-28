import { app, BrowserWindow } from "electron";
import * as path from "path";
import { registerAuthHandlers } from "./handlers/auth";
import { registerSettingsHandlers } from "./handlers/settings";
import { registerNotesHandlers } from "./handlers/notes";
import { createWindow, getMainWindow } from "./window";

const OAUTH_PROTOCOL = "orcadesktop";
let pendingOAuthUrl: string | null = null;
const isPrimaryInstance = app.requestSingleInstanceLock();

function extractOAuthUrl(argv: string[]) {
  return argv.find(arg => typeof arg === "string" && arg.startsWith(`${OAUTH_PROTOCOL}://`)) ?? null;
}

function dispatchOAuthUrl(url: string) {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) {
    pendingOAuthUrl = url;
    return;
  }
  win.webContents.send("auth:oauth-callback", url);
  if (win.isMinimized()) {
    win.restore();
  }
  win.focus();
}

function registerIpc() {
  registerAuthHandlers();
  registerSettingsHandlers();
  registerNotesHandlers();
}

function registerOAuthProtocol() {
  if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient(OAUTH_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    return;
  }
  app.setAsDefaultProtocolClient(OAUTH_PROTOCOL);
}

if (!isPrimaryInstance) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const url = extractOAuthUrl(commandLine);
    if (url) {
      dispatchOAuthUrl(url);
    }
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
    }
  });
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (url.startsWith(`${OAUTH_PROTOCOL}://`)) {
      dispatchOAuthUrl(url);
    }
  });

  app.whenReady().then(() => {
    registerOAuthProtocol();
    registerIpc();
    createWindow();
    const startupUrl = extractOAuthUrl(process.argv);
    if (startupUrl) {
      dispatchOAuthUrl(startupUrl);
    }
    if (pendingOAuthUrl) {
      dispatchOAuthUrl(pendingOAuthUrl);
      pendingOAuthUrl = null;
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
