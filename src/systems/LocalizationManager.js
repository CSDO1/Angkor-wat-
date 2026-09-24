import en from '../localization/en.js';
import km from '../localization/km.js';

const TABLES = { en, km };

/** English + Khmer strings. `t(key)` for UI keys, `pick({en, km})` for content objects. */
export class LocalizationManager {
  constructor(events) {
    this.events = events;
    this.lang = 'en';
  }

  setLanguage(lang) {
    if (!TABLES[lang] || lang === this.lang) return;
    this.lang = lang;
    document.documentElement.lang = lang;
    document.body.classList.toggle('lang-km', lang === 'km');
    this.events.emit('language', lang);
  }

  t(key, vars) {
    let s = TABLES[this.lang][key] ?? TABLES.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  }

  pick(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[this.lang] ?? obj.en ?? '';
  }

  /** Khmer numerals for counters when playing in Khmer. */
  num(n) {
    if (this.lang !== 'km') return String(n);
    return String(n).replace(/[0-9]/g, (d) => '០១២៣៤៥៦៧៨៩'[d]);
  }
}
