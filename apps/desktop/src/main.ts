import { app, BrowserWindow } from "electron";
import { registerAuthHandlers } from "./handlers/auth";
import { registerSettingsHandlers } from "./handlers/settings";
import { registerNotesHandlers } from "./handlers/notes";
import { createWindow } from "./window";

function registerIpc() {
  registerAuthHandlers();
  registerSettingsHandlers();
  registerNotesHandlers();
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
  if (process.platform !== "darwin") {
    app.quit();
  }
});
