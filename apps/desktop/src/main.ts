import { app, BrowserWindow } from "electron";
import * as http from "http";
import * as path from "path";
import { registerAuthHandlers } from "./handlers/auth";
import { registerSettingsHandlers } from "./handlers/settings";
import { registerNotesHandlers } from "./handlers/notes";
import { createWindow, getMainWindow } from "./window";

// ── Constants ────────────────────────────────────────────────────────────────
const OAUTH_PROTOCOL = "orcadesktop";
/** Port for the local OAuth redirect server (dev mode only). */
export const DEV_OAUTH_PORT = 54321;
/** Whether we're in dev mode (electron . --dev). */
const isDev = process.argv.includes("--dev") || process.env.NODE_ENV === "development";
let pendingOAuthUrl: string | null = null;

// ── Diagnostic startup log ───────────────────────────────────────────────────
console.log("[ORCA-MAIN] ════ Process starting ════");
console.log("[ORCA-MAIN] PID        :", process.pid);
console.log("[ORCA-MAIN] isDev      :", isDev);
console.log("[ORCA-MAIN] execPath   :", process.execPath);
console.log("[ORCA-MAIN] argv       :", JSON.stringify(process.argv));

// ── Scope the single-instance lock to OUR app ────────────────────────────────
app.setName("Orca");
if (isDev) {
  const devUserData = path.join(app.getPath("appData"), "OrcaDesktop-dev");
  app.setPath("userData", devUserData);
  console.log("[ORCA-MAIN] userData   :", devUserData);
}

const isPrimaryInstance = app.requestSingleInstanceLock();
console.log("[ORCA-MAIN] isPrimary  :", isPrimaryInstance);

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractOAuthUrl(argv: string[]) {
  return (
    argv.find(
      (arg) => typeof arg === "string" && arg.startsWith(`${OAUTH_PROTOCOL}://`)
    ) ?? null
  );
}

function dispatchOAuthUrl(url: string) {
  console.log("[ORCA-MAIN] dispatchOAuthUrl →", url.slice(0, 120));
  const win = getMainWindow();
  if (!win || win.isDestroyed()) {
    console.log("[ORCA-MAIN] window not ready — storing as pendingOAuthUrl");
    pendingOAuthUrl = url;
    return;
  }
  console.log("[ORCA-MAIN] sending auth:oauth-callback to renderer");
  win.webContents.send("auth:oauth-callback", url);
  if (win.isMinimized()) win.restore();
  win.focus();
}

/**
 * Dev-mode only: starts a local HTTP server that acts as the OAuth redirect
 * target. When Supabase redirects to http://localhost:54321/auth/callback,
 * the server forwards the URL to the renderer via IPC.
 *
 * This avoids the custom-protocol registration problems that make deep links
 * unreliable in unpackaged Electron (all Electron builds share the same
 * macOS bundle ID, so orcadesktop:// can be routed to the wrong process).
 */
function startDevOAuthServer() {
  const server = http.createServer((req, res) => {
    const rawUrl = req.url ?? "/";
    console.log("[ORCA-OAUTH-SERVER] request:", rawUrl, req.method);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === "POST" && rawUrl === "/forward") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", () => {
        console.log("[ORCA-OAUTH-SERVER] POST /forward received full URL:", body);
        try {
          const parsed = new URL(body);
          dispatchOAuthUrl(parsed.toString());
        } catch (e) {
          console.error("Invalid forwarded URL:", body);
        }
        res.writeHead(200);
        res.end("ok");
      });
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8"><title>Orca — signed in</title>
  <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;
  justify-content:center;height:100vh;margin:0;background:#0b0c11;color:#fff}</style>
  </head>
  <body>
    <div style="text-align:center">
      <p style="font-size:1.5rem;font-weight:600">✓ Signed in to Orca</p>
      <p style="opacity:.6;margin-top:.5rem">You can close this tab.</p>
    </div>
    <script>
      fetch('http://localhost:${DEV_OAUTH_PORT}/forward', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: window.location.href
      }).then(() => {
        setTimeout(() => window.close(), 800);
      }).catch(err => console.error(err));
    </script>
  </body>
</html>`
    );
  });

  server.on("error", (err) => {
    console.error("[ORCA-OAUTH-SERVER] error:", err.message);
  });

  server.listen(DEV_OAUTH_PORT, "127.0.0.1", () => {
    console.log(
      `[ORCA-OAUTH-SERVER] listening on http://localhost:${DEV_OAUTH_PORT}`
    );
  });

  return server;
}

function registerIpc() {
  registerAuthHandlers();
  registerSettingsHandlers();
  registerNotesHandlers();
}

function registerOAuthProtocol() {
  if ((process as any).defaultApp && process.argv[1]) {
    const scriptPath = path.resolve(process.argv[1]);
    console.log("[ORCA-MAIN] setAsDefaultProtocolClient (dev):", scriptPath);
    app.setAsDefaultProtocolClient(OAUTH_PROTOCOL, process.execPath, [scriptPath]);
    return;
  }
  console.log("[ORCA-MAIN] setAsDefaultProtocolClient (prod)");
  app.setAsDefaultProtocolClient(OAUTH_PROTOCOL);
}

// ── Single-instance gate ─────────────────────────────────────────────────────
if (!isPrimaryInstance) {
  console.log("[ORCA-MAIN] NOT primary — checking argv for OAuth URL then quitting");
  const urlInArgv = extractOAuthUrl(process.argv);
  console.log("[ORCA-MAIN] OAuth URL in argv:", urlInArgv ?? "(none)");
  app.quit();
} else {
  // Register open-url BEFORE whenReady so deep-links fired at startup on
  // macOS are captured into pendingOAuthUrl rather than silently dropped.
  app.on("open-url", (event, url) => {
    event.preventDefault();
    console.log("[ORCA-MAIN] ★ open-url fired:", url.slice(0, 120));
    if (url.startsWith(`${OAUTH_PROTOCOL}://`)) {
      dispatchOAuthUrl(url);
    }
  });

  app.on("second-instance", (_event, commandLine) => {
    console.log("[ORCA-MAIN] ★ second-instance fired:", JSON.stringify(commandLine));
    const url = extractOAuthUrl(commandLine);
    console.log("[ORCA-MAIN] OAuth URL in second-instance:", url ?? "(none)");
    if (url) {
      dispatchOAuthUrl(url);
    }
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    console.log("[ORCA-MAIN] app ready");
    registerOAuthProtocol();
    registerIpc();
    createWindow();

    // Start local HTTP OAuth server in dev mode
    if (isDev) {
      startDevOAuthServer();
    }

    const startupUrl = extractOAuthUrl(process.argv);
    if (startupUrl) {
      dispatchOAuthUrl(startupUrl);
    }
    if (pendingOAuthUrl) {
      console.log("[ORCA-MAIN] flushing pendingOAuthUrl");
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
    console.log("[ORCA-MAIN] window-all-closed");
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
