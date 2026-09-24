// Desktop shell (macOS + Windows). Serves the Vite build from a private app:// origin so fetch(),
// GLB loading and localStorage saves all work exactly as on the web, fully offline.
const { app, BrowserWindow, Menu, ipcMain, protocol, net, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'app';
const ROOT = path.join(__dirname, '..', 'dist');
const DEV_URL = process.env.ANGKOR_DEV_URL;   // e.g. http://127.0.0.1:5173 for live reload while developing

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1024, minHeight: 640,
    backgroundColor: '#070605',
    title: 'ANGKOR: Legacy of the Khmer Empire',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(ROOT, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false,
    },
  });
  win.once('ready-to-show', () => win.show());
  win.on('enter-full-screen', () => win.webContents.send('fullscreen', true));
  win.on('leave-full-screen', () => win.webContents.send('fullscreen', false));

  // F11 toggles fullscreen on every platform (macOS also gets ⌃⌘F from the View menu)
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  // the game never navigates; links such as sources open in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(`${SCHEME}://`) && !(DEV_URL && url.startsWith(DEV_URL))) e.preventDefault(); });

  win.loadURL(DEV_URL || `${SCHEME}://angkor/index.html`);
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { label: 'View', submenu: [
      { role: 'togglefullscreen' },
      { type: 'separator' },
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
      ...(!app.isPackaged ? [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }] : []),
    ] },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  protocol.handle(SCHEME, (req) => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
    if (!file.startsWith(ROOT)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });

  ipcMain.on('app:version', (e) => { e.returnValue = app.getVersion(); });
  ipcMain.on('app:quit', () => app.quit());
  ipcMain.handle('app:set-fullscreen', (_e, on) => { win?.setFullScreen(!!on); return !!on; });
  ipcMain.handle('app:is-fullscreen', () => !!win?.isFullScreen());

  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on('window-all-closed', () => app.quit());
