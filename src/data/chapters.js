/**
 * Story chapters and their objectives. `check(g)` returns progress {done, n?, of?}.
 * `time` is the lighting preset the world drifts toward (slowly) during the chapter.
 */
const inArea = (g, x0, x1, z0, z1, yMin = -99) => {
  const p = g.player.position;
  return p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1 && p.y > yMin;
};

export const CHAPTERS = [
  {
    id: 'arrival', time: 'sunrise',
    title: { en: 'Chapter 1 — Arrival', km: 'ជំពូកទី១ — ការមកដល់' },
    objectives: [
      {
        id: 'explore_entrance', text: { en: 'Explore the entrance to Angkor Wat', km: 'រុករកច្រកចូលអង្គរវត្ត' },
        hint: 'hint.interact',
        check: (g) => ({ done: g.discoveries.has('angkor_wat') }),
      },
      {
        id: 'cross_causeway', text: { en: 'Cross the ancient causeway', km: 'ឆ្លងកាត់ផ្លូវបុរាណ' },
        check: (g) => ({ done: inArea(g, -30, 30, 440, 458) || inArea(g, -400, 400, -290, 452) }),
      },
    ],
  },
  {
    id: 'gateway', time: 'sunrise',
    title: { en: 'Chapter 2 — Gateway', km: 'ជំពូកទី២ — ខ្លោងទ្វារ' },
    objectives: [
      {
        id: 'explore_west_entrance', text: { en: 'Explore the western entrance', km: 'រុករកច្រកចូលខាងលិច' },
        sub: [
          { en: 'Discover the western gateway', km: 'ស្វែងយល់ពីខ្លោងទ្វារខាងលិច', check: (g) => g.discoveries.has('west_gopura') },
          { en: 'Pass through onto the Naga causeway', km: 'ឆ្លងកាត់ទៅផ្លូវនាគ', check: (g) => inArea(g, -12, 12, 130, 434, 1.0) },
        ],
        check: (g) => ({ done: g.discoveries.has('west_gopura') && g.flags.has('through_gopura') }),
      },
    ],
  },
  {
    id: 'stories', time: 'day',
    title: { en: 'Chapter 3 — Stories in Stone', km: 'ជំពូកទី៣ — រឿងរ៉ាវក្នុងថ្ម' },
    objectives: [
      {
        id: 'find_reliefs', text: { en: 'Find the hidden bas-relief markers', km: 'រកសញ្ញាចម្លាក់លៀនដែលលាក់' },
        hint: 'hint.reliefs',
        check: (g) => ({ n: g.reliefsFound.size, of: 4, done: g.reliefsFound.size >= 4 }),
      },
    ],
  },
  {
    id: 'echoes', time: 'day',
    title: { en: 'Chapter 4 — Echoes of Angkor', km: 'ជំពូកទី៤ — សំឡេងបន្លឺនៃអង្គរ' },
    objectives: [
      {
        id: 'recover_artifacts', text: { en: 'Recover 5 historical artifacts', km: 'ប្រមូលវត្ថុបុរាណប្រវត្តិសាស្ត្រ ៥' },
        check: (g) => ({ n: g.artifacts.mainCount(), of: 5, done: g.artifacts.mainCount() >= 5 }),
      },
    ],
  },
  {
    id: 'five_towers', time: 'sunset',
    title: { en: 'Chapter 5 — Five Towers', km: 'ជំពូកទី៥ — ប្រាង្គប្រាំ' },
    objectives: [
      {
        id: 'reach_sanctuary', text: { en: 'Reach the central sanctuary', km: 'ទៅដល់ប្រាង្គកណ្តាល' },
        sub: [
          { en: 'Symbol stones — Preah Poan', km: 'ថ្មនិមិត្តសញ្ញា — ព្រះពាន់', check: (g) => g.puzzles.isSolved('symbols') },
          { en: 'Light and mirror — second courtyard, south', km: 'ពន្លឺ និងកញ្ចក់ — ទីធ្លាទីពីរ ខាងត្បូង', check: (g) => g.puzzles.isSolved('light') },
          { en: 'Story panels — second courtyard, north', km: 'ផ្ទាំងរឿង — ទីធ្លាទីពីរ ខាងជើង', check: (g) => g.puzzles.isSolved('reliefs') },
          { en: 'Open the gate at the western stairway', km: 'បើកទ្វារនៅជណ្តើរខាងលិច', check: (g) => g.puzzles.isSolved('door') },
          { en: 'Climb to the Bakan', km: 'ឡើងទៅបាកាន', check: (g) => inArea(g, -36, 36, -36, 36, 22.3) },
        ],
        check: (g) => ({ done: g.puzzles.isSolved('door') && inArea(g, -36, 36, -36, 36, 22.3) }),
      },
    ],
  },
  {
    id: 'sunrise', time: 'sunset',
    title: { en: 'Final Chapter — Sunrise Over Angkor', km: 'ជំពូកចុងក្រោយ — ថ្ងៃរះលើអង្គរ' },
    objectives: [
      {
        id: 'highest_viewpoint', text: { en: 'Reach the highest accessible viewpoint', km: 'ទៅដល់ចំណុចមើលខ្ពស់បំផុតដែលអាចទៅដល់' },
        check: (g) => ({ done: inArea(g, -7, 7, -17, 17, 22.6) || inArea(g, -17, 17, -7, 7, 22.6) }),
      },
    ],
  },
];
