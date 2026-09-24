/**
 * Collectible artifacts. Every artifact is a FICTIONAL in-game object: a study replica left by the
 * fictional conservation team (see npcs.js). Their placement is invented. The "context" text
 * describes the real category of object it represents; the "ingame" text is labelled fiction.
 * Positions are Blender metres.
 */
export const ARTIFACTS = [
  {
    id: 'devata_head', model: 'devata', pos: [-86, -70, 3.52], main: true,
    category: { en: 'Khmer sculpture', km: 'ចម្លាក់ខ្មែរ' },
    name: { en: 'Devata Head (study replica)', km: 'ក្បាលទេវតា (គំរូសិក្សា)' },
    context: {
      en: 'Angkor Wat style (first half of the 12th century) devatas wear tall, elaborate diadems and have serene faces with a slight smile. Their headdresses and jewellery vary from figure to figure, which is why researchers catalogue them individually.',
      km: 'ទេវតារចនាប័ទ្មអង្គរវត្ត (ពាក់កណ្តាលទីមួយនៃសតវត្សទី១២) ពាក់មកុដខ្ពស់ និងល្អិតល្អន់ ហើយមានទឹកមុខស្ងប់ស្ងាត់ញញឹមបន្តិច។ គ្រឿងពាក់ក្បាល និងគ្រឿងអលង្ការខុសគ្នាពីរូបមួយទៅរូបមួយ ដែលជាហេតុធ្វើឱ្យអ្នកស្រាវជ្រាវចុះបញ្ជីពួកគេម្តងមួយៗ។',
    },
    ingame: {
      en: 'A plaster study cast used by the fictional conservation team to compare carving styles. No original sculpture is ever removed from the temple.',
      km: 'គំរូសិក្សាធ្វើពីម្នាងសិលា ដែលក្រុមអភិរក្សប្រឌិតប្រើដើម្បីប្រៀបធៀបរចនាប័ទ្មចម្លាក់។ គ្មានចម្លាក់ដើមណាមួយត្រូវបានយកចេញពីប្រាសាទទេ។',
    },
  },
  {
    id: 'inscription', model: 'stele', pos: [59.8, -317.5, 2.0], main: true,
    category: { en: 'Ancient inscription', km: 'សិលាចារឹកបុរាណ' },
    name: { en: 'Inscription Rubbing (Old Khmer)', km: 'ក្រដាសផ្តិតសិលាចារឹក (ខ្មែរបុរាណ)' },
    context: {
      en: 'Inscriptions in Sanskrit and Old Khmer, carved on steles and doorframes, are the main written sources for the history of Angkor. The Khmer script developed from a script of southern India. Sanskrit texts were often poetic praise; Old Khmer texts often record practical matters such as land, donations and temple staff.',
      km: 'សិលាចារឹកជាភាសាសំស្ក្រឹត និងខ្មែរបុរាណ ដែលឆ្លាក់លើស្តម្ភ និងក្របទ្វារ គឺជាប្រភពសរសេរសំខាន់សម្រាប់ប្រវត្តិសាស្ត្រអង្គរ។ អក្សរខ្មែរបានវិវត្តពីអក្សរមួយនៃប្រទេសឥណ្ឌាខាងត្បូង។ អត្ថបទសំស្ក្រឹតជាញឹកញាប់ជាកំណាព្យសរសើរ ចំណែកអត្ថបទខ្មែរបុរាណជាញឹកញាប់កត់ត្រារឿងជាក់ស្តែង ដូចជាដីធ្លី ការបរិច្ចាគ និងបុគ្គលិកប្រាសាទ។',
    },
    ingame: {
      en: 'A paper rubbing made by the fictional team for study. The characters shown on it are decorative and are not a real inscription.',
      km: 'ក្រដាសផ្តិតដែលក្រុមប្រឌិតធ្វើឡើងសម្រាប់ការសិក្សា។ តួអក្សរដែលបង្ហាញលើវាគ្រាន់តែជាការតុបតែង មិនមែនជាសិលាចារឹកពិតទេ។',
    },
  },
  {
    id: 'conch', model: 'conch', pos: [45.5, 28, 10.0], main: true,
    category: { en: 'Ceremonial object', km: 'វត្ថុពិធី' },
    name: { en: 'Ceremonial Conch (śaṅkha)', km: 'ស័ង្ខពិធី' },
    context: {
      en: 'The conch shell is sounded in Hindu and Buddhist ceremonies and is one of the attributes held by Vishnu. Bronze conch-shaped vessels and conch stands from the Angkor period are known in museum collections, and conches are still blown in Cambodian ceremonies today.',
      km: 'ស័ង្ខត្រូវបានផ្លុំក្នុងពិធីហិណ្ឌូ និងព្រះពុទ្ធសាសនា ហើយជាគ្រឿងកាន់មួយរបស់ព្រះវិស្ណុ។ វត្ថុលង្ហិនរាងស័ង្ខ និងជើងទម្រស័ង្ខពីសម័យអង្គរ មាននៅក្នុងបណ្តុំសារមន្ទីរ ហើយស័ង្ខនៅតែត្រូវបានផ្លុំក្នុងពិធីនៅកម្ពុជាសព្វថ្ងៃ។',
    },
    ingame: {
      en: 'A modern shell used by the fictional team in a demonstration of temple sounds.',
      km: 'ស័ង្ខទំនើបមួយ ដែលក្រុមប្រឌិតប្រើក្នុងការបង្ហាញសំឡេងប្រាសាទ។',
    },
  },
  {
    id: 'finial', model: 'finial', pos: [100, -434, 0.0], main: true,
    category: { en: 'Architectural fragment', km: 'បំណែកស្ថាបត្យកម្ម' },
    name: { en: 'Lotus-bud Finial (cast)', km: 'កំពូលរាងផ្កាឈូក (គំរូ)' },
    context: {
      en: 'Angkorian towers are built of stepped tiers crowned by a lotus-bud shaped top, and the corners of the tiers carry small antefixes that repeat the tower in miniature. Fallen fragments are recorded and, where possible, returned to their original position during restoration (anastylosis).',
      km: 'ប្រាង្គសម័យអង្គរត្រូវបានសាងសង់ជាថ្នាក់ៗ ហើយបញ្ចប់ដោយកំពូលរាងផ្កាឈូកកំពុងក្រពុំ ហើយជ្រុងនៃថ្នាក់នីមួយៗមានចម្លាក់តូចៗដែលធ្វើតាមរូបប្រាង្គក្នុងទំហំតូច។ បំណែកដែលធ្លាក់ត្រូវបានកត់ត្រា ហើយប្រសិនបើអាច ត្រូវបានដាក់ត្រឡប់ទៅទីតាំងដើមវិញក្នុងពេលជួសជុល (អាណាស្ទីឡូស៊ីស)។',
    },
    ingame: {
      en: 'A resin cast of a fragment type, used by the fictional team to train volunteers in documentation.',
      km: 'គំរូជ័រនៃប្រភេទបំណែកមួយ ដែលក្រុមប្រឌិតប្រើដើម្បីបណ្តុះបណ្តាលអ្នកស្ម័គ្រចិត្តក្នុងការកត់ត្រាឯកសារ។',
    },
  },
  {
    id: 'manuscript', model: 'manuscript', pos: [101.8, 40, 3.52], main: true,
    category: { en: 'Traditional Khmer object', km: 'វត្ថុប្រពៃណីខ្មែរ' },
    name: { en: 'Palm-leaf Manuscript (sleuk rith)', km: 'សាស្ត្រាស្លឹករឹត' },
    context: {
      en: 'Buddhist texts in Cambodia were traditionally written on prepared palm leaves (sleuk rith), incised with a stylus and blackened, then bound between wooden covers. The craft is still practised, and many manuscripts are being preserved and digitised.',
      km: 'គម្ពីរព្រះពុទ្ធសាសនានៅកម្ពុជា តាមប្រពៃណីត្រូវបានសរសេរលើស្លឹករឹតដែលរៀបចំរួច ចារដោយដែកចារ ហើយលាបពណ៌ខ្មៅ រួចចងភ្ជាប់រវាងគម្របឈើ។ សិប្បកម្មនេះនៅតែត្រូវបានអនុវត្ត ហើយសាស្ត្រាជាច្រើនកំពុងត្រូវបានថែរក្សា និងធ្វើឌីជីថល។',
    },
    ingame: {
      en: 'A blank practice manuscript made for the fictional team\'s workshop. It contains no sacred text.',
      km: 'សាស្ត្រាអនុវត្តទទេមួយ ដែលធ្វើឡើងសម្រាប់សិក្ខាសាលារបស់ក្រុមប្រឌិត។ វាមិនមានអត្ថបទពិសិដ្ឋទេ។',
    },
  },
  {
    id: 'ukondayu', model: 'letter', pos: [-31, -71.4, 3.52], main: false, secret: true,
    category: { en: 'Historical document', km: 'ឯកសារប្រវត្តិសាស្ត្រ' },
    name: { en: 'Notes on the 1632 Inscription', km: 'កំណត់ត្រាអំពីសិលាចារឹកឆ្នាំ១៦៣២' },
    context: {
      en: 'In 1632 the Japanese visitor Morimoto Ukondayū Kazufusa wrote an inscription in ink in the Preah Poan, recording his long journey and his offering of Buddha images for his parents. Japanese visitors of that time believed Angkor Wat to be Jetavana, the monastery associated with the Buddha in India; a Japanese plan of Angkor Wat from the same period survives.',
      km: 'នៅឆ្នាំ១៦៣២ អ្នកទស្សនាជនជាតិជប៉ុន ម៉ូរិម៉ូតូ អ៊ូកុនដាយូ កាស៊ូហ្វូសា បានសរសេរសិលាចារឹកដោយទឹកខ្មៅនៅព្រះពាន់ ដោយកត់ត្រាដំណើរដ៏វែងឆ្ងាយរបស់គាត់ និងការថ្វាយព្រះពុទ្ធរូបសម្រាប់ឪពុកម្តាយរបស់គាត់។ អ្នកទស្សនាជប៉ុននាសម័យនោះជឿថា អង្គរវត្តគឺជាវត្តជេតពន ដែលទាក់ទងនឹងព្រះពុទ្ធនៅប្រទេសឥណ្ឌា។ ប្លង់ជប៉ុនមួយនៃអង្គរវត្តពីសម័យដដែលនៅគង់វង្ស។',
    },
    ingame: {
      en: 'Secret: a fictional researcher\'s notebook page summarising the inscription.',
      km: 'អាថ៌កំបាំង៖ ទំព័រសៀវភៅកត់ត្រារបស់អ្នកស្រាវជ្រាវប្រឌិត ដែលសង្ខេបសិលាចារឹកនេះ។',
    },
  },
];
