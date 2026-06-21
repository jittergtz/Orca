import * as path from "path";
import { app, BrowserWindow, Menu } from "electron";

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");
const DEV_SERVER_RETRY_COUNT = 30;
const DEV_SERVER_RETRY_DELAY_MS = 500;
const DEV_SERVER_REQUEST_TIMEOUT_MS = 1000;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isDevServerReady(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEV_SERVER_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForDevServer(url: string) {
  for (let attempt = 1; attempt <= DEV_SERVER_RETRY_COUNT; attempt += 1) {
    if (await isDevServerReady(url)) {
      return true;
    }

    console.log(
      `[ORCA-WINDOW] Waiting for Vite dev server ${url} (${attempt}/${DEV_SERVER_RETRY_COUNT})`
    );
    await sleep(DEV_SERVER_RETRY_DELAY_MS);
  }

  return false;
}

function devServerErrorPage(url: string) {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Orca Dev Server Not Ready</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #111;
        color: #f4f4f5;
      }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 32px;
        box-sizing: border-box;
      }
      main {
        max-width: 620px;
        border: 1px solid #3f3f46;
        border-radius: 8px;
        padding: 24px;
        background: #18181b;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 22px;
      }
      p {
        line-height: 1.5;
        color: #d4d4d8;
      }
      code {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        background: #27272a;
        color: #fafafa;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Orca renderer is not available</h1>
      <p>Electron could not reach the Vite dev server at <code>${url}</code>.</p>
      <p>Start <code>bun run dev:ui</code>, wait until Vite prints the local URL, then restart <code>bun run dev</code>.</p>
    </main>
  </body>
</html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

async function loadRenderer(window: BrowserWindow) {
  const devUrl = rendererUrl();

  if (devUrl) {
    const serverReady = await waitForDevServer(devUrl);

    if (!serverReady) {
      console.error(`[ORCA-WINDOW] Vite dev server did not become ready: ${devUrl}`);
      await window.loadURL(devServerErrorPage(devUrl));
      window.show();
      return;
    }

    await window.loadURL(devUrl);
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  await window.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
}

export function createWindow() {
  const iconFile = isDev ? "icon-dev.png" : "icon.png";
  mainWindow = new BrowserWindow({
    width: 980,
    height: 660,
    icon: path.join(__dirname, "..", "..", "build", iconFile),
    minWidth: 400,
    minHeight: 450,
    titleBarStyle: "hiddenInset",
    transparent: process.platform === "darwin",
    roundedCorners: true,
    hasShadow: true,
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

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("[ORCA-WINDOW] Renderer load failed", {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[ORCA-WINDOW] Renderer process gone", details);
  });

  mainWindow.webContents.on("unresponsive", () => {
    console.error("[ORCA-WINDOW] Renderer became unresponsive");
  });

  mainWindow.once("ready-to-show", () => {
    console.log("[ORCA-WINDOW] ready-to-show");
    mainWindow?.show();
  });

  void loadRenderer(mainWindow).catch((error) => {
    console.error("[ORCA-WINDOW] Failed to load renderer", error);
    mainWindow?.show();
  });
}
