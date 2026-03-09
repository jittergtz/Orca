const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("orca", {
  auth: {
    getStatus: () => ipcRenderer.invoke("auth:get-status"),
    setupPin: (pin) => ipcRenderer.invoke("auth:setup-pin", pin),
    unlock: (pin) => ipcRenderer.invoke("auth:unlock", pin),
    lock: () => ipcRenderer.invoke("auth:lock")
  },
  notes: {
    list: () => ipcRenderer.invoke("notes:list"),
    create: () => ipcRenderer.invoke("notes:create"),
    update: (payload) => ipcRenderer.invoke("notes:update", payload),
    remove: (id) => ipcRenderer.invoke("notes:delete", id)
  },
  settings: {
    getTheme: () => ipcRenderer.invoke("settings:get-theme"),
    setTheme: (mode) => ipcRenderer.invoke("settings:set-theme", mode),
    getEffectiveTheme: () => ipcRenderer.invoke("settings:get-effective-theme"),
    changePin: (currentPin, nextPin) => ipcRenderer.invoke("settings:change-pin", currentPin, nextPin),
    setPinEnabled: (enabled) => ipcRenderer.invoke("settings:set-pin-enabled", enabled),
    verifyPin: (pin) => ipcRenderer.invoke("settings:verify-pin", pin)
  },
  onSystemThemeChanged: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("theme:system-changed", listener);
    return () => ipcRenderer.removeListener("theme:system-changed", listener);
  }
});

