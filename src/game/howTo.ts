/** Keys for every "How to play" explainer in Geo Racer, auto-shown once per key and reachable again from a ? button. */
export type HowToKey =
  | "countries"
  | "capitals"
  | "landmarks"
  | "states"
  | "flags"
  | "daily"
  | "worldTour"
  | "timeAttack"
  | "detective"
  | "sportsFind"
  | "sportsName"
  | "race";

export interface HowToContent {
  icon: string;
  title: string;
  /** 1-3 short, concrete steps — kept this short so it's readable in one glance on a phone. */
  steps: string[];
}

export const HOW_TO: Record<HowToKey, HowToContent> = {
  countries: {
    icon: "\u{1F30D}",
    title: "Countries",
    steps: [
      "Read the country name at the top.",
      "Spin the globe and tap anywhere inside its borders.",
      "Land fast and close for more points. Stuck? Try \u{1F4A1} Hint.",
    ],
  },
  capitals: {
    icon: "\u{1F3DB}\u{FE0F}",
    title: "Capitals",
    steps: [
      "Read which country's capital you need to find.",
      "Tap that capital city on the globe.",
      "Closer and faster taps score more points.",
    ],
  },
  landmarks: {
    icon: "\u{1F5FF}",
    title: "Landmarks",
    steps: [
      "Read the landmark's name at the top.",
      "Think about which country it's in, then tap the globe there.",
      "Not sure? Try \u{1F4A1} Hint for the country's name.",
    ],
  },
  states: {
    icon: "\u{1F5FD}",
    title: "US States",
    steps: [
      "Read the state name at the top.",
      "Tap anywhere inside that state's borders.",
      "Try \u{1F4A1} Hint to see its capital city.",
    ],
  },
  flags: {
    icon: "\u{1F6A9}",
    title: "Flags",
    steps: [
      "Look at the flag shown at the top.",
      "Tap the country it belongs to on the globe.",
      "Don't recognize it? Try \u{1F4A1} Hint for a clue.",
    ],
  },
  daily: {
    icon: "\u{1F31F}",
    title: "Daily Challenge",
    steps: [
      "One themed round of questions, once per day.",
      "Tap the globe to answer each question.",
      "Come back tomorrow to keep your streak going!",
    ],
  },
  worldTour: {
    icon: "\u{1F30E}",
    title: "World Tour",
    steps: [
      "Clear every level in a continent to unlock its Boss round.",
      "Earn up to 3 stars per level based on your accuracy.",
      "Beat the Boss round to unlock the next continent.",
    ],
  },
  timeAttack: {
    icon: "⏱️",
    title: "Time Attack",
    steps: [
      "You have 60 seconds on the clock.",
      "Tap the globe as fast as you can for each country.",
      "Chain correct answers in a row for a streak bonus.",
    ],
  },
  detective: {
    icon: "\u{1F575}️",
    title: "Globe Detective",
    steps: [
      "Read the clue, then guess the country on the globe.",
      "Wrong or unsure? Tap \u{1F4A1} for another clue.",
      "Solving a case with fewer clues earns more points!",
    ],
  },
  sportsFind: {
    icon: "\u{1F4CD}",
    title: "Find the City",
    steps: [
      "Read the team name at the top.",
      "Tap that team's home city on the map.",
      "Closer, faster taps score more points.",
    ],
  },
  sportsName: {
    icon: "❓",
    title: "Name the Team",
    steps: [
      "A pin marks a team's home city.",
      "Pick the correct team from the choices shown.",
      "Answer fast for a bigger score.",
    ],
  },
  race: {
    icon: "\u{1F3C1}",
    title: "2-Player Race",
    steps: [
      "Two players take turns answering the same questions.",
      "Pass the device to the other player after each turn.",
      "Whoever scores more after the round wins!",
    ],
  },
};
