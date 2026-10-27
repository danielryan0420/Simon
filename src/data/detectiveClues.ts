/**
 * Clue data for Globe Detective, keyed by the matching COUNTRIES id.
 * Limited to the rookie/pilot tiers so every clue (neighbors, language,
 * landmark, population) is well-documented and kept accurate.
 */
export interface DetectiveClueData {
  /** Bordering countries by name, or an empty array for island nations with no land borders. */
  neighbors: string[];
  language: string;
  landmark: string;
  /** Rough, human-readable population figure — not meant to be exact. */
  population: string;
}

export const DETECTIVE_CLUES: Record<string, DetectiveClueData> = {
  // ---- Rookie ----
  usa: { neighbors: ["Canada", "Mexico"], language: "English", landmark: "the Statue of Liberty", population: "About 335 million people" },
  canada: { neighbors: ["United States"], language: "English and French", landmark: "Niagara Falls", population: "About 39 million people" },
  mexico: { neighbors: ["United States", "Belize", "Guatemala"], language: "Spanish", landmark: "Chichén Itzá", population: "About 130 million people" },
  brazil: { neighbors: ["Argentina", "Bolivia", "Colombia", "Paraguay", "Peru", "Uruguay", "Venezuela"], language: "Portuguese", landmark: "the Christ the Redeemer statue", population: "About 216 million people" },
  uk: { neighbors: ["Ireland"], language: "English", landmark: "Big Ben", population: "About 68 million people" },
  france: { neighbors: ["Belgium", "Germany", "Italy", "Spain", "Switzerland", "Andorra", "Luxembourg", "Monaco"], language: "French", landmark: "the Eiffel Tower", population: "About 68 million people" },
  germany: { neighbors: ["Austria", "Belgium", "Czech Republic", "Denmark", "France", "Luxembourg", "Netherlands", "Poland", "Switzerland"], language: "German", landmark: "the Brandenburg Gate", population: "About 84 million people" },
  italy: { neighbors: ["France", "Austria", "Switzerland", "Slovenia"], language: "Italian", landmark: "the Colosseum", population: "About 59 million people" },
  spain: { neighbors: ["France", "Portugal", "Andorra"], language: "Spanish", landmark: "the Sagrada Família", population: "About 47 million people" },
  russia: { neighbors: ["Belarus", "China", "Estonia", "Finland", "Georgia", "Kazakhstan", "Latvia", "Lithuania", "Mongolia", "North Korea", "Norway", "Poland", "Ukraine", "Azerbaijan"], language: "Russian", landmark: "Red Square", population: "About 144 million people" },
  china: { neighbors: ["Russia", "Mongolia", "North Korea", "Vietnam", "Laos", "Myanmar", "India", "Bhutan", "Nepal", "Pakistan", "Afghanistan", "Tajikistan", "Kyrgyzstan", "Kazakhstan"], language: "Mandarin Chinese", landmark: "the Great Wall of China", population: "About 1.4 billion people" },
  japan: { neighbors: [], language: "Japanese", landmark: "Mount Fuji", population: "About 124 million people" },
  india: { neighbors: ["Pakistan", "China", "Nepal", "Bhutan", "Bangladesh", "Myanmar"], language: "Hindi and English", landmark: "the Taj Mahal", population: "About 1.43 billion people" },
  australia: { neighbors: [], language: "English", landmark: "the Sydney Opera House", population: "About 26 million people" },
  egypt: { neighbors: ["Libya", "Sudan", "Israel"], language: "Arabic", landmark: "the Great Pyramid of Giza", population: "About 112 million people" },
  "south-africa": { neighbors: ["Namibia", "Botswana", "Zimbabwe", "Mozambique", "Eswatini", "Lesotho"], language: "English, Zulu, Xhosa, and Afrikaans, among 11 official languages", landmark: "Table Mountain", population: "About 60 million people" },
  argentina: { neighbors: ["Chile", "Bolivia", "Paraguay", "Brazil", "Uruguay"], language: "Spanish", landmark: "Iguazú Falls", population: "About 46 million people" },
  "south-korea": { neighbors: ["North Korea"], language: "Korean", landmark: "Gyeongbokgung Palace", population: "About 52 million people" },
  kenya: { neighbors: ["Ethiopia", "Somalia", "Tanzania", "Uganda", "South Sudan"], language: "Swahili and English", landmark: "the Maasai Mara National Reserve", population: "About 55 million people" },
  greece: { neighbors: ["Albania", "North Macedonia", "Bulgaria", "Turkey"], language: "Greek", landmark: "the Acropolis of Athens", population: "About 10 million people" },

  // ---- Pilot ----
  nigeria: { neighbors: ["Benin", "Niger", "Chad", "Cameroon"], language: "English", landmark: "Zuma Rock", population: "About 220 million people" },
  morocco: { neighbors: ["Algeria", "Western Sahara"], language: "Arabic and Berber (Tamazight)", landmark: "the Fes el Bali medina", population: "About 37 million people" },
  thailand: { neighbors: ["Myanmar", "Laos", "Cambodia", "Malaysia"], language: "Thai", landmark: "the Grand Palace in Bangkok", population: "About 72 million people" },
  vietnam: { neighbors: ["China", "Laos", "Cambodia"], language: "Vietnamese", landmark: "Ha Long Bay", population: "About 98 million people" },
  indonesia: { neighbors: ["Malaysia", "Papua New Guinea", "Timor-Leste"], language: "Indonesian", landmark: "Mount Bromo", population: "About 277 million people" },
  turkey: { neighbors: ["Greece", "Bulgaria", "Georgia", "Armenia", "Azerbaijan", "Iran", "Iraq", "Syria"], language: "Turkish", landmark: "Pamukkale", population: "About 85 million people" },
  sweden: { neighbors: ["Norway", "Finland"], language: "Swedish", landmark: "the Stockholm archipelago", population: "About 10 million people" },
  norway: { neighbors: ["Sweden", "Finland", "Russia"], language: "Norwegian", landmark: "Trolltunga", population: "About 5.5 million people" },
  poland: { neighbors: ["Germany", "Czech Republic", "Slovakia", "Ukraine", "Belarus", "Lithuania", "Russia"], language: "Polish", landmark: "Wawel Castle", population: "About 37 million people" },
  netherlands: { neighbors: ["Germany", "Belgium"], language: "Dutch", landmark: "the windmills of Kinderdijk", population: "About 18 million people" },
  peru: { neighbors: ["Ecuador", "Colombia", "Brazil", "Bolivia", "Chile"], language: "Spanish and Quechua", landmark: "Machu Picchu", population: "About 34 million people" },
  chile: { neighbors: ["Peru", "Bolivia", "Argentina"], language: "Spanish", landmark: "Torres del Paine", population: "About 19.5 million people" },
  colombia: { neighbors: ["Panama", "Venezuela", "Brazil", "Peru", "Ecuador"], language: "Spanish", landmark: "the Cartagena Old Town", population: "About 52 million people" },
  "new-zealand": { neighbors: [], language: "English and Māori", landmark: "Milford Sound", population: "About 5.2 million people" },
  "saudi-arabia": { neighbors: ["Jordan", "Iraq", "Kuwait", "Qatar", "United Arab Emirates", "Oman", "Yemen"], language: "Arabic", landmark: "the Great Mosque of Mecca", population: "About 36 million people" },
  israel: { neighbors: ["Lebanon", "Syria", "Jordan", "Egypt"], language: "Hebrew and Arabic", landmark: "the Western Wall in Jerusalem's Old City", population: "About 9.8 million people" },
  portugal: { neighbors: ["Spain"], language: "Portuguese", landmark: "the Benagil Cave", population: "About 10.3 million people" },
  switzerland: { neighbors: ["Germany", "France", "Italy", "Austria", "Liechtenstein"], language: "German, French, Italian, and Romansh", landmark: "the Matterhorn", population: "About 8.8 million people" },
  ireland: { neighbors: ["United Kingdom"], language: "English and Irish (Gaelic)", landmark: "the Cliffs of Moher", population: "About 5.1 million people" },
  philippines: { neighbors: [], language: "Filipino and English", landmark: "the Chocolate Hills", population: "About 114 million people" },
};
