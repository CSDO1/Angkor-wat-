/**
 * Keyboard, mouse (pointer lock) and gamepad input, merged into one action state.
 * Systems read `input.axis`, `input.look`, `input.down(action)` and `input.pressed(action)`.
 */
const KEYMAP = {
  forward: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  sprint: ['ShiftLeft', 'ShiftRight'], walk: ['KeyV'], jump: ['Space'], crouch: ['KeyC'],
  interact: ['KeyE'], inspect: ['KeyF'], map: ['KeyM', 'Tab'], journal: ['KeyJ'], menu: ['Escape', 'KeyP'],
  confirm: ['Enter'], cancel: ['Escape', 'Backspace'], zoomIn: ['Equal'], zoomOut: ['Minus'], time: ['KeyT'],
};
// Standard gamepad mapping
const PAD = { jump: 0, crouch: 1, interact: 2, inspect: 3, walk: 4, sprint: 10, menu: 9, map: 8, journal: 5, confirm: 0, cancel: 1 };

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.prev = new Set();
    this.actions = new Set();
    this.prevActions = new Set();
    this.look = { x: 0, y: 0 };
    this.wheel = 0;
    this.axis = { x: 0, y: 0 };
    this.padIndex = null;
    this.usingPad = false;
    this.enabled = true;
    this.locked = false;
    this.dragLook = false;

    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      this.keys.add(e.code); this.usingPad = false;
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; });
    addEventListener('mousemove', (e) => {
      if (this.locked || this.dragLook) { this.look.x += e.movementX; this.look.y += e.movementY; }
    });
    canvas.addEventListener('mousedown', (e) => { if (!this.locked && e.button === 2) this.dragLook = true; });
    addEventListener('mouseup', (e) => { if (e.button === 2) this.dragLook = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    addEventListener('gamepadconnected', (e) => { this.padIndex = e.gamepad.index; });
    addEventListener('gamepaddisconnected', () => { this.padIndex = null; });
  }

  requestLock() {
    if (!this.locked && document.hasFocus()) this.canvas.requestPointerLock?.()?.catch?.(() => {});
  }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }

  /** Called once per frame before systems update. */
  poll() {
    this.prevActions = this.actions;
    this.actions = new Set();
    for (const [a, codes] of Object.entries(KEYMAP)) if (codes.some((c) => this.keys.has(c))) this.actions.add(a);

    let ax = (this.actions.has('right') ? 1 : 0) - (this.actions.has('left') ? 1 : 0);
    let ay = (this.actions.has('forward') ? 1 : 0) - (this.actions.has('back') ? 1 : 0);
    this.padLook = { x: 0, y: 0 };

    const pad = this.padIndex != null ? navigator.getGamepads?.()[this.padIndex] : null;
    if (pad) {
      const dz = (v) => (Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85);
      const lx = dz(pad.axes[0] ?? 0), ly = dz(pad.axes[1] ?? 0);
      const rx = dz(pad.axes[2] ?? 0), ry = dz(pad.axes[3] ?? 0);
      if (lx || ly || rx || ry || pad.buttons.some((b) => b.pressed)) this.usingPad = true;
      if (lx || ly) { ax = lx; ay = -ly; }
      this.padLook = { x: rx, y: ry };
      for (const [a, i] of Object.entries(PAD)) if (pad.buttons[i]?.pressed) this.actions.add(a);
      if (pad.buttons[12]?.pressed) this.actions.add('zoomIn');
      if (pad.buttons[13]?.pressed) this.actions.add('zoomOut');
    }
    const len = Math.hypot(ax, ay);
    if (len > 1) { ax /= len; ay /= len; }
    this.axis = { x: ax, y: ay };
  }

  endFrame() { this.look.x = 0; this.look.y = 0; this.wheel = 0; }

  down(a) { return this.enabled && this.actions.has(a); }
  pressed(a) { return this.enabled && this.actions.has(a) && !this.prevActions.has(a); }
  /** UI navigation keys work even while gameplay input is disabled. */
  uiPressed(a) { return this.actions.has(a) && !this.prevActions.has(a); }
}
