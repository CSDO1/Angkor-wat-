import { el } from '../core/utils.js';
import { DISCOVERIES, RELIEFS, SOURCES } from '../data/history.js';
import { ARTIFACTS } from '../data/artifacts.js';
import { NPCS, QUESTS } from '../data/npcs.js';
import { CHAPTERS } from '../data/chapters.js';
import { PLACE_INFO, PEOPLE, CLAIMS, EVIDENCE, isUnlocked } from '../data/journal.js';
import { illustration } from './Illustrations.js';
import { MapUI } from './MapUI.js';
import { PRESET_VALUES } from '../systems/SettingsManager.js';
import { platform } from '../core/platform.js';

/**
 * Pause menu: Continue · Map · Angkor Journal · Artifacts · Objectives · Settings · Controls ·
 * Language · Save Game · Exit. Opening it pauses the simulation but keeps the world in memory.
 */
const clip = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
const tagClass = (e) => (e === 'history' ? 'research' : e === 'legend' || e === 'fiction' ? 'fiction' : 'interp');

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

  t(k, vars) { return this.game.i18n.t(k, vars); }
  p(o) { return this.game.i18n.pick(o); }

  show(tab = 'map', fromTitle = false) {
    this.tab = tab; this.fromTitle = fromTitle; this.detail = null;
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
          onclick: () => { g.audio.ui('click'); if (k === 'continue') g.closeMenu(); else { this.tab = k; this.detail = null; this.render(); } },
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
    const g = this.game, map = this.map;
    const size = Math.max(320, Math.min(720, innerHeight - 190, innerWidth - 560));
    const canvas = el('canvas', { width: size * 2, height: size * 2, class: 'map-canvas', 'data-k': 2, style: `width:${size}px;height:${size}px` });
    // drag = pan, wheel = zoom, click = set / remove waypoint
    let drag = null;
    const frac = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width]; };
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, f: frac(e), moved: false }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const f = frac(e);
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) drag.moved = true;
      if (drag.moved) { map.pan(f[0] - drag.f[0], f[1] - drag.f[1]); drag.f = f; }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (drag && !drag.moved) {
        const [u, v] = frac(e), w = map.unproject(u, v);
        const near = g.waypoint && Math.hypot(g.waypoint.x - w.x, g.waypoint.z - w.z) < map.view.span * 0.025;
        g.setWaypoint(near ? null : w);
        g.audio.ui('click');
        clearBtn.disabled = !g.waypoint;
      }
      drag = null;
    });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); const [u, v] = frac(e); map.zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, u, v); }, { passive: false });
    const tool = (text, title, fn) => el('button', { class: 'btn map-tool', text, title, 'aria-label': title, onclick: () => { g.audio.ui('click'); fn(); } });
    const clearBtn = tool('✕ ' + this.t('map.clearWaypoint'), this.t('map.clearWaypoint'), () => { g.setWaypoint(null); clearBtn.disabled = true; });
    clearBtn.disabled = !g.waypoint;
    const leg = (color, key, round) => el('div', {}, [el('i', { style: `background:${color}` + (round ? ';border-radius:50%;transform:none' : '') }), this.t(key)]);
    c.append(el('h2', { text: this.t('map.title') }),
      el('div', { class: 'map-wrap' }, [
        el('div', { class: 'map-stage' }, [canvas, el('div', { class: 'map-zoom' }, [
          tool('+', this.t('map.zoomIn'), () => map.zoom(1 / 1.35)), tool('−', this.t('map.zoomOut'), () => map.zoom(1.35)), tool('◎', this.t('map.center'), () => map.centerOnPlayer()),
        ])]),
        el('div', { class: 'legend' }, [
          el('div', {}, [el('i', { style: 'background:#fff' }), this.t('map.you')]),
          leg('#f0cf88', 'map.legend.objective', true), leg('#d9b36a', 'map.legend.place'),
          el('div', {}, [el('i', { style: 'background:transparent;border:1px solid rgba(217,179,106,.5)' }), this.t('map.legend.undiscovered')]),
          leg('#7fb07a', 'map.legend.artifact'), leg('#a8d8ff', 'map.legend.person', true), leg('#ff9d5c', 'map.legend.waypoint', true),
          el('div', { class: 'map-actions' }, [clearBtn]),
          el('p', { class: 'note', text: this.t('map.help') }),
        ]),
      ]));
    const loop = () => { map.draw(canvas); this.mapRaf = requestAnimationFrame(loop); };
    loop();
  }

  // -------------------------------------------------------------------------------- journal
  /** Primary-language name, with the other language underneath (the journal is bilingual by design). */
  names(o) {
    const km = this.game.i18n.lang === 'km';
    return { main: km ? o.km : o.en, other: km ? o.en : o.km };
  }

  tab_journal(c) {
    if (this.detail) return this._journalDetail(c);
    const g = this.game, pr = g.journal.progress(), num = (x) => g.i18n.num(x);
    const tabs = [['places', 'journal.locations', pr.places], ['reliefs', 'journal.reliefs', pr.reliefs], ['people', 'journal.people', pr.people], ['facts', 'journal.facts', pr.facts]];
    c.append(
      el('div', { class: 'journal-head' }, [
        el('h2', { text: this.t('menu.journal') }),
        el('div', { class: 'progress' }, [
          el('span', { text: this.t('journal.progress', { n: num(pr.total.n), of: num(pr.total.of) }) }),
          el('span', { class: 'pct', text: `${num(pr.total.pct)}%` }),
          el('div', { class: 'meter' }, [el('i', { style: `width:${pr.total.pct}%` })]),
        ]),
      ]),
      el('div', { class: 'tabs' }, tabs.map(([k, key, p]) => el('button', { class: this.journalTab === k ? 'active' : '', onclick: () => { g.audio.ui('click'); this.journalTab = k; this.render(); } }, [
        this.t(key), el('span', { class: 'count', text: `${num(p.n)}/${num(p.of)}` }),
      ]))),
    );
    const grid = el('div', { class: 'grid2 journal-grid' });
    c.append(grid);
    const open = (type, id) => { g.audio.ui('open'); this.detail = { type, id }; this.render(); this.el.querySelector('.content').scrollTop = 0; };

    if (this.journalTab === 'places') {
      for (const d of DISCOVERIES) {
        const found = g.discoveries.has(d.id);
        grid.append(found ? this._card({ illus: d.illus, name: d.name, sub: this.p(PLACE_INFO[d.id]?.where), text: this.p(d.history), onclick: () => open('place', d.id) }) : this._locked());
      }
    } else if (this.journalTab === 'reliefs') {
      for (const r of RELIEFS) {
        const found = g.reliefsFound.has(r.id);
        grid.append(found ? this._card({ illus: r.illus, name: r.name, sub: this.p(r.where), text: this.p(r.text), onclick: () => open('relief', r.id) }) : this._locked());
      }
    } else if (this.journalTab === 'people') {
      for (const e of PEOPLE) {
        grid.append(isUnlocked(g, e) ? this._card({ illus: e.illus, name: e.name, sub: this.p(e.period), text: this.p(e.text), tag: e.evidence, onclick: () => open('person', e.id) }) : this._locked());
      }
      const met = NPCS.filter((n) => g.flags.has('met_' + n.id));
      const quests = Object.entries(g.quests.quests);
      if (met.length || quests.length) {
        c.append(el('h3', { class: 'journal-sub', text: this.t('journal.metPeople') }));
        const g2 = el('div', { class: 'grid2' });
        for (const n of met) g2.append(el('div', { class: 'entry static' }, [el('h4', {}, [this.p(n.name), el('span', { class: 'tag fiction', text: this.t('journal.fictional') })]), el('p', { text: this.p(n.role) })]));
        for (const [id, q] of quests) g2.append(el('div', { class: 'entry static' }, [el('h4', { text: `${q.state === 'done' ? '✓ ' : ''}${this.p(QUESTS[id].name)}` }), el('p', { text: this.p(QUESTS[id].desc) })]));
        c.append(g2);
      }
    } else {
      for (const e of CLAIMS) {
        if (!isUnlocked(g, e)) { grid.append(this._locked()); continue; }
        grid.append(el('button', { class: 'entry claim-card', onclick: () => open('fact', e.id) }, [
          el('div', { class: 'kicker' }, [this.t('journal.claim'), el('span', { class: 'tag verdict-' + e.verdict, text: this.t('journal.verdict.' + e.verdict) })]),
          el('h4', { class: 'claim', text: `“${this.p(e.claim)}”` }),
          el('p', { text: clip(this.p(e.fact), 150) }),
        ]));
      }
      this._about(c);
    }
  }

  _card({ illus, name, sub, text, tag, onclick }) {
    const n = this.names(name);
    return el('button', { class: 'entry journal-card', onclick }, [
      el('div', { class: 'thumb' }, [el('img', { src: illustration(illus, 480, 170), alt: '' }), el('span', { class: 'status', text: '✓ ' + this.t('journal.discovered') })]),
      el('div', { class: 'body' }, [
        el('h4', {}, [n.main, tag ? el('span', { class: 'tag ' + tagClass(tag), text: this.p(EVIDENCE[tag]) }) : null]),
        el('div', { class: 'k', text: n.other }),
        sub ? el('div', { class: 'where', text: sub }) : null,
        el('p', { text: clip(text, 120) }),
      ]),
    ]);
  }

  _locked() {
    return el('div', { class: 'entry journal-card locked', 'aria-disabled': 'true' }, [
      el('div', { class: 'thumb' }, [el('span', { class: 'lock', text: '◇' })]),
      el('div', { class: 'body' }, [el('h4', { text: '— ' + this.t('journal.undiscovered') + ' —' })]),
    ]);
  }

  _journalDetail(c) {
    const g = this.game, { type, id } = this.detail;
    const back = el('button', { class: 'btn', text: this.t('journal.back'), onclick: () => { g.audio.ui('close'); this.detail = null; this.render(); } });
    const section = (h, text) => text ? [el('h3', { text: h }), el('p', { text })] : [];
    const meta = (rows) => el('div', { class: 'meta' }, rows.filter((r) => r[1]).flatMap(([k, v]) => [el('b', { text: k }), el('span', { text: v })]));
    let illus, name, body = [];
    if (type === 'place') {
      const d = DISCOVERIES.find((x) => x.id === id), info = PLACE_INFO[id] ?? {};
      illus = d.illus; name = d.name;
      body = [
        meta([[this.t('journal.period'), this.p(d.period)], [this.t('journal.location'), this.p(info.where)]]),
        ...section(this.t('journal.history'), this.p(d.history)),
        ...section(this.t('journal.significance'), this.p(d.architecture)),
        this._related(info.related ?? []),
      ];
    } else if (type === 'relief') {
      const r = RELIEFS.find((x) => x.id === id);
      illus = r.illus; name = r.name;
      body = [meta([[this.t('journal.period'), this.p({ en: 'First half of the 12th century', km: 'ពាក់កណ្តាលទីមួយនៃសតវត្សទី១២' })], [this.t('journal.location'), this.p(r.where)]]),
        ...section(this.t('journal.relief'), this.p(r.text)), this._related(['bas_reliefs'])];
    } else if (type === 'person') {
      const e = PEOPLE.find((x) => x.id === id);
      illus = e.illus; name = e.name;
      body = [meta([[this.t('journal.period'), this.p(e.period)], ['', '']]), el('div', {}, [el('span', { class: 'tag ' + tagClass(e.evidence), text: this.p(EVIDENCE[e.evidence]) })]),
        ...section(this.t('journal.history'), this.p(e.text)), this._related(e.unlock.filter((u) => DISCOVERIES.some((d) => d.id === u)))];
    } else {
      const e = CLAIMS.find((x) => x.id === id);
      illus = null; name = { en: this.t('journal.claim'), km: this.t('journal.claim') };
      body = [el('blockquote', { class: 'claim', text: `“${this.p(e.claim)}”` }), el('span', { class: 'tag verdict-' + e.verdict, text: this.t('journal.verdict.' + e.verdict) }),
        ...section(this.t('journal.fact'), this.p(e.fact)), this._related(e.unlock)];
    }
    const n = this.names(name);
    c.append(el('div', { class: 'journal-detail' }, [
      back,
      illus ? el('img', { class: 'hero', src: illustration(illus, 960, 300), alt: '' }) : null,
      el('h2', { text: type === 'fact' ? this.t('menu.journal') + ' · ' + this.t('journal.facts') : n.main }),
      type === 'fact' ? null : el('div', { class: 'kname', text: n.other }),
      el('div', { class: 'ornament', style: 'width:220px;margin:8px 0 14px' }),
      ...body,
    ]));
  }

  _related(ids) {
    const g = this.game;
    const items = ids.map((id) => DISCOVERIES.find((d) => d.id === id)).filter(Boolean);
    if (!items.length) return null;
    return el('div', { class: 'related' }, [el('h3', { text: this.t('journal.related') }), el('div', { class: 'chips' }, items.map((d) => {
      const found = g.discoveries.has(d.id);
      return el('button', { class: 'chip' + (found ? '' : ' locked'), disabled: !found, text: found ? this.p(d.name) : '— ' + this.t('journal.undiscovered') + ' —',
        onclick: () => { if (found) { g.audio.ui('click'); this.detail = { type: 'place', id: d.id }; this.render(); } } });
    }))]);
  }

  _about(c) {
    const g = this.game, km = g.i18n.lang === 'km';
    const fact = (h, items, cls) => el('div', { class: 'entry static' }, [el('h4', {}, [h, el('span', { class: 'tag ' + cls, text: this.t(cls === 'research' ? 'journal.researched' : 'journal.fictional') })]), el('ul', { class: 'about-list' }, items.map((i) => el('li', { text: i })))]);
    c.append(el('h3', { class: 'journal-sub', text: this.t('journal.about') }), el('div', { class: 'grid2' }, [
      fact(km ? 'ផ្អែកលើការស្រាវជ្រាវ' : 'Based on research', km
        ? ['អត្ថបទប្រវត្តិសាស្ត្រនៅសញ្ញាស្វែងយល់', 'ឈ្មោះ សម័យកាល និងការពិពណ៌នាចម្លាក់លៀន', 'មនុស្សនៃអង្គរ និងការពិត និងការប្រឌិត', 'សិលាចារឹកឆ្នាំ១៦៣២ នៅព្រះពាន់', 'ស្ថាបត្យកម្មនៃគំរូ (ប្រាង្គប្រាំ រោង ផ្លូវនាគ គូទឹក)']
        : ['History texts at the discovery markers', 'Names, periods and descriptions of the bas-reliefs', 'People of Angkor and Fact & Fiction entries', 'The 1632 inscription in the Preah Poan', 'The architecture of the model (five towers, galleries, naga causeway, moat)'], 'research'),
      fact(km ? 'ប្រឌិតសម្រាប់ហ្គេម' : 'Invented for the game', km
        ? ['តួអង្គដែលអ្នកជួប (សុខា ចាន់ធី វុធី ម៉ាយ៉ា)', 'ក្រុមអភិរក្ស និងគំរូសិក្សាដែលខ្ចាត់ខ្ចាយ', 'សញ្ញាស្ទង់ និងសញ្ញាភ្លឺ', 'ល្បែងផ្គុំទាំងបួន កញ្ចក់ កូនសោថ្ម និងទ្វារ', 'របាំងនៅជណ្តើរបាកាន']
        : ['The characters you meet (Sokha, Chanthy, Vuthy, Maya)', 'The conservation team and its scattered study replicas', 'Survey markers and glowing markers', 'All four puzzles, the mirror, the stone keys and the door', 'The barriers on the Bakan stairways'], 'fiction'),
      el('div', { class: 'entry static' }, [el('h4', { text: this.t('journal.sources') }), el('ul', { class: 'about-list' }, SOURCES.map((x) => el('li', { text: x })))]),
      el('div', { class: 'entry static' }, [el('p', { text: this.t('settings.subtitlesNote') })]),
    ]));
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
      el('h3', { text: this.t('settings.display') }),
      row('settings.fullscreen', el('input', { type: 'checkbox', checked: platform.desktop ? !!v.fullscreen : !!document.fullscreenElement, onchange: (e) => g.setFullscreen(e.target.checked) })),
      row('settings.vsync', check('vsync')),
      el('div', { class: 'note', text: this.t('settings.vsyncNote') }),
      row('settings.fpsLimit', select('fpsLimit', [[0, 'settings.unlimited'], [30, '30'], [60, '60'], [120, '120']])),
      rangeRow('settings.brightness', 'brightness', 0.6, 1.5, 0.05, pct),
      rangeRow('settings.uiScale', 'uiScale', 0.8, 1.3, 0.05, pct),
      row('settings.showFps', check('showFps')),
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
      row('settings.time', select('timeMode', [['story', 'settings.timeAuto'], ['sunrise', 'settings.sunrise'], ['day', 'settings.day'], ['sunset', 'settings.sunset'], ['night', 'settings.night']])),
    ]));
    c.append(el('div', { class: 'settings-group' }, [
      el('h3', { text: this.t('settings.camera') }),
      rangeRow('settings.sensitivity', 'sensitivity', 0.2, 3, 0.05, (x) => x.toFixed(2)),
      row('settings.invertY', check('invertY')),
      rangeRow('settings.fov', 'fov', 45, 90, 1, (x) => `${x}°`),
    ]));
    c.append(el('div', { class: 'settings-group' }, [
      el('h3', { text: this.t('settings.gameplay') }),
      row('settings.guidance', select('guidance', [['guided', 'settings.guided'], ['free', 'settings.free']])),
      row('settings.showObjective', check('showObjective')),
      row('settings.hints', check('hints')),
      row('settings.autosave', check('autosave')),
    ]));
    c.append(el('div', { class: 'settings-group' }, [
      el('h3', { text: this.t('settings.accessibility') }),
      row('settings.highContrast', check('highContrast')),
      row('settings.reducedMotion', check('reducedMotion')),
    ]));
    c.append(el('div', { class: 'settings-group' }, [
      el('h3', { text: this.t('settings.audio') }),
      rangeRow('settings.master', 'master', 0, 1, 0.05, pct), rangeRow('settings.music', 'music', 0, 1, 0.05, pct),
      rangeRow('settings.ambience', 'ambience', 0, 1, 0.05, pct), rangeRow('settings.sfx', 'sfx', 0, 1, 0.05, pct), rangeRow('settings.ui', 'ui', 0, 1, 0.05, pct),
    ]));
    c.append(el('div', { class: 'settings-actions' }, [el('button', { class: 'btn', text: this.t('settings.reset'), onclick: () => {
      s.reset(); g.audio.ui('click'); g.ui.hud.toast(this.t('settings.resetDone')); this.render();
    } })]));
    void PRESET_VALUES;
  }

  tab_controls(c) {
    const rows = [
      ['controls.move', 'W A S D', this.t('controls.lstick')], ['controls.look', this.t('controls.mouse'), this.t('controls.rstick')], ['controls.run', '—', this.t('controls.lstickFull')],
      ['controls.walk', 'V', this.t('controls.lstickHalf')], ['controls.sprint', 'Shift', 'L3'], ['controls.jump', 'Space', 'A'],
      ['controls.crouch', 'C', 'B'], ['controls.interact', 'E', 'X'], ['controls.inspect', 'F', 'Y'], ['controls.zoom', `${this.t('controls.wheel')} / − =`, this.t('controls.dpad')],
      ['controls.map', 'M', 'View'], ['controls.objectives', 'Tab', '—'], ['controls.journal', 'J', 'RB'], ['controls.menu', 'Esc / P', 'Menu'], ['controls.time', 'T', '—'],
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
