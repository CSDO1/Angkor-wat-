/**
 * Angkor Journal data: where each place is, how entries relate, historical people and the
 * Fact & Fiction claims. The journal UI only reads this file, so new entries need no UI code.
 *
 * `evidence` separates what is documented from what is inferred or told:
 *   history  – attested in inscriptions, texts or the monument itself
 *   interp   – a scholarly interpretation; reasonable but not proven
 *   tradition – living Cambodian tradition or custom
 *   legend   – a story, not a historical claim
 * Khmer text is a draft translation for native-speaker review.
 */

export const EVIDENCE = {
  history: { en: 'Historical evidence', km: 'ភស្តុតាងប្រវត្តិសាស្ត្រ' },
  interp: { en: 'Interpretation', km: 'ការបកស្រាយ' },
  tradition: { en: 'Tradition', km: 'ប្រពៃណី' },
  legend: { en: 'Legend', km: 'រឿងព្រេង' },
  fiction: { en: 'Fictional', km: 'ប្រឌិត' },
};

/** Location label and related entries for each place in data/history.js DISCOVERIES. */
export const PLACE_INFO = {
  angkor_wat: { where: { en: 'Western landing, before the moat', km: 'ចំណតខាងលិច មុនគូទឹក' }, related: ['moat', 'moat_causeway', 'central_sanctuary'], auto: false },
  moat: { where: { en: 'Around the whole temple', km: 'ជុំវិញប្រាសាទទាំងមូល' }, related: ['moat_causeway', 'laterite_wall'] },
  moat_causeway: { where: { en: 'Western causeway across the moat', km: 'ផ្លូវថ្នល់ខាងលិចឆ្លងគូទឹក' }, related: ['moat', 'west_gopura'] },
  west_gopura: { where: { en: 'Outer enclosure, west side', km: 'កំពែងខាងក្រៅ ទិសខាងលិច' }, related: ['elephant_gates', 'naga_causeway', 'moat_causeway'] },
  elephant_gates: { where: { en: 'Ends of the western entrance gallery', km: 'ចុងរោងច្រកចូលខាងលិច' }, related: ['west_gopura'] },
  naga_causeway: { where: { en: 'Between the entrance and the temple', km: 'ចន្លោះច្រកចូល និងប្រាសាទ' }, related: ['west_gopura', 'libraries', 'terrace_honour'] },
  sandstone: { where: { en: 'Naga causeway', km: 'ផ្លូវនាគ' }, related: ['naga_causeway', 'bas_reliefs'] },
  libraries: { where: { en: 'Beside the Naga causeway', km: 'ក្បែរផ្លូវនាគ' }, related: ['naga_causeway', 'ponds'] },
  ponds: { where: { en: 'North and south of the causeway', km: 'ខាងជើង និងខាងត្បូងផ្លូវថ្នល់' }, related: ['libraries', 'terrace_honour'] },
  terrace_honour: { where: { en: 'Before the main entrance', km: 'មុខច្រកចូលធំ' }, related: ['naga_causeway', 'bas_reliefs'] },
  bas_reliefs: { where: { en: 'Outer gallery, first enclosure', km: 'រោងខាងក្រៅ ជញ្ជាំងព័ទ្ធទីមួយ' }, related: ['terrace_honour', 'preah_poan'] },
  preah_poan: { where: { en: 'Cross-shaped cloister, west side', km: 'រោងឆ្លងរាងឈើឆ្កាង ទិសខាងលិច' }, related: ['bas_reliefs', 'devatas'] },
  devatas: { where: { en: 'Walls of the second enclosure', km: 'ជញ្ជាំងនៃជញ្ជាំងព័ទ្ធទីពីរ' }, related: ['preah_poan', 'bakan'] },
  bakan: { where: { en: 'Upper level, western stairway', km: 'ជាន់ខាងលើ ជណ្តើរខាងលិច' }, related: ['devatas', 'central_sanctuary'] },
  central_sanctuary: { where: { en: 'Summit of the Bakan', km: 'កំពូលបាកាន' }, related: ['bakan', 'angkor_wat'] },
  laterite_wall: { where: { en: 'Inside the moat, all around', km: 'ខាងក្នុងគូទឹក ជុំវិញទាំងអស់' }, related: ['moat', 'east_gate'] },
  east_gate: { where: { en: 'Outer enclosure, east side', km: 'កំពែងខាងក្រៅ ទិសខាងកើត' }, related: ['laterite_wall', 'west_gopura'] },
};

/** People of Angkor. Unlocked when any of `unlock` (place ids or relief ids) is discovered. */
export const PEOPLE = [
  {
    id: 'suryavarman', evidence: 'history', unlock: ['relief_procession', 'bas_reliefs'], illus: 'procession',
    name: { en: 'King Suryavarman II', km: 'ព្រះបាទសូរ្យវរ្ម័នទី២' },
    period: { en: 'Reigned c. 1113 – c. 1150', km: 'សោយរាជ្យ ប្រហែល ១១១៣ – ១១៥០' },
    text: {
      en: 'The king under whom Angkor Wat was built. In the Historic Procession relief he sits enthroned among his court, and short inscriptions name him with his posthumous title, Paramavishnuloka, "he who has gone to the supreme world of Vishnu".',
      km: 'ព្រះមហាក្សត្រដែលអង្គរវត្តត្រូវបានកសាងក្នុងរជ្ជកាលរបស់ព្រះអង្គ។ នៅក្នុងចម្លាក់ក្បួនដង្ហែប្រវត្តិសាស្ត្រ ព្រះអង្គគង់លើបល្ល័ង្កក្នុងចំណោមរាជវាំង ហើយសិលាចារឹកខ្លីៗហៅព្រះនាមព្រះអង្គក្រោយសុគតថា បរមវិស្ណុលោក «អ្នកដែលបានយាងទៅកាន់លោកដ៏ឧត្តមរបស់ព្រះវិស្ណុ»។',
    },
  },
  {
    id: 'divakarapandita', evidence: 'interp', unlock: ['angkor_wat'], illus: 'towers',
    name: { en: 'Divakarapandita', km: 'ទិវាករបណ្ឌិត' },
    period: { en: 'Late 11th – mid 12th century', km: 'ចុងសតវត្សទី១១ – ពាក់កណ្តាលសតវត្សទី១២' },
    text: {
      en: 'A Brahmin priest known from inscriptions, who served several kings and performed the consecration of Suryavarman II. Some scholars suggest he influenced the religious programme of Angkor Wat, but no inscription says so: treat that part as interpretation.',
      km: 'ព្រាហ្មណ៍ម្នាក់ដែលគេស្គាល់តាមសិលាចារឹក ដែលបានបម្រើព្រះមហាក្សត្រជាច្រើនអង្គ ហើយបានធ្វើពិធីអភិសេកព្រះបាទសូរ្យវរ្ម័នទី២។ អ្នកប្រាជ្ញខ្លះលើកឡើងថា លោកមានឥទ្ធិពលលើកម្មវិធីសាសនានៃអង្គរវត្ត ប៉ុន្តែគ្មានសិលាចារឹកណាមួយនិយាយដូច្នេះទេ៖ ផ្នែកនោះគឺជាការបកស្រាយ។',
    },
  },
  {
    id: 'builders', evidence: 'interp', unlock: ['sandstone'], illus: 'quarry',
    name: { en: 'Builders and Stone Carvers', km: 'អ្នកសាងសង់ និងជាងចម្លាក់ថ្ម' },
    period: { en: '12th century', km: 'សតវត្សទី១២' },
    text: {
      en: 'Quarry workers, boatmen, masons and sculptors built the temple, but their names were not recorded. Estimates of the workforce vary widely because no document gives a number. The quality of the carving shows highly organised workshops.',
      km: 'កម្មករយកថ្ម អ្នកចែវទូក ជាងសំណង់ និងជាងចម្លាក់បានកសាងប្រាសាទនេះ ប៉ុន្តែឈ្មោះរបស់ពួកគេមិនត្រូវបានកត់ត្រាទេ។ ការប៉ាន់ស្មានចំនួនកម្មករខុសគ្នាខ្លាំង ព្រោះគ្មានឯកសារណាផ្តល់តួលេខ។ គុណភាពចម្លាក់បង្ហាញពីរោងជាងដែលមានការរៀបចំយ៉ាងល្អ។',
    },
  },
  {
    id: 'dancers', evidence: 'tradition', unlock: ['devatas'], illus: 'devata',
    name: { en: 'Devatas and Classical Dance', km: 'ទេវតា និងរបាំបុរាណ' },
    period: { en: '12th century to today', km: 'សតវត្សទី១២ ដល់បច្ចុប្បន្ន' },
    text: {
      en: 'The carved female divinities of Angkor Wat are a lasting source of inspiration for Cambodian classical dance. The Royal Ballet of Cambodia was proclaimed a Masterpiece of the Oral and Intangible Heritage of Humanity by UNESCO in 2003. Links between the carvings and today\'s dance are a living tradition, not a record of 12th-century choreography.',
      km: 'ទេវតាដែលឆ្លាក់នៅអង្គរវត្ត គឺជាប្រភពបំផុសគំនិតជានិច្ចសម្រាប់របាំបុរាណខ្មែរ។ របាំព្រះរាជទ្រព្យកម្ពុជាត្រូវបានយូណេស្កូប្រកាសជាស្នាដៃបេតិកភណ្ឌផ្ទាល់មាត់ និងអរូបីនៃមនុស្សជាតិនៅឆ្នាំ២០០៣។ ទំនាក់ទំនងរវាងចម្លាក់ និងរបាំសព្វថ្ងៃ គឺជាប្រពៃណីរស់ មិនមែនជាកំណត់ត្រានៃក្បាច់រាំសតវត្សទី១២ទេ។',
    },
  },
  {
    id: 'ta_reach', evidence: 'tradition', unlock: ['west_gopura'], illus: 'gopura',
    name: { en: 'Ta Reach', km: 'តារាជ' },
    period: { en: 'Venerated today', km: 'ត្រូវបានគោរពបូជាសព្វថ្ងៃ' },
    text: {
      en: 'The eight-armed statue of Vishnu in the southern gateway of the western entrance is honoured by local people as Ta Reach, a guardian spirit. Visitors often see offerings of incense and flowers in front of it.',
      km: 'រូបសំណាកព្រះវិស្ណុប្រាំបីដៃនៅក្នុងខ្លោងទ្វារខាងត្បូងនៃច្រកចូលខាងលិច ត្រូវបានប្រជាជនក្នុងតំបន់គោរពជា តារាជ ដែលជាអ្នកតាការពារ។ ភ្ញៀវតែងឃើញការសែនធូប និងផ្កានៅពីមុខរូបនេះ។',
    },
  },
  {
    id: 'zhou_daguan', evidence: 'history', unlock: ['laterite_wall', 'terrace_honour'], illus: 'wall',
    name: { en: 'Zhou Daguan', km: 'ជីវ តាក្វាន់' },
    period: { en: 'Visited 1296–1297', km: 'មកដល់ ១២៩៦–១២៩៧' },
    text: {
      en: 'A member of a Chinese embassy of the Yuan dynasty who stayed at Angkor for about a year. His account, known in English as "A Record of Cambodia", is the only detailed eyewitness description of daily life in the Khmer capital that survives.',
      km: 'សមាជិកនៃបេសកកម្មការទូតចិនសម័យរាជវង្សយាន ដែលបានស្នាក់នៅអង្គរប្រហែលមួយឆ្នាំ។ កំណត់ហេតុរបស់លោក គឺជាការពិពណ៌នាលម្អិតតែមួយគត់ដោយសាក្សីផ្ទាល់ភ្នែក អំពីជីវភាពប្រចាំថ្ងៃនៅរាជធានីខ្មែរ ដែលនៅសល់មកដល់សព្វថ្ងៃ។',
    },
  },
  {
    id: 'madalena', evidence: 'history', unlock: ['naga_causeway'], illus: 'naga',
    name: { en: 'António da Madalena', km: 'អាន់តូនីញ៉ូ ដា ម៉ាដាឡេណា' },
    period: { en: 'Visited 1586', km: 'មកដល់ ១៥៨៦' },
    text: {
      en: 'A Portuguese Capuchin friar and one of the first Europeans known to have visited Angkor Wat. His description was written down by the historian Diogo do Couto: he called it a building "of such extraordinary construction" that it could not be described with a pen.',
      km: 'បព្វជិតកាពូស៊ីនជនជាតិព័រទុយហ្គាល់ និងជាជនជាតិអឺរ៉ុបដំបូងគេម្នាក់ដែលគេដឹងថាបានមកទស្សនាអង្គរវត្ត។ ការពិពណ៌នារបស់លោកត្រូវបានកត់ត្រាដោយអ្នកប្រវត្តិវិទូ ឌីអូហ្គូ ដូ កូតូ។',
    },
  },
  {
    id: 'kazufusa', evidence: 'history', unlock: ['preah_poan'], illus: 'buddha',
    name: { en: 'Morimoto Ukondayu Kazufusa', km: 'ម៉ូរីម៉ូតូ អ៊ូកុនដាយូ កាហ្ស៊ូហ្វូសា' },
    period: { en: 'Visited 1632', km: 'មកដល់ ១៦៣២' },
    text: {
      en: 'A Japanese visitor who wrote an ink inscription in the Preah Poan in 1632, recording that he had come to dedicate Buddha images. Japanese pilgrims of the time believed Angkor Wat was Jetavana, the monastery of the Buddha.',
      km: 'ភ្ញៀវជនជាតិជប៉ុនដែលបានសរសេរសិលាចារឹកដោយទឹកខ្មៅនៅព្រះពាន់ក្នុងឆ្នាំ១៦៣២ ដោយកត់ត្រាថាលោកបានមកថ្វាយព្រះពុទ្ធរូប។ អ្នកធម្មយាត្រាជប៉ុននៅសម័យនោះជឿថា អង្គរវត្តគឺជាវត្តជេតពន ដែលជាវត្តរបស់ព្រះពុទ្ធ។',
    },
  },
  {
    id: 'mouhot', evidence: 'history', unlock: ['libraries', 'east_gate'], illus: 'library',
    name: { en: 'Henri Mouhot', km: 'ហង់រី មូអូ' },
    period: { en: 'Visited 1860', km: 'មកដល់ ១៨៦០' },
    text: {
      en: 'A French naturalist whose travel notes, published after his death in 1861, made Angkor famous in Europe. He is often wrongly called its "discoverer": monks lived at Angkor Wat and Cambodians and foreign visitors knew it long before him.',
      km: 'អ្នកធម្មជាតិវិទ្យាជនជាតិបារាំង ដែលកំណត់ហេតុធ្វើដំណើររបស់លោក ត្រូវបានបោះពុម្ពក្រោយមរណភាពរបស់លោកនៅឆ្នាំ១៨៦១ ហើយបានធ្វើឱ្យអង្គរល្បីល្បាញនៅអឺរ៉ុប។ លោកតែងត្រូវបានគេហៅខុសថាជា «អ្នករកឃើញ»៖ ព្រះសង្ឃរស់នៅអង្គរវត្ត ហើយប្រជាជនខ្មែរ និងភ្ញៀវបរទេសបានស្គាល់វាយូរមកហើយមុនលោក។',
    },
  },
  {
    id: 'pisnokar', evidence: 'legend', unlock: ['central_sanctuary', 'bakan'], illus: 'towers',
    name: { en: 'Preah Pisnokar', km: 'ព្រះពិស្ណុការ' },
    period: { en: 'Khmer legend', km: 'រឿងព្រេងខ្មែរ' },
    text: {
      en: 'In a Khmer legend, the divine architect Preah Pisnokar built Angkor Wat at the command of the god Indra. The story is cherished as part of Cambodian culture; historically the temple was built by people over several decades.',
      km: 'ក្នុងរឿងព្រេងខ្មែរ ស្ថាបត្យករទេព ព្រះពិស្ណុការ បានកសាងអង្គរវត្តតាមបញ្ជារបស់ព្រះឥន្ទ្រ។ រឿងនេះត្រូវបានស្រឡាញ់ជាផ្នែកមួយនៃវប្បធម៌ខ្មែរ។ តាមប្រវត្តិសាស្ត្រ ប្រាសាទនេះត្រូវបានកសាងដោយមនុស្សក្នុងរយៈពេលជាច្រើនទសវត្សរ៍។',
    },
  },
];

/** Fact & Fiction: a common claim, and what the evidence says. Unlocked like PEOPLE. */
export const CLAIMS = [
  {
    id: 'always_buddhist', unlock: ['angkor_wat'], verdict: 'fiction',
    claim: { en: 'Angkor Wat was always a Buddhist temple.', km: 'អង្គរវត្តតែងតែជាវត្តព្រះពុទ្ធសាសនា។' },
    fact: {
      en: 'It was built in the 12th century as a Hindu temple dedicated to Vishnu. From around the late 13th century it gradually came into Theravada Buddhist use, and it remains an active Buddhist site today.',
      km: 'វាត្រូវបានកសាងនៅសតវត្សទី១២ ជាប្រាសាទហិណ្ឌូឧទ្ទិសដល់ព្រះវិស្ណុ។ ចាប់ពីប្រហែលចុងសតវត្សទី១៣ វាបានប្តូរបន្តិចម្តងៗមកប្រើសម្រាប់ព្រះពុទ្ធសាសនាថេរវាទ ហើយនៅតែជាទីសក្ការៈព្រះពុទ្ធសាសនារហូតដល់សព្វថ្ងៃ។',
    },
  },
  {
    id: 'lost_city', unlock: ['preah_poan'], verdict: 'fiction',
    claim: { en: 'Angkor Wat was lost in the jungle until a European found it in 1860.', km: 'អង្គរវត្តបាត់ក្នុងព្រៃ រហូតដល់ជនជាតិអឺរ៉ុបម្នាក់រកឃើញនៅឆ្នាំ១៨៦០។' },
    fact: {
      en: 'Angkor Wat was never abandoned. Buddhist monks cared for it, a Portuguese friar described it in 1586, and a Japanese visitor left an inscription here in 1632. Henri Mouhot made it famous in Europe; he did not discover it.',
      km: 'អង្គរវត្តមិនដែលត្រូវបានបោះបង់ចោលទេ។ ព្រះសង្ឃបានថែរក្សាវា បព្វជិតព័រទុយហ្គាល់ម្នាក់បានពិពណ៌នាវានៅឆ្នាំ១៥៨៦ ហើយភ្ញៀវជប៉ុនម្នាក់បានទុកសិលាចារឹកនៅទីនេះនៅឆ្នាំ១៦៣២។ ហង់រី មូអូ បានធ្វើឱ្យវាល្បីនៅអឺរ៉ុប មិនមែនជាអ្នករកឃើញវាទេ។',
    },
  },
  {
    id: 'faces_east', unlock: ['moat_causeway'], verdict: 'fiction',
    claim: { en: 'Like other Khmer temples, Angkor Wat faces east.', km: 'ដូចប្រាសាទខ្មែរដទៃទៀត អង្គរវត្តបែរមុខទៅទិសខាងកើត។' },
    fact: {
      en: 'Angkor Wat faces west, which is unusual: most Khmer temples face east. The reason is still debated; it is often linked to Vishnu, and some scholars see a funerary meaning.',
      km: 'អង្គរវត្តបែរមុខទៅទិសខាងលិច ដែលជារឿងមិនធម្មតា៖ ប្រាសាទខ្មែរភាគច្រើនបែរមុខទៅទិសខាងកើត។ មូលហេតុនៅតែជាប្រធានបទជជែក៖ វាតែងត្រូវបានភ្ជាប់ជាមួយព្រះវិស្ណុ ហើយអ្នកប្រាជ្ញខ្លះយល់ថាវាមានអត្ថន័យទាក់ទងនឹងពិធីបុណ្យសព។',
    },
  },
  {
    id: 'local_stone', unlock: ['sandstone'], verdict: 'fiction',
    claim: { en: 'The stone was quarried right next to the temple.', km: 'ថ្មត្រូវបានយកពីកន្លែងជិតប្រាសាទ។' },
    fact: {
      en: 'The sandstone came from quarries at the foot of the Phnom Kulen hills, more than 30 kilometres away. Research published in 2013 traced canals that probably carried many of the blocks most of the way.',
      km: 'ថ្មភក់បានមកពីកន្លែងយកថ្មនៅជើងភ្នំគូលែន ដែលនៅឆ្ងាយជាង ៣០ គីឡូម៉ែត្រ។ ការស្រាវជ្រាវដែលបានបោះពុម្ពនៅឆ្នាំ២០១៣ បានរកឃើញប្រឡាយដែលប្រហែលជាបានដឹកដុំថ្មជាច្រើនស្ទើរតែពេញផ្លូវ។',
    },
  },
  {
    id: 'moat_decoration', unlock: ['moat'], verdict: 'context',
    claim: { en: 'The moat is only decoration.', km: 'គូទឹកគ្រាន់តែជាការតុបតែងប៉ុណ្ណោះ។' },
    fact: {
      en: 'The moat is usually read as the cosmic ocean around Mount Meru. Engineers have also suggested that the water keeps the sandy ground under the temple stable. Both ideas are interpretations, and they may both be true.',
      km: 'គូទឹកជាទូទៅត្រូវបានយល់ថាជាមហាសមុទ្រចក្រវាឡជុំវិញភ្នំព្រះសុមេរុ។ វិស្វករក៏បានលើកឡើងថា ទឹកជួយរក្សាដីខ្សាច់នៅក្រោមប្រាសាទឱ្យមានស្ថិរភាព។ គំនិតទាំងពីរជាការបកស្រាយ ហើយអាចត្រឹមត្រូវទាំងពីរ។',
    },
  },
  {
    id: 'built_at_once', unlock: ['bas_reliefs'], verdict: 'fiction',
    claim: { en: 'Everything at Angkor Wat was finished in the 12th century.', km: 'អ្វីៗទាំងអស់នៅអង្គរវត្តត្រូវបានបញ្ចប់នៅសតវត្សទី១២។' },
    fact: {
      en: 'Most of the temple dates from the reign of Suryavarman II, but it was never quite finished then. Two large relief panels in the north-east of the outer gallery were only carved in the 16th century.',
      km: 'ផ្នែកភាគច្រើននៃប្រាសាទមានតាំងពីរជ្ជកាលព្រះបាទសូរ្យវរ្ម័នទី២ ប៉ុន្តែវាមិនទាន់បានបញ្ចប់ទាំងស្រុងនៅពេលនោះទេ។ ផ្ទាំងចម្លាក់ធំពីរនៅភាគឦសាននៃរោងខាងក្រៅ ទើបតែត្រូវបានឆ្លាក់នៅសតវត្សទី១៦។',
    },
  },
  {
    id: 'all_apsaras', unlock: ['devatas'], verdict: 'context',
    claim: { en: 'All the women carved on the walls are dancing apsaras.', km: 'ស្ត្រីទាំងអស់ដែលឆ្លាក់លើជញ្ជាំង គឺជាអប្សរាកំពុងរាំ។' },
    fact: {
      en: 'Most are standing female divinities, usually called devatas. The name apsara is best kept for the dancing celestial figures, which are far fewer. Visitors often use "apsara" for both.',
      km: 'ភាគច្រើនជាទេពធីតាឈរ ដែលជាទូទៅហៅថា ទេវតា។ ឈ្មោះ អប្សរា គួរប្រើសម្រាប់រូបទេពកំពុងរាំ ដែលមានចំនួនតិចជាងច្រើន។ ភ្ញៀវតែងប្រើពាក្យ «អប្សរា» សម្រាប់ទាំងពីរ។',
    },
  },
  {
    id: 'city_temple', unlock: ['laterite_wall', 'east_gate'], verdict: 'fiction',
    claim: { en: 'Angkor Wat is the whole ancient city of Angkor.', km: 'អង្គរវត្តគឺជាទីក្រុងបុរាណអង្គរទាំងមូល។' },
    fact: {
      en: 'Angkor was a vast urban region with hundreds of temples. Angkor Wat is one temple within it. The walled city of Angkor Thom, just to the north, was built later, under Jayavarman VII.',
      km: 'អង្គរគឺជាតំបន់ទីក្រុងដ៏ធំធេងដែលមានប្រាសាទរាប់រយ។ អង្គរវត្តគឺជាប្រាសាទមួយនៅក្នុងនោះ។ ទីក្រុងមានកំពែង អង្គរធំ នៅខាងជើងបន្តិច ត្រូវបានកសាងក្រោយមក ក្រោមរជ្ជកាលព្រះបាទជ័យវរ្ម័នទី៧។',
    },
  },
];

/** True when any id in `unlock` has been found (places and bas-reliefs share one namespace). */
export function isUnlocked(g, entry) {
  return entry.unlock.some((id) => g.discoveries.has(id) || g.reliefsFound.has(id));
}
