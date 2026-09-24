import { el } from '../core/utils.js';
import { DISCOVERIES, RELIEFS, SOURCES } from '../data/history.js';
import { ARTIFACTS } from '../data/artifacts.js';
import { NPCS, QUESTS } from '../data/npcs.js';
import { CHAPTERS } from '../data/chapters.js';
import { illustration } from './Illustrations.js';
import { MapUI } from './MapUI.js';
import { PRESET_VALUES } from '../systems/SettingsManager.js';
import { platform } from '../core/platform.js';

/**
 * Pause menu: Continue · Map · Angkor Journal · Artifacts · Objectives · Settings · Controls ·
 * Language · Save Game · Exit. Opening it pauses the simulation but keeps the world in memory.
 */
const TABS = ['continue', 'map', 'journal', 'artifacts', 'objectives', 'settings', 'controls', 'language', 'save', 'exit'];

export class MenuUI {
  constructor(root, game) {
    this.game = game;
    this.el = el('div', { class: 'menu interactive hidden' });
    root.append(this.el);
    this.map = new MapUI(game);
    this.tab = 'map';
    this.journalTab = 'places';
    this.open = false;
    game.events.on('language', () => this.open && this.render());
  }

  t(k) { return this.game.i18n.t(k); }
  p(o) { return this.game.i18n.pick(o); }

  show(tab = 'map', fromTitle = false) {
    this.tab = tab; this.fromTitle = fromTitle;
    this.open = true;
    this.render();
    this.el.classList.remove('hidden');
    requestAnimationFrame(() => this.el.classList.add('show'));
    this.game.audio.ui('open');
  }

  hide() {
    this.open = false;
    this.el.classList.remove('show');
    setTimeout(() => { if (!this.open) this.el.classList.add('hidden'); }, 300);
    this.game.audio.ui('close');
    cancelAnimationFrame(this.mapRaf);
  }

  render() {
    const g = this.game;
    this.el.innerHTML = '';
    const nav = el('nav', {}, [
      el('div', { class: 'title', text: this.t('game.title') }),
      el('div', { class: 'subtitle', text: this.t('game.subtitle') }),
      ...TABS.filter((k) => !(this.fromTitle && ['continue', 'map', 'journal', 'artifacts', 'objectives', 'save', 'exit'].includes(k)))
        .map((k) => el('button', {
          class: this.tab === k ? 'active' : '', text: this.t('menu.' + k),
          onclick: () => { g.audio.ui('click'); if (k === 'continue') g.closeMenu(); else { this.tab = k; this.render(); } },
          onmouseenter: () => g.audio.ui('hover'),
        })),
      this.fromTitle ? el('button', { text: this.t('settings.back'), onclick: () => g.closeMenu() }) : null,
      el('div', { class: 'nav-foot' }, [
        el('div', { class: 'esc ui-text', text: this.t('menu.back') }),
      ]),
    ]);
    const content = el('div', { class: 'content ui-text' });
    this.el.append(nav, content);
    cancelAnimationFrame(this.mapRaf);
    (this['tab_' + this.tab] ?? this.tab_map).call(this, content);
  }

  // ------------------------------------------------------------------------------------ map
  tab_map(c) {
    const g = this.game;
    const size = Math.min(680, innerHeight - 170, innerWidth - 420);
    const canvas = el('canvas', { width: Math.max(320, size), height: Math.max(320, size) });
    const zoomBtn = el('button', { class: 'btn', text: this.map.zoomed ? '−' : '+', onclick: () => { this.map.zoomed = !this.map.zoomed; zoomBtn.textContent = this.map.zoomed ? '−' : '+'; } });
    const leg = (color, key) => el('div', {}, [el('i', { style: `background:${color}` }), this.t(key)]);
    c.append(el('h2', { text: this.t('map.title') }),
      el('div', { class: 'map-wrap' }, [canvas, el('div', { class: 'legend' }, [
        el('div', {}, [el('i', { style: 'background:#fff' }), this.t('map.you')]),
        leg('#d9b36a', 'map.legend.place'), leg('#f0cf88;border-radius:50%;transform:none', 'map.legend.objective'),
        leg('#7fb07a', 'map.legend.artifact'), leg('#a8d8ff;border-radius:50%;transform:none', 'map.legend.person'),
        el('div', { style: 'margin-top:10px' }, [zoomBtn]),
      ])]));
    const loop = () => { this.map.draw(canvas); this.mapRaf = requestAnimationFrame(loop); };
    loop();
    void g;
  }

  // -------------------------------------------------------------------------------- journal
  tab_journal(c) {
    const g = this.game;
    const tabs = [['places', 'journal.locations'], ['reliefs', 'journal.reliefs'], ['people', 'journal.people'], ['facts', 'journal.facts']];
    c.append(el('h2', { text: this.t('menu.journal') }),
      el('div', { class: 'tabs' }, tabs.map(([k, key]) => el('button', { class: this.journalTab === k ? 'active' : '', text: this.t(key), onclick: () => { this.journalTab = k; this.render(); } }))));
    const grid = el('div', { class: 'grid2' });
    c.append(grid);
    if (this.journalTab === 'places') {
      for (const d of DISCOVERIES) {
        const found = g.discoveries.has(d.id);
        grid.append(el('div', { class: 'entry' + (found ? '' : ' locked'), onclick: () => found && g.ui.discovery.show({
          title: this.p(d.name), khmer: d.khmer, period: this.p(d.period), history: this.p(d.history), architecture: this.p(d.architecture), illus: d.illus, isNew: false,
        }) }, found ? [
          el('h4', { text: this.p(d.name) }), el('div', { class: 'k', text: d.khmer }), el('p', { text: this.p(d.history).slice(0, 130) + '…' }),
        ] : [el('h4', { text: '— ' + this.t('journal.undiscovered') + ' —' })]));
      }
    } else if (this.journalTab === 'reliefs') {
      for (const r of RELIEFS) {
        const found = g.reliefsFound.has(r.id);
        grid.append(el('div', { class: 'entry' + (found ? '' : ' locked') }, found ? [
          el('img', { src: illustration(r.illus, 480, 180), style: 'width:100%;display:block;margin-bottom:8px;border:1px solid var(--line)' }),
          el('h4', { text: this.p(r.name) }), el('div', { class: 'k', text: this.p(r.where) }), el('p', { text: this.p(r.text) }),
        ] : [el('h4', { text: '— ' + this.t('journal.undiscovered') + ' —' })]));
      }
    } else if (this.journalTab === 'people') {
      for (const n of NPCS) {
        if (!g.flags.has('met_' + n.id)) continue;
        grid.append(el('div', { class: 'entry' }, [el('h4', {}, [this.p(n.name), el('span', { class: 'tag fiction', text: this.t('journal.fictional') })]), el('p', { text: this.p(n.role) })]));
      }
      for (const [id, q] of Object.entries(g.quests.quests)) {
        grid.append(el('div', { class: 'entry' }, [el('h4', { text: `${q.state === 'done' ? '✓ ' : ''}${this.p(QUESTS[id].name)}` }), el('p', { text: this.p(QUESTS[id].desc) })]));
      }
      if (!grid.children.length) grid.append(el('p', { text: this.t('journal.empty') }));
    } else {
      const fact = (h, items, cls) => el('div', { class: 'entry', style: 'cursor:default' }, [el('h4', {}, [h, el('span', { class: 'tag ' + cls, text: this.t(cls === 'research' ? 'journal.researched' : 'journal.fictional') })]), el('ul', { style: 'margin:6px 0 0 16px;padding:0;color:var(--text-dim);font-size:13px;line-height:1.6' }, items.map((i) => el('li', { text: i })))]);
      const km = g.i18n.lang === 'km';
      grid.append(
        fact(km ? 'ផ្អែកលើការស្រាវជ្រាវ' : 'Based on research', km
          ? ['អត្ថបទប្រវត្តិសាស្ត្រនៅសញ្ញាស្វែងយល់', 'ឈ្មោះ សម័យកាល និងការពិពណ៌នាចម្លាក់លៀន', 'បរិបទនៃប្រភេទវត្ថុបុរាណនីមួយៗ', 'សិលាចារឹកឆ្នាំ១៦៣២ នៅព្រះពាន់', 'ស្ថាបត្យកម្មនៃគំរូ (ប្រាង្គប្រាំ រោង ផ្លូវនាគ គូទឹក)']
          : ['History texts at the discovery markers', 'Names, periods and descriptions of the bas-reliefs', 'The context given for each artifact type', 'The 1632 inscription in the Preah Poan', 'The architecture of the model (five towers, galleries, naga causeway, moat)'], 'research'),
        fact(km ? 'ប្រឌិតសម្រាប់ហ្គេម' : 'Invented for the game', km
          ? ['តួអង្គទាំងអស់ (សុខា ចាន់ធី វុធី ម៉ាយ៉ា)', 'ក្រុមអភិរក្ស និងគំរូសិក្សាដែលខ្ចាត់ខ្ចាយ', 'សញ្ញាស្ទង់ និងសញ្ញាភ្លឺ', 'ល្បែងផ្គុំទាំងបួន កញ្ចក់ កូនសោថ្ម និងទ្វារ', 'របាំងនៅជណ្តើរបាកាន']
          : ['All characters (Sokha, Chanthy, Vuthy, Maya)', 'The conservation team and its scattered study replicas', 'Survey markers and glowing markers', 'All four puzzles, the mirror, the stone keys and the door', 'The barriers on the Bakan stairways'], 'fiction'),
        el('div', { class: 'entry', style: 'cursor:default' }, [el('h4', { text: this.t('journal.sources') }), el('ul', { style: 'margin:6px 0 0 16px;padding:0;color:var(--text-dim);font-size:13px;line-height:1.6' }, SOURCES.map((s) => el('li', { text: s })))]),
        el('div', { class: 'entry', style: 'cursor:default' }, [el('p', { text: this.t('settings.subtitlesNote') })]),
      );
    }
  }

  // ------------------------------------------------------------------------------ artifacts
  tab_artifacts(c) {
    const g = this.game;
    c.append(el('h2', { text: this.t('menu.artifacts') }), el('div', { class: 'sub', text: `${g.i18n.num(g.artifacts.mainCount())} / ${g.i18n.num(g.artifacts.mainTotal)}` }));
    const grid = el('div', { class: 'grid2' });
    for (const a of ARTIFACTS) {
      const found = g.artifacts.collected.has(a.id);
      if (!found && a.secret) continue;   // secrets stay hidden until found
      grid.append(el('div', { class: 'entry' + (found ? '' : ' locked'), onclick: () => { if (found) { g.closeMenu(); g.openInspector(a); } } }, found ? [
        el('h4', { text: this.p(a.name) }), el('div', { class: 'k', text: this.p(a.category) }), el('p', { text: this.p(a.context).slice(0, 140) + '…' }),
      ] : [el('h4', { text: '— ' + this.t('journal.undiscovered') + ' —' }), el('div', { class: 'k', text: this.p(a.category) })]));
    }
    c.append(grid);
  }

  // ----------------------------------------------------------------------------- objectives
  tab_objectives(c) {
    const g = this.game;
    c.append(el('h2', { text: this.t('menu.objectives') }));
    CHAPTERS.forEach((ch, i) => {
      const done = i < g.objectives.chapterIndex || g.objectives.finished;
      const current = i === g.objectives.chapterIndex && !g.objectives.finished;
      if (i > g.objectives.chapterIndex && !g.objectives.finished) return;
      c.append(el('div', { class: 'settings-group' }, [
        el('h3', { text: this.p(ch.title) + (done ? ' — ' + this.t('objectives.done') : current ? ' — ' + this.t('objectives.current') : '') }),
        ...ch.objectives.map((o) => {
          const st = o.check(g);
          const ok = done || g.objectives.completed.has(o.id);
          return el('div', { class: 'row', style: 'grid-template-columns:24px 1fr auto' }, [
            el('span', { text: ok ? '◆' : '◇', style: 'color:var(--gold)' }), el('span', { text: this.p(o.text) }),
            el('span', { class: 'val', text: st.of ? `${g.i18n.num(st.n)}/${g.i18n.num(st.of)}` : '' }),
          ]);
        }),
      ]));
    });
    const qs = Object.entries(g.quests.quests);
    if (qs.length) c.append(el('div', { class: 'settings-group' }, [el('h3', { text: this.t('objectives.optional') }),
      ...qs.map(([id, q]) => el('div', { class: 'row', style: 'grid-template-columns:24px 1fr auto' }, [
        el('span', { text: q.state === 'done' ? '◆' : '◇', style: 'color:#a8d8ff' }), el('span', { text: `${this.p(QUESTS[id].name)} — ${this.p(QUESTS[id].desc)}` }),
        el('span', { class: 'val', text: `${g.i18n.num(q.n)}/${g.i18n.num(QUESTS[id].goal)}` })]))]));
  }

  // ------------------------------------------------------------------------------- settings
  tab_settings(c) {
    const g = this.game, s = g.settings, v = s.values;
    const row = (label, control, val = '') => el('div', { class: 'row' }, [el('label', { text: this.t(label) }), control, el('span', { class: 'val', text: val })]);
    const select = (key, opts, onChange) => {
      const sel = el('select', { onchange: (e) => { const x = opts.find((o) => String(o[0]) === e.target.value)[0]; onChange ? onChange(x) : s.set(key, x); g.audio.ui('click'); this.render(); } },
        opts.map(([val, label]) => el('option', { value: String(val), text: label.startsWith('settings.') ? this.t(label) : label, selected: String(v[key]) === String(val) })));
      return sel;
    };
    const range = (key, min, max, step, fmt = (x) => x) => {
      const out = el('span', { class: 'val', text: fmt(v[key]) });
      const inp = el('input', { type: 'range', min, max, step, value: v[key], oninput: (e) => { out.textContent = fmt(+e.target.value); }, onchange: (e) => { s.set(key, +e.target.value); } });
      return [inp, out];
    };
    const check = (key) => el('input', { type: 'checkbox', checked: !!v[key], onchange: (e) => s.set(key, e.target.checked) });
    const rangeRow = (label, key, min, max, step, fmt) => { const [i, o] = range(key, min, max, step, fmt); return el('div', { class: 'row' }, [el('label', { text: this.t(label) }), i, o]); };
    const pct = (x) => `${Math.round(x * 100)}%`;

    c.append(el('h2', { text: this.t('menu.settings') }));
    // language first, so English / Khmer is one click away from the title screen and the pause menu
    c.append(el('div', { class: 'settings-group' }, [
      el('h3', { text: this.t('menu.language') }),
      el('div', { class: 'row', style: 'grid-template-columns:220px 1fr' }, [
        el('label', { text: 'Language · ភាសា' }),
        el('div', {}, [g.ui.langSwitch(() => this.render())]),
      ]),
    ]));
    c.append(el('div', { class: 'settings-group' }, [
      el('h3', { text: this.t('settings.graphics') }),
      row('settings.preset', select('preset', [['low', 'settings.low'], ['medium', 'settings.medium'], ['high', 'settings.high'], ['ultra', 'settings.ultra'], ['custom', 'settings.custom']],
        (x) => x !== 'custom' && s.applyPreset(x))),
      rangeRow('settings.resolution', 'resolution', 0.5, 1, 0.05, pct),
      row('settings.texture', select('texture', [[0, 'settings.low'], [1, 'settings.medium'], [2, 'settings.high']])),
      row('settings.shadows', select('shadows', [[0, 'settings.off'], [1, 'settings.low'], [2, 'settings.medium'], [3, 'settings.high']])),
      row('settings.aa', select('aa', [['off', 'settings.off'], ['fxaa', 'settings.fxaa'], ['msaa', 'settings.msaa']])),
      row('settings.ao', select('ao', [['off', 'settings.off'], ['baked', 'settings.baked'], ['ssao', 'settings.bakedSsao']])),
      row('settings.reflections', select('reflections', [[0, 'settings.off'], [1, 'settings.low'], [2, 'settings.medium'], [3, 'settings.high']])),
      rangeRow('settings.vegetation', 'vegetation', 0.2, 1, 0.05, pct),
      rangeRow('settings.viewDistance', 'viewDistance', 600, 3200, 100, (x) => `${x} m`),
      row('settings.occlusion', check('occlusion')),
      row('settings.vsync', check('vsync')),
      el('div', { class: 'note', text: this.t('settings.vsyncNote') }),
      row('settings.fpsLimit', select('fpsLimit', [[0, 'settings.unlimited'], [30, '30'], [60, '60'], [120, '120']])),
      row('settings.fullscreen', el('input', { type: 'checkbox', checked: platform.desktop ? !!v.fullscreen : !!document.fullscreenElement, onchange: (e) => g.setFullscreen(e.target.checked) })),
      row('settings.showFps', check('showFps')),
      row('settings.time', select('timeMode', [['story', 'settings.timeAuto'], ['sunrise', 'settings.sunrise'], ['day', 'settings.day'], ['sunset', 'settings.sunset'], ['night', 'settings.night']])),
    ]));
    c.append(el('div', { class: 'settings-group' }, [
      el('h3', { text: this.t('settings.camera') }),
      rangeRow('settings.sensitivity', 'sensitivity', 0.2, 3, 0.05, (x) => x.toFixed(2)),
      row('settings.invertY', check('invertY')),
      rangeRow('settings.fov', 'fov', 45, 90, 1, (x) => `${x}°`),
    ]));
    c.append(el('div', { class: 'settings-group' }, [
      el('h3', { text: this.t('settings.audio') }),
      rangeRow('settings.master', 'master', 0, 1, 0.05, pct), rangeRow('settings.music', 'music', 0, 1, 0.05, pct),
      rangeRow('settings.ambience', 'ambience', 0, 1, 0.05, pct), rangeRow('settings.sfx', 'sfx', 0, 1, 0.05, pct), rangeRow('settings.ui', 'ui', 0, 1, 0.05, pct),
    ]));
    void PRESET_VALUES;
  }

  tab_controls(c) {
    const rows = [
      ['controls.move', 'W A S D', this.t('controls.lstick')], ['controls.look', this.t('controls.mouse'), this.t('controls.rstick')], ['controls.run', '—', this.t('controls.lstickFull')],
      ['controls.walk', 'V', this.t('controls.lstickHalf')], ['controls.sprint', 'Shift', 'L3'], ['controls.jump', 'Space', 'A'],
      ['controls.crouch', 'C', 'B'], ['controls.interact', 'E', 'X'], ['controls.inspect', 'F', 'Y'], ['controls.zoom', `${this.t('controls.wheel')} / − =`, this.t('controls.dpad')],
      ['controls.map', 'M / Tab', 'View'], ['controls.journal', 'J', 'RB'], ['controls.menu', 'Esc / P', 'Menu'], ['controls.time', 'T', '—'],
    ];
    c.append(el('h2', { text: this.t('menu.controls') }), el('table', { class: 'controls-table' }, [
      el('tr', {}, [el('th', { text: '' }), el('th', { text: this.t('controls.keyboard') }), el('th', { text: this.t('controls.gamepad') })]),
      ...rows.map(([k, a, b]) => el('tr', {}, [el('td', { text: this.t(k) }), el('td', {}, [el('kbd', { text: a })]), el('td', {}, [el('kbd', { text: b })])])),
    ]));
  }

  tab_language(c) {
    const g = this.game;
    c.append(el('h2', { text: this.t('menu.language') }));
    c.append(el('div', { class: 'cards lang-cards' }, [['en', 'English', 'Legacy of the Khmer Empire'], ['km', 'ភាសាខ្មែរ', 'កេរដំណែលនៃចក្រភពខ្មែរ']].map(([code, name, sample]) =>
      el('button', { class: 'lang-card' + (g.i18n.lang === code ? ' on' : ''), lang: code, onclick: () => { g.audio.ui('click'); g.setLanguage(code); this.render(); } }, [
        el('span', { class: 'code', text: code === 'en' ? 'EN' : 'ខ្មែរ' }), el('span', { class: 'name', text: name }), el('span', { class: 'sample', text: sample }),
      ]))));
    c.append(el('p', { class: 'note', text: this.t('settings.subtitlesNote') }));
  }

  tab_save(c) {
    const g = this.game;
    const locale = g.i18n.lang === 'km' ? 'km-KH' : undefined;
    const fmt = (info) => info ? `${this.t('menu.savedAt')} ${g.i18n.num(info.savedAt.toLocaleString(locale))} · ${this.p(CHAPTERS[info.chapter]?.title)} · ◆ ${g.i18n.num(info.artifacts)}` : this.t('menu.empty');
    c.append(el('h2', { text: this.t('menu.save') }));
    const m = g.save.info('manual'), a = g.save.info('auto');
    c.append(el('div', { class: 'settings-group' }, [
      el('div', { class: 'row', style: 'grid-template-columns:1fr auto' }, [el('span', {}, [el('b', { text: this.t('menu.manualSlot') }), el('br'), fmt(m)]),
        el('button', { class: 'btn primary', text: this.t('menu.saveManual'), onclick: () => { g.save.save('manual'); g.audio.ui('save'); this.render(); } })]),
      el('div', { class: 'row', style: 'grid-template-columns:1fr auto' }, [el('span', { text: '' }),
        el('button', { class: 'btn', text: this.t('menu.loadManual'), disabled: !m, onclick: () => m && g.loadGame('manual') })]),
      el('div', { class: 'row', style: 'grid-template-columns:1fr auto' }, [el('span', {}, [el('b', { text: this.t('menu.autoSlot') }), el('br'), fmt(a)]),
        el('button', { class: 'btn', text: this.t('menu.loadAuto'), disabled: !a, onclick: () => a && g.loadGame('auto') })]),
    ]));
  }

  tab_exit(c) {
    const g = this.game;
    c.append(el('h2', { text: this.t('menu.exit') }), el('p', { text: this.t('menu.exitConfirm') }),
      el('div', { style: 'display:flex;gap:10px' }, [
        el('button', { class: 'btn primary', text: this.t('menu.yes'), onclick: () => g.exitToTitle() }),
        el('button', { class: 'btn', text: this.t('menu.no'), onclick: () => { this.tab = 'map'; this.render(); } }),
      ]));
  }
}
