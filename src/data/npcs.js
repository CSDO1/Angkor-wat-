/**
 * NPCs. All characters are FICTIONAL; the facts they mention come from data/history.js.
 * Dialogue nodes: { id, en, km, next?, choices?: [{en, km, next, action?}], action? }
 * `start(game)` picks the entry node for the current story state.
 */
export const NPCS = [
  {
    id: 'sokha', pos: [3.5, -597, 0.35], yaw: 200,
    look: { skin: 0x8a5c40, shirt: 0xe9e2d0, pants: 0x3c3a34, hat: null, krama: ['#a02025', '#efe4cc'], height: 1.68 },
    name: { en: 'Sokha', km: 'សុខា' }, role: { en: 'Local guide', km: 'មគ្គុទ្ទេសក៍ក្នុងស្រុក' },
    start: (g) => (g.flags.has('talked_sokha') ? (g.objectives.chapterIndex >= 2 ? 'reliefs' : 'again') : 'hello'),
    nodes: {
      hello: {
        en: 'Chumreap suor — hello, and welcome to Angkor Wat! I\'m Sokha. I have guided visitors here for many years.',
        km: 'ជំរាបសួរ ហើយសូមស្វាគមន៍មកកាន់អង្គរវត្ត! ខ្ញុំឈ្មោះសុខា។ ខ្ញុំបាននាំភ្ញៀវទេសចរនៅទីនេះអស់ជាច្រើនឆ្នាំមកហើយ។',
        next: 'west',
      },
      west: {
        en: 'Unlike most Khmer temples, Angkor Wat faces west, so we walk in from this side, across the moat. Take your time and stop at anything that catches your eye.',
        km: 'ខុសពីប្រាសាទខ្មែរភាគច្រើន អង្គរវត្តបែរមុខទៅទិសខាងលិច ដូច្នេះយើងដើរចូលពីខាងនេះ ឆ្លងកាត់គូទឹក។ សូមកុំប្រញាប់ ហើយឈប់មើលអ្វីដែលទាក់ទាញភ្នែករបស់អ្នក។',
        next: 'markers',
      },
      markers: {
        en: 'You\'ll see small glowing markers — notes for visitors. Stand close and press E, and they will tell you about the place.',
        km: 'អ្នកនឹងឃើញសញ្ញាភ្លឺតូចៗ ដែលជាកំណត់ចំណាំសម្រាប់ភ្ញៀវ។ សូមឈរជិត ហើយចុច E វានឹងប្រាប់អ្នកអំពីទីកន្លែងនោះ។',
        choices: [
          { en: 'Is it still a place of worship?', km: 'តើវានៅតែជាទីសក្ការៈបូជាឬទេ?', next: 'worship' },
          { en: 'Where should I go?', km: 'តើខ្ញុំគួរទៅណា?', next: 'go' },
        ],
      },
      worship: {
        en: 'Yes. Monks and families still come to pray and make offerings. Please dress and behave respectfully — shoulders and knees covered, and quiet near the shrines.',
        km: 'បាទ។ ព្រះសង្ឃ និងគ្រួសារនៅតែមកបួងសួង និងធ្វើសក្ការៈ។ សូមស្លៀកពាក់ និងប្រព្រឹត្តដោយគោរព គ្របស្មា និងជង្គង់ ហើយស្ងាត់ស្ងៀមនៅជិតទីសក្ការៈ។',
        next: 'go',
      },
      go: {
        en: 'Cross the causeway over the moat to the western gateway. Dr. Chanthy\'s conservation team is working near the libraries — she may need a hand later.',
        km: 'សូមឆ្លងផ្លូវលើគូទឹកទៅកាន់ខ្លោងទ្វារខាងលិច។ ក្រុមអភិរក្សរបស់វេជ្ជបណ្ឌិតចាន់ធី កំពុងធ្វើការនៅជិតបណ្ណាល័យ ក្រោយមកគាត់ប្រហែលជាត្រូវការជំនួយ។',
        action: 'flag:talked_sokha',
      },
      again: {
        en: 'Enjoy the walk! Remember: the moat is deep — stay on the causeway.',
        km: 'រីករាយនឹងការដើរ! សូមចងចាំ៖ គូទឹកជ្រៅណាស់ សូមនៅលើផ្លូវ។',
      },
      reliefs: {
        en: 'Have you seen the outer gallery? Walk it with the temple on your left and the stories unfold in order.',
        km: 'តើអ្នកបានឃើញរោងខាងក្រៅហើយឬនៅ? ដើរដោយឱ្យប្រាសាទនៅខាងឆ្វេង ហើយរឿងរ៉ាវនឹងលាតត្រដាងតាមលំដាប់។',
      },
    },
  },
  {
    id: 'chanthy', pos: [-29, -313, 0], yaw: 160,
    look: { skin: 0x9a6a4c, shirt: 0x5d6b58, pants: 0x6b5c45, hat: 'sun', height: 1.62, clipboard: true, hair: 0x120d0a },
    name: { en: 'Dr. Chanthy', km: 'វេជ្ជបណ្ឌិត ចាន់ធី' }, role: { en: 'Archaeologist (fictional conservation team)', km: 'អ្នកបុរាណវិទ្យា (ក្រុមអភិរក្សប្រឌិត)' },
    start: (g) => {
      const c = g.objectives.current?.id;
      if (c === 'stories' && !g.flags.has('chanthy_reliefs')) return 'reliefs';
      if (c === 'echoes' && !g.flags.has('chanthy_artifacts')) return 'artifacts';
      if (c === 'five_towers' && !g.flags.has('chanthy_puzzles')) return 'puzzles';
      if (g.flags.has('talked_chanthy')) return 'again';
      return 'hello';
    },
    nodes: {
      hello: {
        en: 'Oh — hello! I\'m Chanthy. My team documents the condition of the stone here: cracks, biofilm, fallen fragments.',
        km: 'អូ សួស្តី! ខ្ញុំឈ្មោះចាន់ធី។ ក្រុមរបស់ខ្ញុំកត់ត្រាស្ថានភាពថ្មនៅទីនេះ៖ ស្នាមប្រេះ ស្រទាប់ជីវសាស្ត្រ និងបំណែកដែលធ្លាក់។',
        next: 'hello2',
      },
      hello2: {
        en: 'By the way, the name "library" is only a label French scholars gave these buildings. Nobody really knows what they were for.',
        km: 'និយាយអញ្ចឹង ឈ្មោះ «បណ្ណាល័យ» គ្រាន់តែជាស្លាកដែលអ្នកប្រាជ្ញបារាំងដាក់ឱ្យអគារទាំងនេះ។ គ្មាននរណាដឹងច្បាស់ថាវាសម្រាប់ធ្វើអ្វីទេ។',
        action: 'flag:talked_chanthy',
      },
      reliefs: {
        en: 'We placed four small survey markers beside some of the great bas-reliefs in the outer gallery. Find them, and you\'ll have seen four of the most famous scenes in Khmer art.',
        km: 'យើងបានដាក់សញ្ញាស្ទង់តូចៗចំនួនបួន នៅក្បែរចម្លាក់លៀនធំៗមួយចំនួននៅរោងខាងក្រៅ។ រកវាឱ្យឃើញ ហើយអ្នកនឹងបានឃើញឈុតឆាកល្បីៗបំផុតចំនួនបួនក្នុងសិល្បៈខ្មែរ។',
        next: 'reliefs2',
      },
      reliefs2: {
        en: 'The markers are our invention, of course. The reliefs are 900 years old. Please don\'t touch the carvings — skin oils damage the stone.',
        km: 'ជាការពិតណាស់ សញ្ញាទាំងនោះជាការបង្កើតរបស់យើង។ ចម្លាក់លៀនមានអាយុ ៩០០ ឆ្នាំ។ សូមកុំប៉ះចម្លាក់ ព្រោះប្រេងស្បែកធ្វើឱ្យខូចថ្ម។',
        action: 'flag:chanthy_reliefs',
      },
      artifacts: {
        en: 'Last night\'s storm scattered our study pieces — casts and teaching replicas, not originals. Five are missing somewhere in the grounds. Could you find them for our records?',
        km: 'ព្យុះកាលពីយប់មិញបានធ្វើឱ្យរបស់សិក្សារបស់យើងខ្ចាត់ខ្ចាយ ដែលជាគំរូចម្លង និងគំរូបង្រៀន មិនមែនរបស់ដើមទេ។ ប្រាំដុំបាត់នៅកន្លែងណាមួយក្នុងបរិវេណ។ តើអ្នកអាចជួយរកវាសម្រាប់កំណត់ត្រារបស់យើងបានទេ?',
        next: 'artifacts2',
      },
      artifacts2: {
        en: 'Oh, and one of my students lost a notebook page about the Japanese inscription of 1632 somewhere in the Preah Poan. If you see it…',
        km: 'អូ ហើយសិស្សម្នាក់របស់ខ្ញុំបានបាត់ទំព័រសៀវភៅកត់ត្រាអំពីសិលាចារឹកជប៉ុនឆ្នាំ១៦៣២ នៅកន្លែងណាមួយក្នុងព្រះពាន់។ បើអ្នកឃើញវា…',
        action: 'flag:chanthy_artifacts;quest:ukondayu',
      },
      puzzles: {
        en: 'The Bakan is closed while we work. For our visitor programme we built four puzzles around the second enclosure — our own invention, not ancient mechanisms!',
        km: 'បាកានត្រូវបានបិទខណៈពេលយើងធ្វើការ។ សម្រាប់កម្មវិធីភ្ញៀវ យើងបានបង្កើតល្បែងផ្គុំបួននៅជុំវិញជញ្ជាំងព័ទ្ធទីពីរ ដែលជាការច្នៃប្រឌិតរបស់យើងផ្ទាល់ មិនមែនជាយន្តការបុរាណទេ!',
        next: 'puzzles2',
      },
      puzzles2: {
        en: 'Start with the symbol stones in the Preah Poan, then the mirror and the story panels in the second courtyard. Each gives a stone key for the gate at the western stairway.',
        km: 'ចាប់ផ្តើមពីថ្មនិមិត្តសញ្ញានៅព្រះពាន់ បន្ទាប់មកកញ្ចក់ និងផ្ទាំងរឿងនៅទីធ្លាទីពីរ។ នីមួយៗផ្តល់កូនសោថ្មមួយសម្រាប់ទ្វារនៅជណ្តើរខាងលិច។',
        action: 'flag:chanthy_puzzles',
      },
      again: {
        en: 'Thank you for helping us. Every record helps us look after the temple.',
        km: 'អរគុណសម្រាប់ជំនួយ។ កំណត់ត្រានីមួយៗជួយយើងថែរក្សាប្រាសាទ។',
      },
    },
  },
  {
    id: 'vuthy', pos: [-40, -88.2, 3.52], yaw: 180,
    look: { skin: 0x7c5238, shirt: 0x3d5a7a, pants: 0x3a3a3a, hardHat: true, vest: 0xd88a20, height: 1.7 },
    name: { en: 'Vuthy', km: 'វុធី' }, role: { en: 'Conservation worker (fictional)', km: 'កម្មករអភិរក្ស (ប្រឌិត)' },
    start: (g) => g.quests.state('devata_survey') === 'done' ? 'thanks' : g.quests.state('devata_survey') === 'active'
      ? (g.quests.progress('devata_survey') >= 3 ? 'complete' : 'progress') : 'hello',
    nodes: {
      hello: {
        en: 'Careful where you step — we\'re cleaning the reliefs. Lichens and bacteria form dark films that slowly damage the sandstone.',
        km: 'ប្រយ័ត្នកន្លែងដែលអ្នកដើរ យើងកំពុងសម្អាតចម្លាក់លៀន។ ផ្សិត និងបាក់តេរីបង្កើតជាស្រទាប់ខ្មៅ ដែលធ្វើឱ្យខូចថ្មភក់បន្តិចម្តងៗ។',
        choices: [
          { en: 'Can I help?', km: 'តើខ្ញុំអាចជួយបានទេ?', next: 'quest' },
          { en: 'I\'ll let you work.', km: 'ខ្ញុំទុកឱ្យអ្នកធ្វើការ។', next: null },
        ],
      },
      quest: {
        en: 'Actually, yes. I need photos of three devatas in the second courtyard for our condition survey. I marked them with chalk circles.',
        km: 'បាទ ពិតណាស់។ ខ្ញុំត្រូវការរូបថតទេវតាបីនៅទីធ្លាទីពីរ សម្រាប់ការស្ទង់ស្ថានភាពរបស់យើង។ ខ្ញុំបានគូសរង្វង់ដីសលើពួកវា។',
        action: 'quest:devata_survey',
      },
      progress: {
        en: 'Three devatas, second courtyard, chalk circles. Take your time.',
        km: 'ទេវតាបី ទីធ្លាទីពីរ រង្វង់ដីស។ កុំប្រញាប់។',
      },
      complete: {
        en: 'Perfect, these will go straight into the survey. Did you notice? No two of them wear the same crown.',
        km: 'ល្អណាស់ រូបទាំងនេះនឹងចូលទៅក្នុងការស្ទង់ភ្លាមៗ។ តើអ្នកបានកត់សម្គាល់ទេ? គ្មានពីរណាពាក់មកុដដូចគ្នាទេ។',
        action: 'questdone:devata_survey',
      },
      thanks: {
        en: 'Thanks again for the survey photos!',
        km: 'អរគុណម្តងទៀតសម្រាប់រូបថតស្ទង់!',
      },
    },
  },
  {
    id: 'maya', pos: [-56, -240.5, 0.06], yaw: 120,
    look: { skin: 0xc49a7c, shirt: 0xd8c8a0, pants: 0x55607a, hat: 'sun', camera: true, height: 1.66, hair: 0x5a3a22 },
    name: { en: 'Maya', km: 'ម៉ាយ៉ា' }, role: { en: 'Visitor (fictional)', km: 'អ្នកទស្សនា (ប្រឌិត)' },
    start: (g) => g.quests.state('five_towers_view') === 'done' ? 'thanks'
      : g.quests.state('five_towers_view') === 'active' ? (g.quests.progress('five_towers_view') >= 1 ? 'complete' : 'progress') : 'hello',
    nodes: {
      hello: {
        en: 'Good morning! I came for the famous reflection, but walking up the causeway I could only count three towers, not five. Am I imagining things?',
        km: 'អរុណសួស្តី! ខ្ញុំមកដើម្បីមើលការឆ្លុះបញ្ចាំងដ៏ល្បី ប៉ុន្តែពេលដើរតាមផ្លូវ ខ្ញុំអាចរាប់បានតែប្រាង្គបី មិនមែនប្រាំទេ។ តើខ្ញុំស្រមៃឬ?',
        choices: [
          { en: 'I\'ll find a better view.', km: 'ខ្ញុំនឹងរកទិដ្ឋភាពល្អជាងនេះ។', next: 'quest' },
          { en: 'Maybe later.', km: 'ប្រហែលពេលក្រោយ។', next: null },
        ],
      },
      quest: {
        en: 'Would you? Somewhere around this pond there must be a spot where all five show. I\'ll wait here.',
        km: 'មែនទេ? នៅកន្លែងណាមួយជុំវិញស្រះនេះ ច្បាស់ជាមានកន្លែងដែលមើលឃើញទាំងប្រាំ។ ខ្ញុំនឹងរង់ចាំនៅទីនេះ។',
        action: 'quest:five_towers_view',
      },
      progress: {
        en: 'Try the far corner of the pond, away from the central axis.',
        km: 'សាកល្បងជ្រុងម្ខាងទៀតនៃស្រះ ឆ្ងាយពីអ័ក្សកណ្តាល។',
      },
      complete: {
        en: 'Five! From the front they line up and hide each other; from an angle, all five appear. Thank you!',
        km: 'ប្រាំ! ពីខាងមុខ ពួកវាតម្រៀបគ្នា ហើយបាំងគ្នាទៅវិញទៅមក ប៉ុន្តែពីមុំមួយ ទាំងប្រាំលេចចេញ។ អរគុណ!',
        action: 'questdone:five_towers_view',
      },
      thanks: {
        en: 'I\'m staying for sunrise tomorrow too!',
        km: 'ខ្ញុំនឹងនៅមើលថ្ងៃរះនៅថ្ងៃស្អែកផងដែរ!',
      },
    },
  },
];

/** Optional quests. */
export const QUESTS = {
  devata_survey: {
    name: { en: 'Devata Survey', km: 'ការស្ទង់ទេវតា' },
    desc: { en: 'Photograph three devatas in the second courtyard for Vuthy', km: 'ថតរូបទេវតាបីនៅទីធ្លាទីពីរសម្រាប់វុធី' },
    goal: 3,
    spots: [[-8, -43.9, 10], [30, -44.2, 10], [-30, 44.2, 10]],
  },
  five_towers_view: {
    name: { en: 'Five Towers', km: 'ប្រាង្គប្រាំ' },
    desc: { en: 'Find a place where all five towers can be seen, then tell Maya', km: 'រកកន្លែងដែលអាចមើលឃើញប្រាង្គទាំងប្រាំ រួចប្រាប់ម៉ាយ៉ា' },
    goal: 1,
    spot: [-80, -241, 0.06],
  },
  ukondayu: {
    name: { en: 'A Lost Page', km: 'ទំព័រដែលបាត់' },
    desc: { en: 'Find the notebook page about the 1632 inscription in the Preah Poan', km: 'រកទំព័រសៀវភៅអំពីសិលាចារឹកឆ្នាំ១៦៣២ នៅព្រះពាន់' },
    goal: 1,
  },
};
