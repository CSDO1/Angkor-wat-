// Small, explicit bridge from the game page to the desktop shell (no Node access in the page).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('angkorDesktop', {
  platform: process.platform,
  version: ipcRenderer.sendSync('app:version'),
  quit: () => ipcRenderer.send('app:quit'),
  setFullscreen: (on) => ipcRenderer.invoke('app:set-fullscreen', on),
  isFullscreen: () => ipcRenderer.invoke('app:is-fullscreen'),
  onFullscreen: (fn) => ipcRenderer.on('fullscreen', (_e, on) => fn(on)),
});
