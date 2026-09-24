/**
 * Where the game is running. In the desktop app (Electron) the preload script exposes
 * `window.angkorDesktop`; in a browser it is undefined and the web fallbacks are used.
 */
const bridge = globalThis.angkorDesktop ?? null;

export const platform = {
  desktop: !!bridge,
  os: bridge?.platform ?? (/Mac/i.test(navigator.platform) ? 'darwin' : /Win/i.test(navigator.platform) ? 'win32' : 'web'),
  version: bridge?.version ?? __APP_VERSION__,
  quit() { bridge?.quit(); },
  setFullscreen(on) {
    if (bridge) return bridge.setFullscreen(on);
    if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen?.();
  },
  onFullscreen(fn) { bridge?.onFullscreen(fn); },
  isFullscreen() { return bridge ? bridge.isFullscreen() : Promise.resolve(!!document.fullscreenElement); },
};
