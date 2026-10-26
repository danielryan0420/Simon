import type { LandmarkEntry } from "./types";

export const LANDMARKS: LandmarkEntry[] = [
  // ---- Rookie ----
  { id: "eiffel-tower", name: "Eiffel Tower", country: "France", lat: 48.858, lon: 2.294, region: "Europe", difficulty: "rookie", fact: "Built in 1889, the Eiffel Tower was meant to be torn down after 20 years." },
  { id: "statue-of-liberty", name: "Statue of Liberty", country: "USA", lat: 40.689, lon: -74.045, region: "North America", difficulty: "rookie", fact: "The Statue of Liberty was a gift from France to the USA in 1886." },
  { id: "great-wall", name: "Great Wall of China", country: "China", lat: 40.43, lon: 116.57, region: "Asia", difficulty: "rookie", fact: "The Great Wall was built over centuries by several Chinese dynasties." },
  { id: "pyramids-giza", name: "Great Pyramid of Giza", country: "Egypt", lat: 29.979, lon: 31.134, region: "Africa", difficulty: "rookie", fact: "The Great Pyramid was built around 4,500 years ago as a tomb for Pharaoh Khufu." },
  { id: "big-ben", name: "Big Ben", country: "United Kingdom", lat: 51.5, lon: -0.1246, region: "Europe", difficulty: "rookie", fact: "Big Ben is actually the nickname of the bell, not the clock tower itself." },
  { id: "colosseum", name: "Colosseum", country: "Italy", lat: 41.890, lon: 12.492, region: "Europe", difficulty: "rookie", fact: "The Colosseum could hold over 50,000 spectators for gladiator games." },
  { id: "taj-mahal", name: "Taj Mahal", country: "India", lat: 27.175, lon: 78.042, region: "Asia", difficulty: "rookie", fact: "The Taj Mahal was built by an emperor as a tomb for his beloved wife." },
  { id: "sydney-opera", name: "Sydney Opera House", country: "Australia", lat: -33.857, lon: 151.215, region: "Oceania", difficulty: "rookie", fact: "The Sydney Opera House roof is made of over a million tiles." },
  { id: "christ-redeemer", name: "Christ the Redeemer", country: "Brazil", lat: -22.952, lon: -43.211, region: "South America", difficulty: "rookie", fact: "Christ the Redeemer stands atop Corcovado Mountain overlooking Rio de Janeiro." },
  { id: "mount-fuji", name: "Mount Fuji", country: "Japan", lat: 35.361, lon: 138.728, region: "Asia", difficulty: "rookie", fact: "Mount Fuji is Japan's tallest peak and last erupted in 1707." },
  { id: "niagara-falls", name: "Niagara Falls", country: "Canada/USA", lat: 43.079, lon: -79.075, region: "North America", difficulty: "rookie", fact: "Over 3,000 tons of water flow over Niagara Falls every second." },
  { id: "golden-gate", name: "Golden Gate Bridge", country: "USA", lat: 37.819, lon: -122.478, region: "North America", difficulty: "rookie", fact: "The Golden Gate Bridge's color, International Orange, was chosen to be visible in fog." },

  // ---- Pilot ----
  { id: "machu-picchu", name: "Machu Picchu", country: "Peru", lat: -13.163, lon: -72.545, region: "South America", difficulty: "pilot", fact: "Machu Picchu was built by the Inca in the 15th century and rediscovered in 1911." },
  { id: "petra", name: "Petra", country: "Jordan", lat: 30.329, lon: 35.442, region: "Asia", difficulty: "pilot", fact: "Petra's buildings are carved directly into pink sandstone cliffs." },
  { id: "stonehenge", name: "Stonehenge", country: "United Kingdom", lat: 51.179, lon: -1.826, region: "Europe", difficulty: "pilot", fact: "Stonehenge's massive stones were placed over 4,500 years ago." },
  { id: "chichen-itza", name: "Chichén Itzá", country: "Mexico", lat: 20.683, lon: -88.569, region: "North America", difficulty: "pilot", fact: "Chichén Itzá's pyramid lines up perfectly with the sun on the equinox." },
  { id: "acropolis", name: "Acropolis of Athens", country: "Greece", lat: 37.971, lon: 23.726, region: "Europe", difficulty: "pilot", fact: "The Parthenon temple atop the Acropolis was built around 447 BC." },
  { id: "burj-khalifa", name: "Burj Khalifa", country: "United Arab Emirates", lat: 25.197, lon: 55.274, region: "Asia", difficulty: "pilot", fact: "At 828 meters, the Burj Khalifa is the tallest building in the world." },
  { id: "table-mountain", name: "Table Mountain", country: "South Africa", lat: -33.962, lon: 18.410, region: "Africa", difficulty: "pilot", fact: "Table Mountain is one of the oldest mountains on Earth, around 260 million years old." },
  { id: "angkor-wat", name: "Angkor Wat", country: "Cambodia", lat: 13.412, lon: 103.867, region: "Asia", difficulty: "pilot", fact: "Angkor Wat is the largest religious monument in the world." },
  { id: "neuschwanstein", name: "Neuschwanstein Castle", country: "Germany", lat: 47.557, lon: 10.750, region: "Europe", difficulty: "pilot", fact: "This fairytale castle inspired Disney's Sleeping Beauty castle." },
  { id: "victoria-falls", name: "Victoria Falls", country: "Zambia/Zimbabwe", lat: -17.924, lon: 25.856, region: "Africa", difficulty: "pilot", fact: "Locals call Victoria Falls 'The Smoke That Thunders.'" },
  { id: "uluru", name: "Uluru", country: "Australia", lat: -25.344, lon: 131.036, region: "Oceania", difficulty: "pilot", fact: "Uluru is a massive sandstone rock sacred to the Anangu people." },
  { id: "leaning-tower", name: "Leaning Tower of Pisa", country: "Italy", lat: 43.723, lon: 10.396, region: "Europe", difficulty: "pilot", fact: "The tower started leaning before it was even finished, due to soft ground." },

  // ---- Ace ----
  { id: "easter-island", name: "Easter Island Moai", country: "Chile", lat: -27.113, lon: -109.349, region: "South America", difficulty: "ace", fact: "Easter Island's nearly 1,000 giant statues were carved by the Rapa Nui people." },
  { id: "potala-palace", name: "Potala Palace", country: "China (Tibet)", lat: 29.657, lon: 91.117, region: "Asia", difficulty: "ace", fact: "The Potala Palace sits at over 12,000 feet above sea level in Lhasa." },
  { id: "meteora", name: "Meteora Monasteries", country: "Greece", lat: 39.722, lon: 21.631, region: "Europe", difficulty: "ace", fact: "These monasteries were built atop towering rock pillars starting in the 14th century." },
  { id: "salar-de-uyuni", name: "Salar de Uyuni", country: "Bolivia", lat: -20.133, lon: -67.489, region: "South America", difficulty: "ace", fact: "This is the world's largest salt flat, acting like a giant mirror when wet." },
  { id: "svalbard", name: "Svalbard Global Seed Vault", country: "Norway", lat: 78.236, lon: 15.492, region: "Europe", difficulty: "ace", fact: "This frozen vault stores backup seeds for nearly every crop on Earth." },
  { id: "lalibela", name: "Rock Churches of Lalibela", country: "Ethiopia", lat: 12.031, lon: 39.045, region: "Africa", difficulty: "ace", fact: "These churches were carved downward out of solid volcanic rock in the 12th century." },
  { id: "ha-long-bay", name: "Ha Long Bay", country: "Vietnam", lat: 20.910, lon: 107.184, region: "Asia", difficulty: "ace", fact: "Ha Long Bay has nearly 2,000 limestone islands rising from emerald water." },
  { id: "plitvice", name: "Plitvice Lakes", country: "Croatia", lat: 44.865, lon: 15.582, region: "Europe", difficulty: "ace", fact: "Plitvice's 16 terraced lakes are connected by waterfalls and wooden walkways." },
  { id: "sossusvlei", name: "Sossusvlei Dunes", country: "Namibia", lat: -24.733, lon: 15.800, region: "Africa", difficulty: "ace", fact: "These are some of the tallest sand dunes on Earth, some over 1,000 feet." },
  { id: "bagan", name: "Bagan Temples", country: "Myanmar", lat: 21.172, lon: 94.860, region: "Asia", difficulty: "ace", fact: "Bagan has over 2,000 ancient Buddhist temples spread across its plains." },
];
