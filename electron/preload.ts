import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: Record<string, string>) =>
    ipcRenderer.invoke("save-settings", settings),
});
