import { el } from '../core/utils.js';
import { HUD } from './HUD.js';
import { DiscoveryPanel, DialogueUI, InspectUI } from './Panels.js';
import { MenuUI } from './MenuUI.js';
import { platform } from '../core/platform.js';

/** Owns every DOM layer: HUD, panels, menu, title / loading / ending screens and screen effects. */
export class UIManager {
  constructor(game) {
    this.game = game;
    const root = this.root = document.getElementById('ui-root');
    this.hud = new HUD(root, game);
    this.discovery = new DiscoveryPanel(root, game);
    this.dialogue = new DialogueUI(root, game);
    this.inspect = new InspectUI(root, game);
    this.menu = new MenuUI(root, game);
    this.letterboxEl = el('div', { class: 'letterbox', style: 'position:absolute;inset:0' });
    this.titleCardEl = el('div', { class: 'title-card' }, [el('div', {}, [el('h1'), el('h2')])]);
    this.flashEl = el('div', { class: 'flash' });
    this.fadeEl = el('div', { class: 'fade' });
    this.loadingEl = this._loading();
    this.titleEl = el('div', { class: 'screen title-screen interactive hidden' });
    this.endingEl = el('div', { class: 'screen ending interactive hidden' });
    root.append(this.letterboxEl, this.titleCardEl, this.titleEl, this.endingEl, this.flashEl, this.fadeEl, this.loadingEl);
    this.hud.setVisible(false);
    this.ending = { show: (cb) => this.showEnding(cb) };
    game.events.on('language', () => { if (this._renderTitle && !this.titleEl.classList.contains('hidden')) this._renderTitle(); });
  }

  _loading() {
    const t = (k) => this.game.i18n.t(k);
    const e = el('div', { class: 'screen loading show' }, [
      el('div', { class: 'brand' }, [el('h1', { text: 'ANGKOR' }), el('div', { class: 'khmer km-title', text: 'អង្គរ' })]),
      el('div', { class: 'ornament', style: 'width:min(420px,70vw)' }),
      el('div', { class: 'bar' }, [el('i')]),
      el('div', { class: 'status' }, [el('span', { class: 'msg ui-text', text: t('loading.env') }), el('span', { class: 'pct', text: '0%' })]),
      el('div', { class: 'tip ui-text' }, [el('b', { text: t('loading.tip') }), el('span')]),
    ]);
    // rotate short tips while the temple streams in
    let i = Math.floor(Math.random() * 5);
    const tip = () => { e.querySelector('.tip span').textContent = t('tip.' + (1 + (i++ % 5))); };
    tip();
    this._tipTimer = setInterval(tip, 4500);
    return e;
  }

  setLoading(p, msgKey) {
    this.loadingEl.querySelector('.bar i').style.width = `${Math.round(p * 100)}%`;
    this.loadingEl.querySelector('.pct').textContent = `${this.game.i18n.num(Math.round(p * 100))}%`;
    if (msgKey) this.loadingEl.querySelector('.msg').textContent = this.game.i18n.t(msgKey);
  }

  hideLoading() {
    clearInterval(this._tipTimer);
    this.loadingEl.classList.remove('show');
    setTimeout(() => this.loadingEl.remove(), 1100);
  }

  /** First launch: pick English or Khmer before the title screen. */
  chooseLanguage(done) {
    const g = this.game;
    const pickEl = el('div', { class: 'screen lang-pick interactive' });
    const choose = (code) => {
      g.audio.start(); g.audio.ui('click');
      g.setLanguage(code);
      g.settings.set('languageChosen', true);
      pickEl.classList.remove('show');
      setTimeout(() => pickEl.remove(), 700);
      done();
    };
    const card = (code, name, sub, sample) => el('button', { class: 'lang-card', 'data-lang': code, onclick: () => choose(code), onmouseenter: () => g.audio.ui('hover') }, [
      el('span', { class: 'code', text: code === 'en' ? 'EN' : 'ខ្មែរ' }),
      el('span', { class: 'name', text: name }),
      el('span', { class: 'sample', text: sample }),
      el('span', { class: 'sub', text: sub }),
    ]);
    pickEl.append(
      el('div', { class: 'brand' }, [el('h1', { text: 'ANGKOR' }), el('div', { class: 'khmer km-title', text: 'អង្គរ' })]),
      el('div', { class: 'ornament', style: 'width:min(520px,80vw)' }),
      el('h2', {}, [el('span', { text: 'Choose your language' }), el('span', { class: 'khmer', text: 'ជ្រើសរើសភាសា' })]),
      el('div', { class: 'cards' }, [
        card('en', 'English', 'Play in English', 'Legacy of the Khmer Empire'),
        card('km', 'ភាសាខ្មែរ', 'លេងជាភាសាខ្មែរ', 'កេរដំណែលនៃចក្រភពខ្មែរ'),
      ]),
      el('p', { class: 'hint' }, [el('span', { text: 'You can change this any time in Settings.' }), el('span', { class: 'khmer', text: 'អ្នកអាចប្តូរភាសាបានគ្រប់ពេលក្នុងការកំណត់។' })]),
    );
    this.root.insertBefore(pickEl, this.flashEl);
    requestAnimationFrame(() => { pickEl.classList.add('show'); pickEl.querySelector(`[data-lang="${g.i18n.lang}"]`)?.focus(); });
    pickEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { pickEl.querySelector('.lang-card:not(:focus)')?.focus(); e.preventDefault(); }
    });
  }

  /** EN | ខ្មែរ switch used on the title screen and in the pause menu. */
  langSwitch(onChange) {
    const g = this.game;
    return el('div', { class: 'lang-switch interactive', role: 'group', 'aria-label': 'Language' }, [['en', 'EN'], ['km', 'ខ្មែរ']].map(([code, label]) =>
      el('button', { class: g.i18n.lang === code ? 'on' : '', text: label, 'aria-pressed': String(g.i18n.lang === code), lang: code,
        onclick: () => { if (g.i18n.lang !== code) { g.audio.ui('click'); g.setLanguage(code); onChange?.(); } } })));
  }

  showTitle({ canContinue, onNew, onContinue, onSettings }) {
    const g = this.game, t = (k, vars) => g.i18n.t(k, vars);
    const render = () => {
      this.titleEl.innerHTML = '';
      const btn = (key, fn, primary) => el('button', { class: 'btn' + (primary ? ' primary' : ''), text: t(key), onclick: () => { g.audio.start(); g.audio.ui('click'); fn(); }, onmouseenter: (e) => { g.audio.ui('hover'); e.currentTarget.focus({ preventScroll: true }); } });
      const buttons = el('div', { class: 'buttons' }, [
        canContinue() ? btn('title.continue', onContinue, true) : null,
        btn('title.new', onNew, !canContinue()),
        btn('title.settings', onSettings),
        platform.desktop ? btn('title.quit', () => platform.quit()) : null,
      ]);
      this.titleEl.append(
        el('div', { class: 'title-main' }, [
          el('h1', {}, ['ANGKOR', el('span', { class: 'km', text: 'អង្គរ · កេរដំណែលនៃចក្រភពខ្មែរ' })]),
          g.i18n.lang === 'km' ? null : el('h2', { text: t('game.subtitle') }),
          el('div', { class: 'ornament', style: 'width:260px;margin:14px 0 28px' }),
          buttons,
          el('div', { class: 'keys-hint ui-text', text: t('title.keys') }),
        ]),
        el('div', { class: 'foot ui-text' }, [el('span', { text: t('title.note') }), el('span', { class: 'ver', text: t('title.version', { v: g.i18n.num(platform.version) }) })]),
      );
      if (this.titleEl.classList.contains('show')) buttons.querySelector('.btn')?.focus({ preventScroll: true });
    };
    render();
    this._renderTitle = render;
    this.titleEl.classList.remove('hidden');
    requestAnimationFrame(() => { this.titleEl.classList.add('show'); this.titleEl.querySelector('.buttons .btn')?.focus({ preventScroll: true }); });
    if (!this._titleKeys) {
      // arrow keys / Enter move through the title buttons (gamepad-style navigation)
      this._titleKeys = (e) => {
        if (g.mode !== 'title' || this.titleEl.classList.contains('hidden')) return;
        const list = [...this.titleEl.querySelectorAll('.buttons .btn')];
        const i = list.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          const n = e.key === 'ArrowDown' ? 1 : -1;
          list[(i + n + list.length) % list.length]?.focus();
          g.audio.ui('hover');
          e.preventDefault();
        }
      };
      addEventListener('keydown', this._titleKeys);
    }
  }

  hideTitle() {
    this.titleEl.classList.remove('show');
    setTimeout(() => this.titleEl.classList.add('hidden'), 1000);
  }

  showEnding(cb) {
    const g = this.game, t = (k) => g.i18n.t(k);
    this.endingEl.innerHTML = '';
    this.endingEl.append(
      el('div', { class: 'ornament', style: 'width:240px' }),
      el('h1', { style: 'font-family:var(--serif);font-weight:400;font-size:44px;margin:10px 0', text: t('end.title') }),
      el('p', { class: 'ui-text', text: t('end.body') }),
      el('div', { class: 'credits ui-text', text: t('end.credits') }),
      el('div', { style: 'margin-top:24px' }, [el('button', { class: 'btn primary', text: t('end.continue'), onclick: () => {
        this.endingEl.classList.remove('show'); setTimeout(() => this.endingEl.classList.add('hidden'), 1000); cb?.();
      } })]),
    );
    this.endingEl.classList.remove('hidden');
    requestAnimationFrame(() => this.endingEl.classList.add('show'));
    g.input.releaseLock();
  }

  letterbox(on) { this.letterboxEl.classList.toggle('on', on); this.hud.setVisible(!on && this.game.mode !== 'title'); }

  titleCard(title, sub, seconds = 5) {
    const [h1, h2] = this.titleCardEl.firstChild.children;
    h1.textContent = title; h2.textContent = sub;
    this.titleCardEl.classList.add('show');
    clearTimeout(this._tc);
    this._tc = setTimeout(() => this.titleCardEl.classList.remove('show'), seconds * 1000);
  }

  fade(on, seconds = 1) {
    this.fadeEl.style.transition = `opacity ${seconds}s`;
    this.fadeEl.style.opacity = on ? '1' : '0';
    return new Promise((r) => setTimeout(r, seconds * 1000));
  }

  flash() {
    this.flashEl.style.transition = 'none'; this.flashEl.style.opacity = '0.8';
    requestAnimationFrame(() => { this.flashEl.style.transition = 'opacity .6s'; this.flashEl.style.opacity = '0'; });
  }
}
