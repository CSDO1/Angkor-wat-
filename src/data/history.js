/**
 * Khmer history discovery points.
 *
 * Everything in `history` / `architecture` / `period` is intended as researched, widely published
 * information (see SOURCES). Approximate figures are marked "about". Where scholars disagree the
 * text says so. Positions are Blender metres (see core/utils.js `B`).
 * Khmer text is a draft translation for native-speaker review.
 */
export const SOURCES = [
  'UNESCO World Heritage Centre – Angkor (inscribed 1992)',
  'APSARA National Authority – Angkor Wat visitor information',
  'Michael Freeman & Claude Jacques, Ancient Angkor (River Books)',
  'Eleanor Mannikka, Angkor Wat: Time, Space, and Kingship (University of Hawaii Press, 1996)',
  'Dawn Rooney, Angkor: Cambodia\'s Wondrous Khmer Temples (Odyssey)',
  'E. Uchida & I. Shimoda, "Quarries and transportation routes of Angkor monument sandstone blocks", Journal of Archaeological Science, 2013',
  'German Apsara Conservation Project (GACP) – devata documentation',
];

export const PERIOD_12C = { en: 'Early–mid 12th century CE (reign of Suryavarman II, c. 1113–1150)', km: 'ដើម–ពាក់កណ្តាលសតវត្សទី១២ នៃគ.ស. (រជ្ជកាលព្រះបាទសូរ្យវរ្ម័នទី២ ប្រហែល ១១១៣–១១៥០)' };

export const DISCOVERIES = [
  {
    id: 'angkor_wat', pos: [-6, -603, 0.3], radius: 3.2, illus: 'towers',
    name: { en: 'Angkor Wat', km: 'អង្គរវត្ត' }, khmer: 'អង្គរវត្ត (Ângkôr Vôtt)',
    period: PERIOD_12C,
    history: {
      en: 'Angkor Wat was built in the first half of the 12th century under King Suryavarman II and dedicated to the Hindu god Vishnu. Its name is usually translated as "City Temple" or "Temple City": angkor comes from the Sanskrit nagara, "city", and wat is the Khmer word for a temple. From around the late 13th century it was gradually turned to Theravada Buddhist use, and it has never been completely abandoned. Angkor, including Angkor Wat, was inscribed on the UNESCO World Heritage List in 1992, and the temple appears on the national flag of Cambodia.',
      km: 'អង្គរវត្តត្រូវបានកសាងនៅពាក់កណ្តាលទីមួយនៃសតវត្សទី១២ ក្រោមរជ្ជកាលព្រះបាទសូរ្យវរ្ម័នទី២ ហើយឧទ្ទិសដល់ព្រះវិស្ណុ ដែលជាទេពនៃសាសនាហិណ្ឌូ។ ឈ្មោះនេះជាទូទៅត្រូវបានបកប្រែថា «ប្រាសាទនគរ» ឬ «នគរប្រាសាទ»៖ ពាក្យ អង្គរ មកពីពាក្យសំស្ក្រឹត នគរ មានន័យថា «ទីក្រុង» ហើយ វត្ត ជាពាក្យខ្មែរសម្រាប់ទីអារាម។ ចាប់ពីប្រហែលចុងសតវត្សទី១៣ ប្រាសាទនេះបានប្តូរបន្តិចម្តងៗមកប្រើប្រាស់សម្រាប់ព្រះពុទ្ធសាសនាថេរវាទ ហើយមិនដែលត្រូវបានបោះបង់ចោលទាំងស្រុងឡើយ។ អង្គរ រួមទាំងអង្គរវត្ត ត្រូវបានចុះក្នុងបញ្ជីបេតិកភណ្ឌពិភពលោករបស់យូណេស្កូនៅឆ្នាំ១៩៩២ ហើយប្រាសាទនេះមាននៅលើទង់ជាតិកម្ពុជា។',
    },
    architecture: {
      en: 'The temple is laid out as a model of the Hindu cosmos: a central mountain of towers, concentric enclosures and galleries, and a surrounding moat. It is often described as the largest religious monument in the world.',
      km: 'ប្រាសាទនេះត្រូវបានរៀបចំជាគំរូនៃចក្រវាឡហិណ្ឌូ៖ ភ្នំកណ្តាលដែលមានប្រាង្គ ជញ្ជាំងព័ទ្ធ និងរោងជាស្រទាប់ៗ និងគូទឹកព័ទ្ធជុំវិញ។ វាត្រូវបានគេពិពណ៌នាជាញឹកញាប់ថាជាវិមានសាសនាធំជាងគេបំផុតក្នុងពិភពលោក។',
    },
  },
  {
    id: 'moat', pos: [-16, -588, 0.3], radius: 3.5, illus: 'moat',
    name: { en: 'The Moat', km: 'គូទឹកអង្គរវត្ត' }, khmer: 'គូទឹក',
    period: PERIOD_12C,
    history: {
      en: 'A rectangular moat about 190 metres wide surrounds the temple. Its outer edges measure roughly 1.5 by 1.3 kilometres, a perimeter of more than 5 kilometres.',
      km: 'គូទឹករាងចតុកោណកែងទទឹងប្រហែល ១៩០ ម៉ែត្រ ព័ទ្ធជុំវិញប្រាសាទ។ គែមខាងក្រៅរបស់វាមានទំហំប្រហែល ១,៥ គុណនឹង ១,៣ គីឡូម៉ែត្រ ដែលមានបរិមាត្រជាង ៥ គីឡូម៉ែត្រ។',
    },
    architecture: {
      en: 'In Hindu cosmology the temple stands for Mount Meru, and the moat is commonly interpreted as the ocean surrounding the world. Engineers have also suggested that the water helps keep the sandy ground beneath the temple stable.',
      km: 'ក្នុងចក្រវាឡវិទ្យាហិណ្ឌូ ប្រាសាទតំណាងឱ្យភ្នំព្រះសុមេរុ ហើយគូទឹកជាទូទៅត្រូវបានបកស្រាយថាជាមហាសមុទ្រព័ទ្ធជុំវិញលោក។ វិស្វករខ្លះក៏បានលើកឡើងថា ទឹកជួយរក្សាដីខ្សាច់នៅក្រោមប្រាសាទឱ្យមានស្ថិរភាព។',
    },
  },
  {
    id: 'moat_causeway', pos: [3.2, -500, 0.35], radius: 3.5, illus: 'causeway',
    name: { en: 'Western Approach', km: 'ផ្លូវចូលខាងលិច' }, khmer: 'ស្ពានឆ្លងគូទឹក',
    period: PERIOD_12C,
    history: {
      en: 'The main approach crosses the moat from the west on a raised causeway. Angkor Wat faces west, which is unusual: most Khmer temples face east.',
      km: 'ផ្លូវចូលសំខាន់ឆ្លងកាត់គូទឹកពីទិសខាងលិចតាមផ្លូវថ្នល់លើក។ អង្គរវត្តបែរមុខទៅទិសខាងលិច ដែលជារឿងមិនធម្មតា៖ ប្រាសាទខ្មែរភាគច្រើនបែរមុខទៅទិសខាងកើត។',
    },
    architecture: {
      en: 'Scholars have linked the westward orientation to Vishnu, to whom the temple was dedicated. Others have proposed that it also had a funerary meaning; the question is still debated.',
      km: 'អ្នកប្រាជ្ញបានភ្ជាប់ការបែរមុខទៅទិសខាងលិចនេះជាមួយព្រះវិស្ណុ ដែលប្រាសាទត្រូវបានឧទ្ទិសថ្វាយ។ អ្នកខ្លះទៀតបានលើកឡើងថា វាក៏មានអត្ថន័យទាក់ទងនឹងពិធីបុណ្យសពដែរ។ សំណួរនេះនៅតែជាប្រធានបទជជែកវែកញែក។',
    },
  },
  {
    id: 'west_gopura', pos: [0, -458, 0.2], radius: 4.5, illus: 'gopura',
    name: { en: 'Western Entrance Gateway', km: 'ខ្លោងទ្វារខាងលិច' }, khmer: 'ខ្លោងទ្វារ (gopura)',
    period: PERIOD_12C,
    history: {
      en: 'The western entrance is a colonnaded gallery more than 200 metres long, with three towered gateways. Inside the southern gateway stands a large eight-armed statue of Vishnu, locally venerated as Ta Reach.',
      km: 'ច្រកចូលខាងលិចគឺជារោងមានសសរវែងជាង ២០០ ម៉ែត្រ ដែលមានខ្លោងទ្វារមានប្រាង្គបី។ នៅខាងក្នុងខ្លោងទ្វារខាងត្បូង មានរូបសំណាកព្រះវិស្ណុធំមួយព្រះហស្តប្រាំបី ដែលអ្នកស្រុកគោរពបូជាហៅថា តារាជ។',
    },
    architecture: {
      en: '"Gopura" is the Sanskrit-derived term for a monumental gateway tower. At Angkor Wat, gopuras mark each enclosure, so a visitor passes through a sequence of thresholds on the way to the centre.',
      km: '«គោបុរៈ» គឺជាពាក្យមកពីភាសាសំស្ក្រឹត សម្រាប់ប្រាង្គខ្លោងទ្វារដ៏ធំ។ នៅអង្គរវត្ត គោបុរៈសម្គាល់ជញ្ជាំងព័ទ្ធនីមួយៗ ដូច្នេះអ្នកទស្សនាឆ្លងកាត់មាត់ទ្វារជាបន្តបន្ទាប់ ក្នុងដំណើរទៅកាន់ចំណុចកណ្តាល។',
    },
  },
  {
    id: 'elephant_gates', pos: [-112, -454, 0.1], radius: 5, illus: 'gopura',
    name: { en: 'Elephant Gates', km: 'ទ្វារដំរី' }, khmer: 'ទ្វារដំរី',
    period: PERIOD_12C,
    history: {
      en: 'At both ends of the western entrance gallery are gateways without steps, level with the ground. They are traditionally called the Elephant Gates and are understood as passages for elephants, carts and horses.',
      km: 'នៅចុងទាំងពីរនៃរោងច្រកចូលខាងលិច មានខ្លោងទ្វារគ្មានជណ្តើរ ស្មើនឹងដី។ តាមប្រពៃណីគេហៅថា ទ្វារដំរី ហើយយល់ថាជាផ្លូវសម្រាប់ដំរី រទេះ និងសេះ។',
    },
    architecture: {
      en: 'Most gateways at Angkor Wat stand on raised platforms reached by stairs; these ground-level openings show that practical traffic was planned alongside the ceremonial route.',
      km: 'ខ្លោងទ្វារភាគច្រើននៅអង្គរវត្តស្ថិតនៅលើខឿនខ្ពស់ដែលត្រូវឡើងតាមជណ្តើរ។ ច្រកស្មើដីទាំងនេះបង្ហាញថា ចរាចរណ៍ជាក់ស្តែងត្រូវបានគ្រោងទុកជាមួយផ្លូវពិធី។',
    },
  },
  {
    id: 'naga_causeway', pos: [0, -405, 1.6], radius: 4, illus: 'naga',
    name: { en: 'Naga Causeway', km: 'ផ្លូវនាគ' }, khmer: 'ផ្លូវដើរមានបង្កាន់ដៃនាគ',
    period: PERIOD_12C,
    history: {
      en: 'A raised stone causeway about 350 metres long leads from the entrance gallery to the temple. Its balustrades take the form of nagas, serpent beings, whose multi-headed hoods rise at the ends of each section.',
      km: 'ផ្លូវថ្មលើកខ្ពស់ប្រវែងប្រហែល ៣៥០ ម៉ែត្រ នាំពីរោងច្រកចូលទៅកាន់ប្រាសាទ។ បង្កាន់ដៃរបស់វាមានរាងជានាគ ដែលក្បាលច្រើនរបស់វាងើបឡើងនៅចុងនៃផ្នែកនីមួយៗ។',
    },
    architecture: {
      en: 'In Khmer art the naga is associated with water and fertility. Naga balustrades are often interpreted as a rainbow bridge between the world of humans and the world of the gods.',
      km: 'ក្នុងសិល្បៈខ្មែរ នាគត្រូវបានភ្ជាប់ទៅនឹងទឹក និងភាពសម្បូរសប្បាយ។ បង្កាន់ដៃនាគជាញឹកញាប់ត្រូវបានបកស្រាយថាជាស្ពានឥន្ទធនូ រវាងលោកមនុស្ស និងលោកទេវតា។',
    },
  },
  {
    id: 'sandstone', pos: [-9, -320, 1.6], radius: 3.5, illus: 'quarry',
    name: { en: 'Stone from Phnom Kulen', km: 'ថ្មពីភ្នំគូលែន' }, khmer: 'ថ្មភក់',
    period: PERIOD_12C,
    history: {
      en: 'The sandstone blocks of Angkor Wat were quarried at the foot of the Phnom Kulen hills, more than 30 kilometres away. Research published in 2013 traced a network of canals that is thought to have carried many of the blocks most of the way by water.',
      km: 'ដុំថ្មភក់នៃអង្គរវត្តត្រូវបានយកពីជើងភ្នំគូលែន ដែលមានចម្ងាយជាង ៣០ គីឡូម៉ែត្រ។ ការស្រាវជ្រាវដែលបានបោះពុម្ពនៅឆ្នាំ២០១៣ បានរកឃើញបណ្តាញប្រឡាយ ដែលគេគិតថាបានដឹកជញ្ជូនដុំថ្មជាច្រើនតាមផ្លូវទឹកស្ទើរតែពេញផ្លូវ។',
    },
    architecture: {
      en: 'Sandstone was used for the visible, carved surfaces, while laterite — a porous, iron-rich stone — was used for foundations, cores and enclosure walls.',
      km: 'ថ្មភក់ត្រូវបានប្រើសម្រាប់ផ្ទៃដែលមើលឃើញ និងឆ្លាក់ ចំណែកថ្មបាយក្រៀម ដែលជាថ្មមានរន្ធ និងសម្បូរជាតិដែក ត្រូវបានប្រើសម្រាប់គ្រឹះ ស្នូល និងជញ្ជាំងព័ទ្ធ។',
    },
  },
  {
    id: 'libraries', pos: [-34, -327, 0], radius: 4.5, illus: 'library',
    name: { en: 'The Libraries', km: 'បណ្ណាល័យ' }, khmer: 'បណ្ណាល័យ',
    period: PERIOD_12C,
    history: {
      en: 'Two buildings stand on either side of the causeway, each with porches on four sides. French scholars named buildings of this type "libraries", but their real function is not known; they may have housed sacred texts or served ritual purposes.',
      km: 'អគារពីរឈរនៅសងខាងផ្លូវ ដែលនីមួយៗមានរានហាលទាំងបួនទិស។ អ្នកប្រាជ្ញបារាំងបានដាក់ឈ្មោះអគារប្រភេទនេះថា «បណ្ណាល័យ» ប៉ុន្តែមុខងារពិតប្រាកដរបស់វាមិនត្រូវបានគេដឹងទេ។ វាប្រហែលជាទុកដាក់គម្ពីរ ឬប្រើសម្រាប់ពិធីសាសនា។',
    },
    architecture: {
      en: 'Paired "libraries" flanking the main axis are a recurring feature of Angkorian temple plans.',
      km: '«បណ្ណាល័យ» ជាគូដែលស្ថិតនៅសងខាងអ័ក្សមេ គឺជាលក្ខណៈដែលកើតឡើងម្តងហើយម្តងទៀតក្នុងប្លង់ប្រាសាទសម័យអង្គរ។',
    },
  },
  {
    id: 'ponds', pos: [-58, -243, 0.06], radius: 4.5, illus: 'lotus',
    name: { en: 'Reflecting Ponds', km: 'ស្រះទឹក' }, khmer: 'ស្រះ',
    period: { en: 'Part of the temple precinct; dating debated', km: 'ជាផ្នែកនៃបរិវេណប្រាសាទ ប៉ុន្តែកាលបរិច្ឆេទនៅតែជជែកគ្នា' },
    history: {
      en: 'Two ponds lie in front of the temple, north and south of the causeway. At dawn many visitors gather beside the northern pond, where the towers are reflected in the water.',
      km: 'ស្រះទឹកពីរស្ថិតនៅមុខប្រាសាទ ខាងជើង និងខាងត្បូងផ្លូវ។ នៅពេលព្រឹកព្រលឹម អ្នកទស្សនាជាច្រើនជួបជុំគ្នានៅក្បែរស្រះខាងជើង ដែលប្រាង្គឆ្លុះបញ្ចាំងក្នុងទឹក។',
    },
    architecture: {
      en: 'Lotus grows in the ponds. The lotus, rising clean from muddy water, is a symbol of purity in both Hindu and Buddhist traditions — and the shape of the temple towers is often compared to a lotus bud.',
      km: 'ផ្កាឈូកដុះក្នុងស្រះទាំងនេះ។ ផ្កាឈូក ដែលដុះចេញពីទឹកភក់ដោយស្អាតស្អំ គឺជានិមិត្តរូបនៃភាពបរិសុទ្ធក្នុងប្រពៃណីហិណ្ឌូ និងព្រះពុទ្ធសាសនា ហើយរូបរាងប្រាង្គប្រាសាទជាញឹកញាប់ត្រូវបានប្រៀបធៀបទៅនឹងផ្កាឈូកកំពុងក្រពុំ។',
    },
  },
  {
    id: 'terrace_honour', pos: [0, -122, 3.6], radius: 4, illus: 'terrace',
    name: { en: 'Terrace of Honour', km: 'រានកិត្តិយស' }, khmer: 'រានរាងឈើឆ្កាង',
    period: PERIOD_12C,
    history: {
      en: 'A cross-shaped terrace stands in front of the main entrance, raised on short columns and bordered by naga balustrades. It may have been used for ceremonies or performances.',
      km: 'រានរាងឈើឆ្កាងមួយស្ថិតនៅមុខច្រកចូលធំ លើកលើសសរខ្លីៗ និងព័ទ្ធដោយបង្កាន់ដៃនាគ។ វាប្រហែលជាត្រូវបានប្រើសម្រាប់ពិធី ឬការសម្តែង។',
    },
    architecture: {
      en: 'Cruciform terraces like this one appear at the entrances of several temples of the Angkor period.',
      km: 'រានរាងឈើឆ្កាងបែបនេះ មាននៅច្រកចូលនៃប្រាសាទជាច្រើននៃសម័យអង្គរ។',
    },
  },
  {
    id: 'bas_reliefs', pos: [-30, -89, 3.5], radius: 4, illus: 'relief',
    name: { en: 'Gallery of Bas-Reliefs', km: 'រោងចម្លាក់លៀន' }, khmer: 'រោងជុំទីមួយ',
    period: PERIOD_12C,
    history: {
      en: 'The walls of the outer gallery carry some of the most famous bas-reliefs in Southeast Asia, extending for hundreds of metres. They show scenes from the Hindu epics, the Ramayana and the Mahabharata, the Churning of the Ocean of Milk, heavens and hells, and a procession of the army of King Suryavarman II.',
      km: 'ជញ្ជាំងនៃរោងខាងក្រៅមានចម្លាក់លៀនដ៏ល្បីល្បាញបំផុតមួយចំនួននៅអាស៊ីអាគ្នេយ៍ ដែលលាតសន្ធឹងរាប់រយម៉ែត្រ។ វាបង្ហាញឈុតឆាកពីវីរកថាហិណ្ឌូ រាមាយណៈ និងមហាភារតៈ ការកូរសមុទ្រទឹកដោះ ឋានសួគ៌ និងនរក និងក្បួនដង្ហែកងទ័ពរបស់ព្រះបាទសូរ្យវរ្ម័នទី២។',
    },
    architecture: {
      en: 'The reliefs are read with the monument on the viewer\'s left, walking anticlockwise. Some scholars connect this direction, called prasavya, with funerary rites.',
      km: 'ចម្លាក់លៀនត្រូវបានមើលដោយឱ្យវិមាននៅខាងឆ្វេងអ្នកមើល ដើរច្រាសទ្រនិចនាឡិកា។ អ្នកប្រាជ្ញខ្លះភ្ជាប់ទិសដៅនេះ ដែលហៅថា ប្រសវ្យ ជាមួយពិធីបុណ្យសព។',
    },
  },
  {
    id: 'preah_poan', pos: [6, -74.5, 3.5], radius: 4, illus: 'buddha',
    name: { en: 'Preah Poan – Gallery of a Thousand Buddhas', km: 'ព្រះពាន់' }, khmer: 'ព្រះពាន់',
    period: { en: 'Built 12th century; Buddhist images added over later centuries', km: 'កសាងសតវត្សទី១២ រូបព្រះពុទ្ធត្រូវបានបន្ថែមក្នុងសតវត្សក្រោយៗ' },
    history: {
      en: 'Between the first and second enclosures is a cross-shaped cloister with four sunken basins. Over the centuries Buddhist pilgrims placed images of the Buddha here, giving it the name Preah Poan, the "Thousand Buddhas". Only a few remain today.',
      km: 'នៅចន្លោះជញ្ជាំងព័ទ្ធទីមួយ និងទីពីរ មានរោងរាងឈើឆ្កាងដែលមានអាងទឹកជម្រៅបួន។ ក្នុងរយៈពេលរាប់សតវត្ស អ្នកធ្វើធម្មយាត្រាពុទ្ធសាសនិកបានដាក់ព្រះពុទ្ធរូបនៅទីនេះ ដែលធ្វើឱ្យវាមានឈ្មោះថា ព្រះពាន់។ សព្វថ្ងៃនៅសល់តែប៉ុន្មានអង្គប៉ុណ្ណោះ។',
    },
    architecture: {
      en: 'Visitors over the centuries left inscriptions on its pillars. One of the best known was written by a Japanese visitor, Morimoto Ukondayū, in 1632.',
      km: 'អ្នកទស្សនាក្នុងរយៈពេលរាប់សតវត្សបានបន្សល់សិលាចារឹកនៅលើសសររបស់វា។ សិលាចារឹកមួយដែលល្បីជាងគេ ត្រូវបានសរសេរដោយអ្នកទស្សនាជនជាតិជប៉ុន ម៉ូរិម៉ូតូ អ៊ូកុនដាយូ នៅឆ្នាំ១៦៣២។',
    },
  },
  {
    id: 'devatas', pos: [-40, -42.5, 10], radius: 4, illus: 'devata',
    name: { en: 'Devatas', km: 'ទេវតា' }, khmer: 'ទេវតា (អប្សរា)',
    period: PERIOD_12C,
    history: {
      en: 'Nearly 1,800 female divine figures are carved on the walls of Angkor Wat. Each has individual jewellery, clothing and hairstyles.',
      km: 'រូបទេវតាស្រីជិត ១៨០០ រូបត្រូវបានឆ្លាក់នៅលើជញ្ជាំងអង្គរវត្ត។ រូបនីមួយៗមានគ្រឿងអលង្ការ សម្លៀកបំពាក់ និងម៉ូដសក់ខុសៗគ្នា។',
    },
    architecture: {
      en: 'They are often popularly called apsaras. Strictly, apsaras are celestial dancers and are usually shown dancing; the standing figures are devatas. Their conservation has been studied closely, for example by the German Apsara Conservation Project.',
      km: 'ពួកគេជាញឹកញាប់ត្រូវបានហៅជាទូទៅថា អប្សរា។ តាមពិត អប្សរាជាទេពធីតារបាំលើមេឃ ហើយជាធម្មតាត្រូវបានបង្ហាញកំពុងរាំ ចំណែករូបឈរគឺជាទេវតា។ ការអភិរក្សពួកគេត្រូវបានសិក្សាយ៉ាងយកចិត្តទុកដាក់ ឧទាហរណ៍ដោយគម្រោងអភិរក្សអប្សរាអាល្លឺម៉ង់។',
    },
  },
  {
    id: 'bakan', pos: [6, -41, 10], radius: 4, illus: 'stairs',
    name: { en: 'Bakan – the Upper Level', km: 'បាកាន' }, khmer: 'បាកាន',
    period: PERIOD_12C,
    history: {
      en: 'The upper terrace, the Bakan, rises about 13 metres above the second level. Its original stairways are extremely steep, around 70 degrees. Today visitors climb one modern stairway, and access is regulated.',
      km: 'ខឿនខាងលើ ហៅថា បាកាន ខ្ពស់ប្រហែល ១៣ ម៉ែត្រពីជាន់ទីពីរ។ ជណ្តើរដើមរបស់វាចោតខ្លាំងណាស់ ប្រហែល ៧០ ដឺក្រេ។ សព្វថ្ងៃ អ្នកទស្សនាឡើងតាមជណ្តើរទំនើបមួយ ហើយការចូលត្រូវបានគ្រប់គ្រង។',
    },
    architecture: {
      en: 'The steepness is often said to express how difficult it is to ascend to the realm of the gods.',
      km: 'ភាពចោតនេះត្រូវបានគេនិយាយជាញឹកញាប់ថា បង្ហាញពីការលំបាកក្នុងការឡើងទៅកាន់ឋានទេវតា។',
    },
  },
  {
    id: 'central_sanctuary', pos: [0, -17, 23.0], radius: 4, illus: 'towers',
    name: { en: 'Central Sanctuary', km: 'ប្រាង្គកណ្តាល' }, khmer: 'ប្រាង្គកណ្តាល',
    period: PERIOD_12C,
    history: {
      en: 'The central tower rises about 65 metres above the ground. It originally housed an image of Vishnu. After the temple came into Buddhist use, the doorways of the central sanctuary were walled in and carved with standing Buddhas.',
      km: 'ប្រាង្គកណ្តាលខ្ពស់ប្រហែល ៦៥ ម៉ែត្រពីដី។ ពីដំបូងវាតម្កល់រូបព្រះវិស្ណុ។ បន្ទាប់ពីប្រាសាទត្រូវបានប្រើប្រាស់សម្រាប់ព្រះពុទ្ធសាសនា មាត់ទ្វារនៃប្រាង្គកណ្តាលត្រូវបានបិទដោយជញ្ជាំង ហើយឆ្លាក់រូបព្រះពុទ្ធឈរ។',
    },
    architecture: {
      en: 'The five towers are arranged in a quincunx — four at the corners and one at the centre — representing the five peaks of Mount Meru, home of the gods.',
      km: 'ប្រាង្គទាំងប្រាំត្រូវបានរៀបចំជារាងប្រាំចំណុច ប្រាង្គបួននៅជ្រុង និងមួយនៅកណ្តាល តំណាងឱ្យកំពូលទាំងប្រាំនៃភ្នំព្រះសុមេរុ ដែលជាលំនៅរបស់ទេវតា។',
    },
  },
  {
    id: 'laterite_wall', pos: [-150, -438, 0], radius: 5, illus: 'wall',
    name: { en: 'Outer Enclosure Wall', km: 'កំពែងខាងក្រៅ' }, khmer: 'កំពែងថ្មបាយក្រៀម',
    period: PERIOD_12C,
    history: {
      en: 'Inside the moat, a wall of laterite about 1,025 by 800 metres encloses the temple grounds. The space between the wall and the temple was once occupied, it is thought, by a town and the temple\'s community, built in perishable materials.',
      km: 'នៅខាងក្នុងគូទឹក កំពែងថ្មបាយក្រៀមទំហំប្រហែល ១០២៥ គុណនឹង ៨០០ ម៉ែត្រ ព័ទ្ធបរិវេណប្រាសាទ។ គេគិតថាទីធ្លារវាងកំពែង និងប្រាសាទធ្លាប់មានទីប្រជុំជន និងសហគមន៍របស់ប្រាសាទ ដែលសាងសង់ដោយសម្ភារៈមិនស្ថិតស្ថេរ។',
    },
    architecture: {
      en: 'Only buildings of the gods were made of stone at Angkor; houses and palaces were built of wood and have not survived.',
      km: 'នៅអង្គរ មានតែអគាររបស់ទេវតាប៉ុណ្ណោះដែលធ្វើពីថ្ម។ ផ្ទះ និងព្រះរាជវាំងត្រូវបានសាងសង់ពីឈើ ហើយមិនបានគង់វង្សរហូតមកដល់សព្វថ្ងៃទេ។',
    },
  },
  {
    id: 'east_gate', pos: [0, 252, 0.3], radius: 5, illus: 'gopura',
    name: { en: 'Eastern Gateway', km: 'ខ្លោងទ្វារខាងកើត' }, khmer: 'ខ្លោងទ្វារខាងកើត',
    period: PERIOD_12C,
    history: {
      en: 'A simpler gateway opens to the east, without the grand causeway of the western side. Most visitors arrive from the west, through the temple\'s main entrance.',
      km: 'ខ្លោងទ្វារសាមញ្ញមួយបើកទៅទិសខាងកើត ដោយគ្មានផ្លូវធំដូចខាងលិច។ អ្នកទស្សនាភាគច្រើនមកដល់ពីទិសខាងលិច តាមច្រកចូលធំរបស់ប្រាសាទ។',
    },
    architecture: {
      en: 'Because the rest of the temple faces west, the eastern side is quieter — a reminder of how deliberately the western axis was designed as the ceremonial route.',
      km: 'ដោយសារប្រាសាទទាំងមូលបែរមុខទៅខាងលិច ផ្នែកខាងកើតស្ងប់ស្ងាត់ជាង ដែលរំលឹកយើងថា អ័ក្សខាងលិចត្រូវបានរចនាដោយចេតនាជាផ្លូវពិធី។',
    },
  },
];

/** Bas-relief markers (Chapter 3). The reliefs are real; the glowing "markers" are a game device. */
export const RELIEFS = [
  {
    id: 'relief_lanka', pos: [-62, -85.15, 5.0], normal: [0, -1], illus: 'lanka',
    name: { en: 'The Battle of Lanka', km: 'សង្គ្រាមលង្កា' },
    where: { en: 'Western gallery, northern wing', km: 'រោងខាងលិច ស្លាបខាងជើង' },
    text: {
      en: 'An episode from the Ramayana: Rama, helped by the monkey army led by Hanuman, fights the demon king Ravana at Lanka to rescue Sita.',
      km: 'វគ្គមួយពីរាមាយណៈ៖ ព្រះរាម ដោយមានជំនួយពីកងទ័ពស្វាដឹកនាំដោយហនុមាន ច្បាំងជាមួយស្តេចយក្សរាពណ៍នៅលង្កា ដើម្បីជួយសង្គ្រោះនាងសីតា។',
    },
  },
  {
    id: 'relief_kurukshetra', pos: [62, -85.15, 5.0], normal: [0, -1], illus: 'kurukshetra',
    name: { en: 'The Battle of Kurukshetra', km: 'សង្គ្រាមកុរុក្សេត្រ' },
    where: { en: 'Western gallery, southern wing', km: 'រោងខាងលិច ស្លាបខាងត្បូង' },
    text: {
      en: 'From the Mahabharata: the armies of the Kauravas and the Pandavas advance toward each other. Foot soldiers march below commanders riding chariots and elephants.',
      km: 'ពីមហាភារតៈ៖ កងទ័ពកៅរព និងបាណ្ឌពដើរឆ្ពោះទៅរកគ្នា។ ទាហានថ្មើរជើងដើរនៅក្រោមមេទ័ពដែលជិះរទេះចំបាំង និងដំរី។',
    },
  },
  {
    id: 'relief_procession', pos: [99.15, -45, 5.0], normal: [1, 0], illus: 'procession',
    name: { en: 'The Historic Procession', km: 'ក្បួនដង្ហែប្រវត្តិសាស្ត្រ' },
    where: { en: 'Southern gallery, western wing', km: 'រោងខាងត្បូង ស្លាបខាងលិច' },
    text: {
      en: 'The army of King Suryavarman II in procession. The king is shown seated in audience on a mountain and then riding an elephant. Short inscriptions name him by his posthumous title, Paramavishnuloka.',
      km: 'ក្បួនដង្ហែកងទ័ពរបស់ព្រះបាទសូរ្យវរ្ម័នទី២។ ព្រះមហាក្សត្រត្រូវបានបង្ហាញគង់ចេញប្រថាប់លើភ្នំ ហើយបន្ទាប់មកគង់លើដំរី។ សិលាចារឹកខ្លីៗហៅព្រះអង្គតាមព្រះនាមក្រោយសុគត គឺ បរមវិស្ណុលោក។',
    },
  },
  {
    id: 'relief_churning', pos: [60, 85.15, 5.0], normal: [0, 1], illus: 'churning',
    name: { en: 'The Churning of the Ocean of Milk', km: 'ការកូរសមុទ្រទឹកដោះ' },
    where: { en: 'Eastern gallery, southern wing', km: 'រោងខាងកើត ស្លាបខាងត្បូង' },
    text: {
      en: 'Nearly 50 metres long. Gods and demons pull on the serpent Vasuki, wrapped around Mount Mandara, which rests on Vishnu in the form of a turtle. Their churning of the ocean brings forth amrita, the elixir of immortality, and apsaras rise from the foam above.',
      km: 'ប្រវែងជិត ៥០ ម៉ែត្រ។ ទេវតា និងអសុរទាញនាគវាសុកី ដែលរុំជុំវិញភ្នំមន្ទារ ដែលតាំងនៅលើព្រះវិស្ណុក្នុងរូបជាអណ្តើក។ ការកូរសមុទ្ររបស់ពួកគេបង្កើតបានទឹកអម្រឹត ដែលជាទឹកអមតៈ ហើយអប្សរាលេចចេញពីពពុះនៅខាងលើ។',
    },
  },
];
