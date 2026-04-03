import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("orca", {
  auth: {
    getStatus: () => ipcRenderer.invoke("auth:get-status"),
    setupPin: (pin: string) => ipcRenderer.invoke("auth:setup-pin", pin),
    unlock: (pin: string) => ipcRenderer.invoke("auth:unlock", pin),
    lock: () => ipcRenderer.invoke("auth:lock")
  },
  notes: {
    list: () => ipcRenderer.invoke("notes:list"),
    create: () => ipcRenderer.invoke("notes:create"),
    update: (payload: any) => ipcRenderer.invoke("notes:update", payload),
    remove: (id: string) => ipcRenderer.invoke("notes:delete", id)
  },
  settings: {
    getTheme: () => ipcRenderer.invoke("settings:get-theme"),
    setTheme: (mode: string) => ipcRenderer.invoke("settings:set-theme", mode),
    getEffectiveTheme: () => ipcRenderer.invoke("settings:get-effective-theme"),
    changePin: (currentPin: string, nextPin: string) => ipcRenderer.invoke("settings:change-pin", currentPin, nextPin),
    setPinEnabled: (enabled: boolean) => ipcRenderer.invoke("settings:set-pin-enabled", enabled),
    verifyPin: (pin: string) => ipcRenderer.invoke("settings:verify-pin", pin),
    openExternal: (url: string) => ipcRenderer.invoke("settings:open-external", url)
  },
  onSystemThemeChanged: (callback: (theme: string) => void) => {
    const listener = (_event: IpcRendererEvent, value: string) => callback(value);
    ipcRenderer.on("theme:system-changed", listener);
    return () => ipcRenderer.removeListener("theme:system-changed", listener);
  },
  onOAuthCallback: (callback: (url: string) => void) => {
    const listener = (_event: IpcRendererEvent, value: string) => callback(value);
    ipcRenderer.on("auth:oauth-callback", listener);
    return () => ipcRenderer.removeListener("auth:oauth-callback", listener);
  }
});
