import "./style.css";
import { GlobeScene } from "./render/globe";
import { el, clear, chip } from "./ui/dom";
import { getTargets, countryNameForTargetId, MODES, type Mode } from "./game/targets";
import { buildRoundQueue, type QuestionFilter } from "./game/questions";
import { buildDailyChallenge, dateKey, isNextDay } from "./game/daily";
import { mulberry32, shuffle } from "./game/rng";
import { greatCircleDistanceKm } from "./game/geo";
import { scoreAnswer, type AnswerScore, type Rating } from "./game/scoring";
import { countryContainsPoint } from "./game/countryHitTest";
import { stateContainsPoint } from "./game/stateHitTest";
import { loadWorldGeo, loadStatesGeo, type GeoCollection } from "./data/worldGeo";
import { levelForXp, xpForAnswer, newlyUnlockedForLevel, unlockedAtLevel, UNLOCKABLES } from "./game/progression";
import {
  loadSave,
  saveSave,
  deleteSave,
  defaultSave,
  recordLearned,
  addLeaderboardEntry,
  recordWeeklyScore,
  loadSettings,
  saveSettings,
  type SaveData,
  type AppSettings,
} from "./game/storage";
import { ROUND_LENGTH, RACE_ROUND_LENGTH, ANSWER_TIMEOUT_MS, MASTERY_RATINGS, TIME_ATTACK_DURATION_MS } from "./game/constants";
import * as sfx from "./game/sfx";
import * as music from "./game/music";
import { renderLearnedMap } from "./render/learnedMap";
import { ACHIEVEMENTS, newlyUnlockedAchievements, type Achievement } from "./game/achievements";
import {
  buildCampaign,
  levelsForRegion,
  isLevelUnlocked,
  isRegionUnlocked,
  starsForRatings,
  selectBossRoundCountryIds,
  CAMPAIGN_REGIONS,
  type CampaignLevel,
} from "./game/campaign";
import {
  AVATARS,
  PROFILE_COLORS,
  loadProfiles,
  saveProfiles,
  addProfile,
  setActiveProfile,
  removeProfile,
  ensureActiveProfile,
  nextAvatar,
  nextColor,
  weeklyLeaderboard,
  activeProfileMeta,
  leaderboardEntryForActiveProfile,
  type ProfilesData,
} from "./game/profiles";
import { migrateLegacySave } from "./game/migration";
import {
  buildDetectiveCases,
  CLUE_ORDER,
  isCorrectGuess,
  MAX_CLUES,
  pointsForClues,
  xpForCase,
  type ClueKind,
  type DetectiveCase,
} from "./game/detective";
import {
  badgeSvgFor,
  buildReverseChoices,
  buildSportsRoundQueue,
  pointsForReverseGuess,
  scoreSportsGuess,
  SPORTS_ROUND_LENGTH,
  teamsForLeague,
  xpForSportsPoints,
  type LeagueFilter,
} from "./game/sportsMap";
import type { SportsTeam } from "./data/sportsTeams";
import type { Difficulty, GeoTarget, Region } from "./data/types";

function starString(n: number): string {
  return "⭐".repeat(n) + "☆".repeat(Math.max(0, 3 - n));
}

const REGIONS: Region[] = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "rookie", label: "Rookie" },
  { id: "pilot", label: "Pilot" },
  { id: "ace", label: "Ace" },
  { id: "hard", label: "Hard" },
];

type SportsRoundKind = "find" | "name";

const LEAGUE_CHIPS: { id: LeagueFilter; label: string }[] = [
  { id: "MLB", label: "\u{26BE} MLB" },
  { id: "NBA", label: "\u{1F3C0} NBA" },
  { id: "mixed", label: "\u{1F3C6} Mixed" },
];

const SPORTS_KIND_CHIPS: { id: SportsRoundKind; label: string }[] = [
  { id: "find", label: "\u{1F4CD} Find the City" },
  { id: "name", label: "❓ Name the Team" },
];

/** Camera target that frames the continental US and Canada (Toronto included) at round start. */
const NORTH_AMERICA_CENTER = { lat: 41, lon: -96 };
const NORTH_AMERICA_ZOOM = 1.6;

type Screen =
  | "home"
  | "modeSelect"
  | "difficultySelect"
  | "playing"
  | "roundResult"
  | "sessionSummary"
  | "settings"
  | "stats"
  | "achievements"
  | "learned"
  | "raceSetup"
  | "racePlaying"
  | "raceRoundResult"
  | "raceSummary"
  | "tutorial"
  | "worldTour"
  | "campaignLevels"
  | "timeAttackPlaying"
  | "timeAttackResult"
  | "family"
  | "detectivePlaying"
  | "detectiveCaseResult"
  | "detectiveSummary"
  | "sportsSetup"
  | "sportsPlaying"
  | "sportsRoundResult"
  | "sportsSummary";

interface TutorialStep {
  icon: string;
  title: string;
  body: string;
}

const TUTORIAL_STEP_MS = 12000;
const TUTORIAL_STEPS: TutorialStep[] = [
  { icon: "\u{1F30D}", title: "Welcome, Explorer!", body: "Drag the globe to spin it. Pinch (or scroll) to zoom in and out." },
  { icon: "\u{1F449}", title: "Tap to Answer", body: "Read the prompt at the top, find the spot, and tap it on the globe." },
  { icon: "⏱️", title: "Beat the Clock", body: "Answer fast and land close to the target for PERFECT and GREAT scores." },
  { icon: "\u{1F525}", title: "Build a Streak", body: "Chain correct answers in a row to build a combo for bonus points." },
  { icon: "\u{1F3C6}", title: "Explore More", body: "Try the Daily Challenge and 2-Player Race, and unlock skins & themes as you level up!" },
];

function systemPrefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface RoundState {
  mode: Mode;
  difficulty: Difficulty | null;
  isDaily: boolean;
  queue: GeoTarget[];
  index: number;
  score: number;
  streak: number;
  xpEarned: number;
  questionStart: number;
  timeoutHandle: number | null;
  tickHandle: number | null;
  /** Set when this round is a World Tour campaign level, so results can award stars. */
  campaignLevelId: string | null;
  ratings: Rating[];
}

interface TimeAttackState {
  queue: GeoTarget[];
  index: number;
  score: number;
  correct: number;
  streak: number;
  startTime: number;
  tickHandle: number | null;
  advanceHandle: number | null;
}

interface RaceState {
  queue: GeoTarget[];
  index: number;
  names: [string, string];
  scores: [number, number];
  turn: 0 | 1;
  questionStart: number;
}

interface DetectiveState {
  queue: DetectiveCase[];
  index: number;
  cluesRevealed: number;
  score: number;
  xpEarned: number;
  solvedCount: number;
  flawlessCount: number;
  advanceHandle: number | null;
}

interface SportsRoundState {
  kind: SportsRoundKind;
  league: LeagueFilter;
  queue: SportsTeam[];
  index: number;
  score: number;
  streak: number;
  xpEarned: number;
  reverseCorrect: number;
  questionStart: number;
  timeoutHandle: number | null;
  tickHandle: number | null;
  /** Multiple-choice options for the current "Name the Team" question, rebuilt per question. */
  choices: SportsTeam[];
}

class GeoRacerApp {
  private uiContent: HTMLElement;
  private globe: GlobeScene;
  private save: SaveData;
  private settings: AppSettings;
  private profiles: ProfilesData;
  private profileId: string;
  private screen: Screen = "home";
  private pendingMode: Mode = "countries";
  private pendingDifficulty: Difficulty = "rookie";
  private pendingRegions: Region[] = [];
  private round: RoundState | null = null;
  private race: RaceState | null = null;
  private timeAttack: TimeAttackState | null = null;
  private timeAttackTimerFill: HTMLElement | null = null;
  private timeAttackClockEl: HTMLElement | null = null;
  private detective: DetectiveState | null = null;
  private lastDetectiveResult: { detectiveCase: DetectiveCase; cluesRevealed: number; points: number } | null = null;
  private sports: SportsRoundState | null = null;
  private pendingSportsLeague: LeagueFilter = "MLB";
  private pendingSportsKind: SportsRoundKind = "find";
  private lastSportsResult: { team: SportsTeam; kind: SportsRoundKind; score: AnswerScore | null; points: number; correct: boolean } | null = null;
  private lastResult: { target: GeoTarget; score: AnswerScore; mode: Mode } | null = null;
  private raceLastResult: { target: GeoTarget; scores: [AnswerScore, AnswerScore] } | null = null;
  private activeTapHandler: ((lat: number, lon: number) => void) | null = null;
  private achievementToastRoot: HTMLElement;
  private achievementToastQueue: Achievement[] = [];
  private achievementToastShowing = false;
  private tutorialTimer: number | null = null;
  private tutorialRaf: number | null = null;
  private countryGeo: GeoCollection | null = null;
  private stateGeo: GeoCollection | null = null;

  constructor(globeRoot: HTMLElement, uiRoot: HTMLElement) {
    migrateLegacySave();
    this.profiles = ensureActiveProfile(loadProfiles());
    saveProfiles(this.profiles);
    this.profileId = this.profiles.activeProfileId!;
    this.save = loadSave(this.profileId);
    this.settings = loadSettings();
    this.globe = new GlobeScene(globeRoot, { onTap: (lat, lon) => this.activeTapHandler?.(lat, lon) });
    this.globe.setTheme(this.settings.selectedTheme);
    this.applyAccessibility();
    loadWorldGeo().then((geo) => {
      this.countryGeo = geo;
    });
    loadStatesGeo().then((geo) => {
      this.stateGeo = geo;
    });

    const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionMedia.addEventListener("change", () => this.applyAccessibility());

    this.uiContent = el("div", { id: "ui-content", style: "flex:1; display:flex; flex-direction:column; min-height:0;" });
    uiRoot.append(this.uiContent);

    const muteBtn = el("button", {
      class: "icon-btn mute-fixed",
      style: "position:fixed; z-index:50;",
      "aria-label": sfx.isMuted() ? "Unmute sound effects" : "Mute sound effects",
      onClick: () => {
        sfx.toggleMuted();
        muteBtn.textContent = sfx.isMuted() ? "\u{1F507}" : "\u{1F50A}";
        muteBtn.setAttribute("aria-label", sfx.isMuted() ? "Unmute sound effects" : "Mute sound effects");
      },
    });
    muteBtn.textContent = sfx.isMuted() ? "\u{1F507}" : "\u{1F50A}";
    muteBtn.style.top = "max(12px, var(--safe-top))";
    muteBtn.style.right = "max(12px, var(--safe-right))";
    document.body.append(muteBtn);

    const musicBtn = el("button", {
      class: "icon-btn mute-fixed",
      style: "position:fixed; z-index:50;",
      "aria-label": music.isMusicOn() ? "Turn music off" : "Turn music on",
      onClick: () => {
        music.toggleMusic();
        musicBtn.textContent = music.isMusicOn() ? "\u{1F3B5}" : "\u{1F3B6}";
        musicBtn.setAttribute("aria-label", music.isMusicOn() ? "Turn music off" : "Turn music on");
      },
    });
    musicBtn.textContent = music.isMusicOn() ? "\u{1F3B5}" : "\u{1F3B6}";
    musicBtn.style.top = "max(12px, var(--safe-top))";
    musicBtn.style.right = "max(64px, calc(var(--safe-right) + 52px))";
    document.body.append(musicBtn);

    this.achievementToastRoot = el("div", { class: "achievement-toast-root" });
    document.body.append(this.achievementToastRoot);

    if (this.settings.hasSeenTutorial) this.renderHome();
    else this.renderTutorial(0);
  }

  // ---------- ACCESSIBILITY ----------
  private applyAccessibility(): void {
    const a11y = this.settings.accessibility;
    document.documentElement.classList.toggle("a11y-large-text", a11y.largeText);
    document.documentElement.classList.toggle("a11y-colorblind", a11y.colorBlindMode);
    document.documentElement.classList.toggle("a11y-reduced-motion", a11y.reducedMotion);
    this.globe.setColorBlindMode(a11y.colorBlindMode);
    this.globe.setReducedMotion(a11y.reducedMotion || systemPrefersReducedMotion());
  }

  // ---------- FIRST-RUN TUTORIAL ----------
  private clearTutorialTimers(): void {
    if (this.tutorialTimer !== null) window.clearTimeout(this.tutorialTimer);
    if (this.tutorialRaf !== null) cancelAnimationFrame(this.tutorialRaf);
    this.tutorialTimer = null;
    this.tutorialRaf = null;
  }

  private renderTutorial(stepIndex: number): void {
    this.setScreen("tutorial");
    this.globe.setAutoRotate(true);
    this.clearTutorialTimers();
    const step = TUTORIAL_STEPS[stepIndex];
    const isLast = stepIndex + 1 >= TUTORIAL_STEPS.length;
    const reduceMotion = this.settings.accessibility.reducedMotion || systemPrefersReducedMotion();

    const dots = el("div", { class: "chip-row", style: "margin:4px 0 16px;" }, TUTORIAL_STEPS.map((_, i) =>
      el("span", { style: `width:8px; height:8px; border-radius:50%; display:inline-block; background:${i === stepIndex ? "var(--accent)" : "rgba(255,255,255,0.25)"};` }, [])
    ));

    const progressFill = el("div", { class: "timer-bar-fill", style: "width:0%;" });
    const panel = el("div", { class: "screen-center" }, [
      el("div", { style: "font-size:3rem; line-height:1;" }, [step.icon]),
      el("h2", {}, [step.title]),
      el("p", {}, [step.body]),
      dots,
      reduceMotion ? el("div") : el("div", { class: "timer-bar-track" }, [progressFill]),
      el("div", { class: "btn-row", style: "margin-top:16px;" }, [
        el("button", { class: "btn", onClick: () => this.finishTutorial() }, ["Skip"]),
        el("button", {
          class: "btn btn-primary",
          onClick: () => this.advanceTutorial(stepIndex),
        }, [isLast ? "Let's Go! \u{1F680}" : "Next →"]),
      ]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);

    if (!reduceMotion) {
      const start = performance.now();
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / TUTORIAL_STEP_MS);
        progressFill.style.width = `${t * 100}%`;
        if (t < 1) this.tutorialRaf = requestAnimationFrame(tick);
      };
      this.tutorialRaf = requestAnimationFrame(tick);
      this.tutorialTimer = window.setTimeout(() => this.advanceTutorial(stepIndex), TUTORIAL_STEP_MS);
    }
  }

  private advanceTutorial(stepIndex: number): void {
    const next = stepIndex + 1;
    if (next >= TUTORIAL_STEPS.length) this.finishTutorial();
    else this.renderTutorial(next);
  }

  private finishTutorial(): void {
    this.clearTutorialTimers();
    this.settings.hasSeenTutorial = true;
    saveSettings(this.settings);
    this.renderHome();
  }

  // ---------- ACHIEVEMENTS ----------
  private unlockAchievements(): void {
    const unlocked = newlyUnlockedAchievements(this.save);
    if (unlocked.length === 0) return;
    this.save.unlockedAchievementIds = [...this.save.unlockedAchievementIds, ...unlocked.map((a) => a.id)];
    this.achievementToastQueue.push(...unlocked);
    this.showNextAchievementToast();
  }

  private showNextAchievementToast(): void {
    if (this.achievementToastShowing) return;
    const next = this.achievementToastQueue.shift();
    if (!next) return;
    this.achievementToastShowing = true;

    const toast = el("div", { class: "achievement-toast" }, [
      el("div", { class: "achievement-toast-icon" }, [next.icon]),
      el("div", { class: "achievement-toast-body" }, [
        el("div", { class: "achievement-toast-title" }, ["Achievement Unlocked!"]),
        el("div", { class: "achievement-toast-name" }, [next.name]),
      ]),
    ]);
    this.achievementToastRoot.append(toast);
    sfx.playAchievement();

    window.setTimeout(() => {
      toast.classList.add("achievement-toast-out");
      window.setTimeout(() => {
        toast.remove();
        this.achievementToastShowing = false;
        this.showNextAchievementToast();
      }, 300);
    }, 2600);
  }

  private renderAchievements(): void {
    this.setScreen("achievements");
    const unlockedIds = new Set(this.save.unlockedAchievementIds);
    const rows = ACHIEVEMENTS.map((a) =>
      el("div", { class: `achievement-row ${unlockedIds.has(a.id) ? "unlocked" : "locked"}` }, [
        el("div", { class: "achievement-row-icon" }, [unlockedIds.has(a.id) ? a.icon : "\u{1F512}"]),
        el("div", { class: "achievement-row-body" }, [
          el("div", { class: "achievement-row-name" }, [a.name]),
          el("div", { class: "achievement-row-desc" }, [a.description]),
        ]),
      ])
    );
    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["Achievements"]),
      el("p", { class: "small-muted" }, [`${unlockedIds.size} / ${ACHIEVEMENTS.length} unlocked`]),
      el("div", { class: "achievement-list" }, rows),
      el("button", { class: "btn btn-primary", onClick: () => this.renderHome() }, ["← Back"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private setScreen(screen: Screen): void {
    this.screen = screen;
  }

  // ---------- HOME ----------
  private renderHome(): void {
    this.setScreen("home");
    this.globe.setAutoRotate(true);
    this.globe.clearPins();
    const level = levelForXp(this.save.xp);
    const xpPct = Math.min(100, Math.round((level.xpIntoLevel / level.xpForNextLevel) * 100));
    const activeProfile = activeProfileMeta(this.profiles);
    const panel = el("div", { class: "screen-center" }, [
      el("div", { class: "logo" }, ["GEO RACER"]),
      el("div", { class: "subtitle" }, [`Level ${level.level} explorer`]),
      activeProfile
        ? el("button", {
            class: "chip",
            style: `margin:0 auto 10px; border-color:${activeProfile.color};`,
            onClick: () => this.renderProfiles(),
          }, [`${activeProfile.avatar} ${activeProfile.name}`])
        : el("div"),
      el("div", { class: "xp-bar-wrap" }, [
        el("div", { class: "xp-bar-track" }, [el("div", { class: "xp-bar-fill", style: `width:${xpPct}%;` })]),
        el("div", { class: "small-muted" }, [`${level.xpIntoLevel} / ${level.xpForNextLevel} XP to level ${level.level + 1}`]),
      ]),
      el("button", { class: "btn btn-primary", onClick: () => this.renderModeSelect() }, ["✈️ Play"]),
      el("button", { class: "btn btn-accent", onClick: () => this.startDaily() }, ["\u{1F31F} Daily Challenge"]),
      el("button", { class: "btn", onClick: () => this.renderWorldTour() }, ["\u{1F30E} World Tour"]),
      el("button", { class: "btn", onClick: () => this.startTimeAttack() }, ["⏱️ Time Attack"]),
      el("button", { class: "btn", onClick: () => this.startDetective() }, ["\u{1F575}️ Globe Detective"]),
      el("button", { class: "btn", onClick: () => this.renderSportsSetup() }, ["\u{26BE} Sports Map"]),
      el("button", { class: "btn", onClick: () => this.renderRaceSetup() }, ["\u{1F3C1} 2-Player Race"]),
      el("button", { class: "btn", onClick: () => this.renderProfiles() }, ["\u{1F46A} Family & Profiles"]),
      el("button", { class: "btn", onClick: () => this.renderLearned() }, ["\u{1F5FA}️ Learned Map"]),
      el("button", { class: "btn", onClick: () => this.renderStats() }, ["\u{1F3C6} Stats & Leaderboard"]),
      el("button", { class: "btn", onClick: () => this.renderAchievements() }, ["\u{1F396}️ Achievements"]),
      el("button", { class: "btn", onClick: () => this.renderSettings() }, ["⚙️ Settings"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  // ---------- MODE / DIFFICULTY SELECT ----------
  private renderModeSelect(): void {
    this.setScreen("modeSelect");
    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["Choose a Mode"]),
      ...MODES.map(({ id, label }) =>
        el("button", {
          class: "btn btn-primary",
          onClick: () => {
            this.pendingMode = id;
            this.renderDifficultySelect();
          },
        }, [label])
      ),
      el("button", { class: "btn", onClick: () => this.renderHome() }, ["← Back"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private renderDifficultySelect(): void {
    this.setScreen("difficultySelect");
    const regionsSelected = new Set(this.pendingRegions);

    const render = () => {
      const diffRow = el("div", { class: "chip-row" }, DIFFICULTIES.map((d) =>
        chip(d.label, this.pendingDifficulty === d.id, () => {
          this.pendingDifficulty = d.id;
          render();
        })
      ));

      const regionRow = el("div", { class: "chip-row" }, REGIONS.map((r) =>
        chip(r, regionsSelected.has(r), () => {
          if (regionsSelected.has(r)) regionsSelected.delete(r);
          else regionsSelected.add(r);
          this.pendingRegions = [...regionsSelected];
          render();
        })
      ));

      const panel = el("div", { class: "screen-center" }, [
        el("h2", {}, ["Difficulty"]),
        diffRow,
        el("div", { class: "small-muted" }, ["Regions (optional filter)"]),
        regionRow,
        el("button", { class: "btn btn-primary", onClick: () => this.startRound(false) }, ["Start ✈️"]),
        el("button", { class: "btn", onClick: () => this.renderModeSelect() }, ["← Back"]),
      ]);
      clear(this.uiContent);
      this.uiContent.append(panel);
    };
    render();
  }

  // ---------- SINGLE PLAYER ROUND ----------
  private startDaily(): void {
    const today = dateKey();
    if (this.save.lastDailyKey === today) {
      const panel = el("div", { class: "screen-center" }, [
        el("h2", {}, ["Daily Challenge"]),
        el("p", {}, [`You already flew today's challenge! Score: ${this.save.lastDailyScore ?? 0}`]),
        el("p", { class: "small-muted" }, ["Come back tomorrow for a new route."]),
        el("button", { class: "btn btn-primary", onClick: () => this.renderHome() }, ["← Back"]),
      ]);
      clear(this.uiContent);
      this.uiContent.append(panel);
      return;
    }

    const byMode: Record<Mode, GeoTarget[]> = {
      countries: getTargets("countries"),
      capitals: getTargets("capitals"),
      landmarks: getTargets("landmarks"),
      states: getTargets("states"),
      flags: getTargets("flags"),
    };
    const queue = buildDailyChallenge(byMode);
    this.round = {
      mode: "countries",
      difficulty: null,
      isDaily: true,
      queue,
      index: 0,
      score: 0,
      streak: 0,
      xpEarned: 0,
      questionStart: 0,
      timeoutHandle: null,
      tickHandle: null,
      campaignLevelId: null,
      ratings: [],
    };
    this.playCurrentQuestion();
  }

  private startRound(_isDaily: boolean): void {
    const pool = getTargets(this.pendingMode);
    const filter: QuestionFilter = {
      difficulty: this.pendingDifficulty,
      regions: this.pendingRegions.length > 0 ? this.pendingRegions : undefined,
    };
    const rng = mulberry32(Date.now() & 0xffffffff);
    const queue = buildRoundQueue(pool, filter, ROUND_LENGTH, rng);
    this.round = {
      mode: this.pendingMode,
      difficulty: this.pendingDifficulty,
      isDaily: false,
      queue,
      index: 0,
      score: 0,
      streak: 0,
      xpEarned: 0,
      questionStart: 0,
      timeoutHandle: null,
      tickHandle: null,
      campaignLevelId: null,
      ratings: [],
    };
    this.playCurrentQuestion();
  }

  private startCampaignLevel(level: CampaignLevel): void {
    const rng = mulberry32(Date.now() & 0xffffffff);
    const ids = level.isBoss ? selectBossRoundCountryIds(level, rng) : level.countryIds;
    const pool = getTargets("countries").filter((t) => ids.includes(t.id));
    const queue = shuffle(pool, rng);
    this.round = {
      mode: "countries",
      difficulty: null,
      isDaily: false,
      queue,
      index: 0,
      score: 0,
      streak: 0,
      xpEarned: 0,
      questionStart: 0,
      timeoutHandle: null,
      tickHandle: null,
      campaignLevelId: level.id,
      ratings: [],
    };
    this.playCurrentQuestion();
  }

  private playCurrentQuestion(): void {
    if (!this.round) return;
    this.setScreen("playing");
    this.globe.setAutoRotate(false);
    this.globe.clearPins();

    const target = this.round.queue[this.round.index];
    this.round.questionStart = performance.now();

    const promptBanner = target.promptImage
      ? el("div", { class: "prompt-banner prompt-banner-flag" }, [
          el("div", { class: "flag-prompt-img", html: target.promptImage }),
          el("div", {}, [target.prompt]),
        ])
      : el("div", { class: "prompt-banner" }, [target.prompt]);
    const scorePill = el("div", { class: "pill" }, [`Score ${this.round.score}`]);
    const streakPill = el("div", { class: `pill ${this.round.streak > 0 ? "combo-pill" : ""}` }, [
      this.round.streak > 0 ? `\u{1F525} x${this.round.streak}` : "No streak",
    ]);
    const quitBtn = el("button", { class: "icon-btn", "aria-label": "Quit round", onClick: () => this.confirmQuitRound() }, ["✕"]);

    const hudTop = el("div", { class: "hud-top" }, [
      quitBtn,
      promptBanner,
      el("div", { class: "hud-stats" }, [scorePill, streakPill]),
    ]);

    const timerFill = el("div", { class: "timer-bar-fill", style: "width:100%;" });
    const timerTrack = el("div", { class: "timer-bar-track" }, [timerFill]);

    const progress = el("div", { class: "hud-bottom" }, [
      el("div", { class: "pill" }, [`Q${this.round.index + 1} / ${this.round.queue.length}`]),
    ]);

    clear(this.uiContent);
    this.uiContent.append(hudTop, timerTrack, progress);

    sfx.playUiOpen();

    const tick = window.setInterval(() => {
      const elapsed = performance.now() - this.round!.questionStart;
      const pct = Math.max(0, 1 - elapsed / ANSWER_TIMEOUT_MS);
      timerFill.style.width = `${pct * 100}%`;
    }, 100);
    this.round.tickHandle = tick;

    this.round.timeoutHandle = window.setTimeout(() => {
      const hit = this.globe.raycastPointer(window.innerWidth / 2, window.innerHeight / 2);
      this.submitAnswer(hit?.lat ?? target.lat + 40, hit?.lon ?? target.lon + 40);
    }, ANSWER_TIMEOUT_MS);

    this.activeTapHandler = (lat, lon) => this.submitAnswer(lat, lon);
  }

  private clearQuestionTimers(): void {
    if (this.round?.tickHandle) window.clearInterval(this.round.tickHandle);
    if (this.round?.timeoutHandle) window.clearTimeout(this.round.timeoutHandle);
    if (this.round) {
      this.round.tickHandle = null;
      this.round.timeoutHandle = null;
    }
  }

  /**
   * For "pick the whole country" targets (Countries/Flags modes, and anything
   * drawing from the Countries pool), a tap anywhere inside the target
   * country's actual borders counts as a dead-center hit, not just a tap near
   * its labeled lat/lon. Falls back to false (plain distance scoring) until
   * the border data has loaded or if a country has no bundled polygon.
   */
  private isCountryShapeHit(target: GeoTarget, lat: number, lon: number): boolean {
    if (!this.countryGeo) return false;
    return countryContainsPoint(this.countryGeo, target.name, lat, lon).hit;
  }

  /**
   * For States mode, a tap anywhere inside the target state's actual borders
   * counts as a dead-center hit, the same way isCountryShapeHit works for
   * countries. Falls back to false (plain distance scoring) until the state
   * border data has loaded or if a state has no bundled polygon.
   */
  private isStateShapeHit(target: GeoTarget, lat: number, lon: number): boolean {
    if (!this.stateGeo) return false;
    return stateContainsPoint(this.stateGeo, target.name, lat, lon).hit;
  }

  private submitAnswer(lat: number, lon: number): void {
    if (!this.round) return;
    this.activeTapHandler = null;
    this.clearQuestionTimers();

    const target = this.round.queue[this.round.index];
    const elapsedMs = performance.now() - this.round.questionStart;
    const usesCountryShape = this.round.mode === "countries" || this.round.mode === "flags";
    const usesStateShape = this.round.mode === "states";
    let distanceKm = greatCircleDistanceKm({ lat, lon }, { lat: target.lat, lon: target.lon });
    if (usesCountryShape && this.isCountryShapeHit(target, lat, lon)) distanceKm = 0;
    if (usesStateShape && this.isStateShapeHit(target, lat, lon)) distanceKm = 0;
    const difficulty = target.difficulty;
    const result = scoreAnswer(distanceKm, elapsedMs, difficulty, this.round.streak);
    this.round.ratings.push(result.rating);

    this.round.streak = result.rating === "miss" ? 0 : this.round.streak + 1;
    this.round.score += result.totalPoints;
    this.round.xpEarned += xpForAnswer(result.totalPoints, result.rating);
    this.save.bestStreak = Math.max(this.save.bestStreak, this.round.streak);
    if (result.rating === "perfect") this.save.perfectCount += 1;
    else if (result.rating === "great") this.save.greatCount += 1;

    if (MASTERY_RATINGS.has(result.rating)) {
      this.save = recordLearned(this.save, target.id);
    }

    this.globe.dropPin(lat, lon, result.rating === "miss" ? "miss" : "tap");
    this.globe.launchProjectile(lat, lon, target.lat, target.lon, this.settings.selectedSkin).then(() => {
      this.globe.dropPin(target.lat, target.lon, "target");
      if (result.rating === "perfect" || result.rating === "great") {
        this.globe.burstConfetti(target.lat, target.lon);
      }
    });

    this.playRatingSfx(result.rating, this.round.streak);
    this.globe.flyTo(target.lat, target.lon, 1.7);

    this.lastResult = { target, score: result, mode: this.round.mode };
    window.setTimeout(() => this.renderRoundResult(), 650);
  }

  private playRatingSfx(rating: string, streak: number): void {
    if (rating === "perfect") sfx.playPerfect();
    else if (rating === "great") sfx.playGreat();
    else if (rating === "good") sfx.playGood();
    else if (rating === "ok") sfx.playGood();
    else sfx.playMiss();
    if (streak > 1) sfx.playCombo(streak);
  }

  private renderRoundResult(): void {
    if (!this.round || !this.lastResult) return;
    this.setScreen("roundResult");
    const { target, score } = this.lastResult;

    const panel = el("div", { class: "result-card" }, [
      el("div", { class: `rating-badge rating-${score.rating}` }, [score.rating.toUpperCase()]),
      el("div", { class: "score-line" }, [`+${score.totalPoints}`]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Distance"]), el("span", {}, [`${Math.round(score.distanceKm)} km`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Time bonus"]), el("span", {}, [`+${score.timeBonus}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Combo"]), el("span", {}, [`x${score.comboMultiplier.toFixed(2)}`])]),
      el("div", { class: "fact-card" }, [el("strong", {}, [target.name]), el("div", {}, [target.fact])]),
      el("button", {
        class: "btn btn-primary",
        onClick: () => this.nextQuestion(),
      }, [this.round.index + 1 < this.round.queue.length ? "Next →" : "Finish →"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private nextQuestion(): void {
    if (!this.round) return;
    this.round.index += 1;
    if (this.round.index >= this.round.queue.length) {
      this.finishRound();
    } else {
      this.playCurrentQuestion();
    }
  }

  private finishRound(): void {
    if (!this.round) return;
    const before = levelForXp(this.save.xp);
    this.save.xp += this.round.xpEarned;
    this.save.gamesPlayed += 1;
    const after = levelForXp(this.save.xp);

    if (this.round.isDaily) {
      const today = dateKey();
      this.save.dailyStreak = this.save.lastDailyKey && isNextDay(this.save.lastDailyKey, today) ? this.save.dailyStreak + 1 : 1;
      this.save.dailyCompletedCount += 1;
      this.save.lastDailyKey = today;
      this.save.lastDailyScore = this.round.score;
    }

    this.save = addLeaderboardEntry(
      this.save,
      leaderboardEntryForActiveProfile(this.profiles, this.round.mode, this.round.score, dateKey())
    );
    this.save = recordWeeklyScore(this.save, this.round.score);

    const leveledUp = after.level > before.level;
    if (leveledUp) sfx.playLevelUp();

    const unlocks = leveledUp
      ? Array.from({ length: after.level - before.level }, (_, i) => newlyUnlockedForLevel(before.level + 1 + i)).flat()
      : [];

    if (this.round.campaignLevelId) {
      const level = buildCampaign().find((l) => l.id === this.round!.campaignLevelId)!;
      const stars = starsForRatings(this.round.ratings);
      const prevStars = this.save.campaignStars[level.id] ?? 0;
      this.save.campaignStars = { ...this.save.campaignStars, [level.id]: Math.max(prevStars, stars) };
      this.unlockAchievements();
      saveSave(this.profileId, this.save);

      const campaignSummary = el("div", { class: "screen-center" }, [
        el("h2", {}, [level.isBoss ? "\u{1F451} Boss Defeated!" : "Level Complete!"]),
        el("div", { class: "campaign-stars" }, [starString(stars)]),
        el("div", { class: "score-line" }, [`${this.round.score} pts`]),
        stars > prevStars ? el("p", {}, ["New best! ⭐"]) : el("div"),
        leveledUp ? el("p", {}, [`Level up! You're now level ${after.level} \u{1F389}`]) : el("div"),
        el("button", { class: "btn btn-primary", onClick: () => this.renderCampaignLevels(level.region) }, ["Continue"]),
        el("button", { class: "btn", onClick: () => this.renderHome() }, ["\u{1F3E0} Home"]),
      ]);
      clear(this.uiContent);
      this.uiContent.append(campaignSummary);
      this.round = null;
      this.setScreen("sessionSummary");
      this.globe.clearPins();
      this.globe.setAutoRotate(true);
      return;
    }

    this.unlockAchievements();
    saveSave(this.profileId, this.save);

    const summary = el("div", { class: "screen-center" }, [
      el("h2", {}, ["Round Complete!"]),
      el("div", { class: "score-line" }, [`${this.round.score} pts`]),
      el("div", { class: "row-stat" }, [el("span", {}, ["XP earned"]), el("span", {}, [`+${this.round.xpEarned}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Best streak"]), el("span", {}, [`${this.save.bestStreak}`])]),
      leveledUp
        ? el("div", { class: "fact-card" }, [
            el("strong", {}, [`Level up! You're now level ${after.level} \u{1F389}`]),
            ...(unlocks.length > 0
              ? [el("div", {}, [`Unlocked: ${unlocks.map((u) => u.name).join(", ")}`])]
              : []),
          ])
        : el("div", {}),
      el("button", { class: "btn btn-primary", onClick: () => this.renderModeSelect() }, ["Play Again"]),
      el("button", { class: "btn", onClick: () => this.renderHome() }, ["\u{1F3E0} Home"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(summary);
    this.round = null;
    this.setScreen("sessionSummary");
    this.globe.clearPins();
    this.globe.setAutoRotate(true);
  }

  private confirmQuitRound(): void {
    if (!this.round) return;
    this.clearQuestionTimers();
    this.activeTapHandler = null;
    this.round = null;
    this.renderHome();
  }

  // ---------- WORLD TOUR CAMPAIGN ----------
  private renderWorldTour(): void {
    this.setScreen("worldTour");
    this.globe.setAutoRotate(true);
    this.globe.clearPins();
    const campaign = buildCampaign();
    const rows = CAMPAIGN_REGIONS.map((region) => {
      const levels = campaign.filter((l) => l.region === region);
      const stars = levels.reduce((sum, l) => sum + (this.save.campaignStars[l.id] ?? 0), 0);
      const maxStars = levels.length * 3;
      const unlocked = isRegionUnlocked(region, this.save.campaignStars);
      return el("button", {
        class: "btn btn-primary campaign-region-btn",
        style: unlocked ? "" : "opacity:0.45;",
        onClick: () => {
          if (unlocked) this.renderCampaignLevels(region);
        },
      }, [
        el("div", {}, [unlocked ? region : `\u{1F512} ${region}`]),
        el("div", { class: "small-muted" }, [`${stars} / ${maxStars} ⭐`]),
      ]);
    });
    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["\u{1F30E} World Tour"]),
      el("p", { class: "small-muted" }, ["Clear every level's boss round to unlock the next continent."]),
      ...rows,
      el("button", { class: "btn", onClick: () => this.renderHome() }, ["← Back"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private renderCampaignLevels(region: Region): void {
    this.setScreen("campaignLevels");
    const levels = levelsForRegion(region);
    const rows = levels.map((lvl) => {
      const unlocked = isLevelUnlocked(lvl, this.save.campaignStars);
      const stars = this.save.campaignStars[lvl.id] ?? 0;
      return el("button", {
        class: `btn ${lvl.isBoss ? "btn-accent" : "btn-primary"} campaign-level-btn`,
        style: unlocked ? "" : "opacity:0.45;",
        onClick: () => {
          if (unlocked) this.startCampaignLevel(lvl);
        },
      }, [
        el("div", {}, [unlocked ? (lvl.isBoss ? `\u{1F451} ${lvl.label}` : lvl.label) : "\u{1F512} Locked"]),
        unlocked ? el("div", { class: "small-muted" }, [starString(stars)]) : el("div"),
      ]);
    });
    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, [region]),
      ...rows,
      el("button", { class: "btn", onClick: () => this.renderWorldTour() }, ["← Back"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  // ---------- TIME ATTACK ----------
  private startTimeAttack(): void {
    const pool = getTargets("countries");
    const rng = mulberry32(Date.now() & 0xffffffff);
    const queue = buildRoundQueue(pool, {}, 200, rng);
    this.timeAttack = {
      queue,
      index: 0,
      score: 0,
      correct: 0,
      streak: 0,
      startTime: performance.now(),
      tickHandle: null,
      advanceHandle: null,
    };
    this.playTimeAttackQuestion();
    this.timeAttack.tickHandle = window.setInterval(() => this.tickTimeAttackClock(), 100);
  }

  private tickTimeAttackClock(): void {
    if (!this.timeAttack) return;
    const elapsed = performance.now() - this.timeAttack.startTime;
    const remaining = Math.max(0, TIME_ATTACK_DURATION_MS - elapsed);
    const pct = remaining / TIME_ATTACK_DURATION_MS;
    if (this.timeAttackTimerFill) this.timeAttackTimerFill.style.width = `${pct * 100}%`;
    if (this.timeAttackClockEl) {
      this.timeAttackClockEl.textContent = `${Math.ceil(remaining / 1000)}s`;
      this.timeAttackClockEl.classList.toggle("low-time", remaining > 0 && remaining <= 10000);
    }
    if (remaining <= 0) this.finishTimeAttack();
  }

  private playTimeAttackQuestion(): void {
    if (!this.timeAttack) return;
    this.setScreen("timeAttackPlaying");
    this.globe.setAutoRotate(false);
    this.globe.clearPins();

    const target = this.timeAttack.queue[this.timeAttack.index % this.timeAttack.queue.length];
    const questionStart = performance.now();

    const quitBtn = el("button", { class: "icon-btn", "aria-label": "Quit Time Attack", onClick: () => this.confirmQuitTimeAttack() }, ["✕"]);
    const promptBanner = el("div", { class: "prompt-banner" }, [target.prompt]);
    const scorePill = el("div", { class: "pill" }, [`Score ${this.timeAttack.score}`]);
    const correctPill = el("div", { class: "pill" }, [`✓ ${this.timeAttack.correct}`]);
    const clockPill = el("div", { class: "pill time-attack-clock" }, ["60s"]);
    this.timeAttackClockEl = clockPill;

    const hudTop = el("div", { class: "hud-top" }, [
      quitBtn,
      promptBanner,
      el("div", { class: "hud-stats" }, [scorePill, correctPill, clockPill]),
    ]);

    const timerFill = el("div", { class: "timer-bar-fill", style: "width:100%;" });
    this.timeAttackTimerFill = timerFill;
    const timerTrack = el("div", { class: "timer-bar-track" }, [timerFill]);

    clear(this.uiContent);
    this.uiContent.append(hudTop, timerTrack);

    this.activeTapHandler = (lat, lon) => this.submitTimeAttackAnswer(lat, lon, questionStart);
  }

  private submitTimeAttackAnswer(lat: number, lon: number, questionStart: number): void {
    if (!this.timeAttack) return;
    this.activeTapHandler = null;
    const target = this.timeAttack.queue[this.timeAttack.index % this.timeAttack.queue.length];
    const elapsedMs = performance.now() - questionStart;
    let distanceKm = greatCircleDistanceKm({ lat, lon }, { lat: target.lat, lon: target.lon });
    if (this.isCountryShapeHit(target, lat, lon)) distanceKm = 0;
    const result = scoreAnswer(distanceKm, elapsedMs, target.difficulty, this.timeAttack.streak);

    this.timeAttack.streak = result.rating === "miss" ? 0 : this.timeAttack.streak + 1;
    this.timeAttack.score += result.totalPoints;
    if (result.rating !== "miss") this.timeAttack.correct += 1;

    this.globe.dropPin(lat, lon, result.rating === "miss" ? "miss" : "tap");
    if (result.rating === "perfect") this.globe.burstConfetti(target.lat, target.lon);
    this.playRatingSfx(result.rating, this.timeAttack.streak);

    this.timeAttack.index += 1;
    this.timeAttack.advanceHandle = window.setTimeout(() => {
      if (!this.timeAttack) return;
      const elapsed = performance.now() - this.timeAttack.startTime;
      if (elapsed >= TIME_ATTACK_DURATION_MS) this.finishTimeAttack();
      else this.playTimeAttackQuestion();
    }, 300);
  }

  private confirmQuitTimeAttack(): void {
    if (!this.timeAttack) return;
    if (this.timeAttack.tickHandle) window.clearInterval(this.timeAttack.tickHandle);
    if (this.timeAttack.advanceHandle) window.clearTimeout(this.timeAttack.advanceHandle);
    this.activeTapHandler = null;
    this.timeAttack = null;
    this.renderHome();
  }

  private finishTimeAttack(): void {
    if (!this.timeAttack) return;
    if (this.timeAttack.tickHandle) window.clearInterval(this.timeAttack.tickHandle);
    if (this.timeAttack.advanceHandle) window.clearTimeout(this.timeAttack.advanceHandle);
    this.activeTapHandler = null;
    const { score, correct } = this.timeAttack;

    const isNewBest = score > this.save.timeAttackBestScore || correct > this.save.timeAttackBestCorrect;
    this.save.timeAttackBestScore = Math.max(this.save.timeAttackBestScore, score);
    this.save.timeAttackBestCorrect = Math.max(this.save.timeAttackBestCorrect, correct);
    this.save.gamesPlayed += 1;
    this.save = recordWeeklyScore(this.save, score);
    this.unlockAchievements();
    saveSave(this.profileId, this.save);

    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["⏱️ Time's Up!"]),
      el("div", { class: "score-line" }, [`${score} pts`]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Correct answers"]), el("span", {}, [`${correct}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Best score"]), el("span", {}, [`${this.save.timeAttackBestScore}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Best correct"]), el("span", {}, [`${this.save.timeAttackBestCorrect}`])]),
      isNewBest ? el("div", { class: "fact-card" }, ["New personal best! \u{1F3C6}"]) : el("div"),
      el("button", { class: "btn btn-primary", onClick: () => this.startTimeAttack() }, ["Play Again ⏱️"]),
      el("button", { class: "btn", onClick: () => this.renderHome() }, ["\u{1F3E0} Home"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
    this.timeAttack = null;
    this.setScreen("timeAttackResult");
    this.globe.clearPins();
    this.globe.setAutoRotate(true);
  }

  // ---------- GLOBE DETECTIVE ----------
  private startDetective(): void {
    const pool = buildDetectiveCases();
    const rng = mulberry32(Date.now() & 0xffffffff);
    const queue = buildRoundQueue(pool, {}, ROUND_LENGTH, rng) as DetectiveCase[];
    this.detective = {
      queue,
      index: 0,
      cluesRevealed: 1,
      score: 0,
      xpEarned: 0,
      solvedCount: 0,
      flawlessCount: 0,
      advanceHandle: null,
    };
    this.playDetectiveCase();
  }

  private clearDetectiveAdvanceTimer(): void {
    if (this.detective?.advanceHandle) window.clearTimeout(this.detective.advanceHandle);
    if (this.detective) this.detective.advanceHandle = null;
  }

  private playDetectiveCase(): void {
    if (!this.detective) return;
    this.setScreen("detectivePlaying");
    this.globe.setAutoRotate(false);
    this.globe.clearPins();

    const detectiveCase = this.detective.queue[this.detective.index];
    const revealed = CLUE_ORDER.slice(0, this.detective.cluesRevealed);

    const quitBtn = el("button", { class: "icon-btn", "aria-label": "Quit Globe Detective", onClick: () => this.confirmQuitDetective() }, ["✕"]);
    const clueBanner = el("div", { class: "prompt-banner detective-clue-banner" }, [
      el("div", { class: "small-muted" }, [`Case ${this.detective.index + 1} / ${this.detective.queue.length} • Clue ${this.detective.cluesRevealed}/${MAX_CLUES}`]),
      el("ul", { class: "clue-list" }, revealed.map((kind) => el("li", {}, [detectiveCase.clues[kind as ClueKind]]))),
    ]);
    const scorePill = el("div", { class: "pill" }, [`Score ${this.detective.score}`]);
    const solvedPill = el("div", { class: "pill" }, [`\u{1F50E} ${this.detective.solvedCount}`]);

    const hudTop = el("div", { class: "hud-top" }, [
      quitBtn,
      clueBanner,
      el("div", { class: "hud-stats" }, [scorePill, solvedPill]),
    ]);

    const canRevealMore = this.detective.cluesRevealed < MAX_CLUES;
    const hintBtn = el("button", {
      class: "btn",
      disabled: canRevealMore ? undefined : "true",
      style: "pointer-events:auto; width:auto; margin:0; padding:8px 16px;",
      onClick: () => this.revealDetectiveHint(),
    }, [canRevealMore ? "\u{1F4A1} Need a hint?" : "No more hints left"]);

    const progress = el("div", { class: "hud-bottom" }, [
      el("div", { class: "pill" }, [`Tap the globe to guess`]),
      hintBtn,
    ]);

    clear(this.uiContent);
    this.uiContent.append(hudTop, progress);

    sfx.playUiOpen();
    this.activeTapHandler = (lat, lon) => this.submitDetectiveGuess(lat, lon);
  }

  private revealDetectiveHint(): void {
    if (!this.detective) return;
    if (this.detective.cluesRevealed >= MAX_CLUES) return;
    this.detective.cluesRevealed += 1;
    this.playDetectiveCase();
  }

  private submitDetectiveGuess(lat: number, lon: number): void {
    if (!this.detective) return;
    const detectiveCase = this.detective.queue[this.detective.index];
    let distanceKm = greatCircleDistanceKm({ lat, lon }, { lat: detectiveCase.lat, lon: detectiveCase.lon });
    if (this.isCountryShapeHit(detectiveCase, lat, lon)) distanceKm = 0;

    if (isCorrectGuess(distanceKm)) {
      this.activeTapHandler = null;
      const cluesRevealed = this.detective.cluesRevealed;
      const points = pointsForClues(cluesRevealed, detectiveCase.difficulty);
      const xp = xpForCase(points);
      this.detective.score += points;
      this.detective.xpEarned += xp;
      this.detective.solvedCount += 1;
      if (cluesRevealed === 1) this.detective.flawlessCount += 1;
      this.save = recordLearned(this.save, detectiveCase.id);

      this.globe.dropPin(lat, lon, "tap");
      this.globe.dropPin(detectiveCase.lat, detectiveCase.lon, "target");
      this.globe.burstConfetti(detectiveCase.lat, detectiveCase.lon);
      sfx.playPerfect();
      this.globe.flyTo(detectiveCase.lat, detectiveCase.lon, 1.7);

      this.lastDetectiveResult = { detectiveCase, cluesRevealed, points };
      this.detective.advanceHandle = window.setTimeout(() => this.renderDetectiveCaseResult(true), 650);
      return;
    }

    this.globe.dropPin(lat, lon, "miss");
    sfx.playMiss();

    if (this.detective.cluesRevealed < MAX_CLUES) {
      this.activeTapHandler = null;
      this.detective.advanceHandle = window.setTimeout(() => {
        if (!this.detective) return;
        this.detective.cluesRevealed += 1;
        this.playDetectiveCase();
      }, 500);
      return;
    }

    // Out of clues and still wrong: the case goes unsolved.
    this.activeTapHandler = null;
    this.lastDetectiveResult = { detectiveCase, cluesRevealed: this.detective.cluesRevealed, points: 0 };
    this.detective.advanceHandle = window.setTimeout(() => this.renderDetectiveCaseResult(false), 500);
  }

  private renderDetectiveCaseResult(solved: boolean): void {
    if (!this.detective || !this.lastDetectiveResult) return;
    this.setScreen("detectiveCaseResult");
    const { detectiveCase, cluesRevealed, points } = this.lastDetectiveResult;

    const panel = el("div", { class: "result-card" }, [
      el("div", { class: `rating-badge ${solved ? "rating-perfect" : "rating-miss"}` }, [solved ? "CASE SOLVED" : "CASE CLOSED"]),
      el("div", { class: "score-line" }, [`+${points}`]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Clues used"]), el("span", {}, [`${cluesRevealed} / ${MAX_CLUES}`])]),
      el("div", { class: "fact-card" }, [el("strong", {}, [detectiveCase.name]), el("div", {}, [detectiveCase.fact])]),
      el("button", {
        class: "btn btn-primary",
        onClick: () => this.nextDetectiveCase(),
      }, [this.detective.index + 1 < this.detective.queue.length ? "Next Case →" : "Finish →"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private nextDetectiveCase(): void {
    if (!this.detective) return;
    this.detective.index += 1;
    this.detective.cluesRevealed = 1;
    if (this.detective.index >= this.detective.queue.length) {
      this.finishDetective();
    } else {
      this.playDetectiveCase();
    }
  }

  private finishDetective(): void {
    if (!this.detective) return;
    const { score, xpEarned, solvedCount, flawlessCount } = this.detective;
    const before = levelForXp(this.save.xp);
    this.save.xp += xpEarned;
    this.save.gamesPlayed += 1;
    const after = levelForXp(this.save.xp);
    this.save.detectiveCasesSolved += solvedCount;
    this.save.detectiveFlawlessSolves += flawlessCount;
    this.save.detectiveBestScore = Math.max(this.save.detectiveBestScore, score);
    this.save = recordWeeklyScore(this.save, score);

    const leveledUp = after.level > before.level;
    if (leveledUp) sfx.playLevelUp();
    this.unlockAchievements();
    saveSave(this.profileId, this.save);

    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["\u{1F575}️ Case Files Closed"]),
      el("div", { class: "score-line" }, [`${score} pts`]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Cases solved"]), el("span", {}, [`${solvedCount} / ${this.detective.queue.length}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Solved on first clue"]), el("span", {}, [`${flawlessCount}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["XP earned"]), el("span", {}, [`+${xpEarned}`])]),
      leveledUp ? el("div", { class: "fact-card" }, [el("strong", {}, [`Level up! You're now level ${after.level} \u{1F389}`])]) : el("div"),
      el("button", { class: "btn btn-primary", onClick: () => this.startDetective() }, ["Play Again \u{1F50E}"]),
      el("button", { class: "btn", onClick: () => this.renderHome() }, ["\u{1F3E0} Home"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
    this.detective = null;
    this.setScreen("detectiveSummary");
    this.globe.clearPins();
    this.globe.setAutoRotate(true);
  }

  private confirmQuitDetective(): void {
    if (!this.detective) return;
    this.clearDetectiveAdvanceTimer();
    this.activeTapHandler = null;
    this.detective = null;
    this.renderHome();
  }

  // ---------- SPORTS MAP ----------
  private renderSportsSetup(): void {
    this.setScreen("sportsSetup");
    this.globe.setAutoRotate(true);
    this.globe.clearPins();
    let league = this.pendingSportsLeague;
    let kind = this.pendingSportsKind;

    const render = () => {
      const leagueRow = el("div", { class: "chip-row" }, LEAGUE_CHIPS.map((c) =>
        chip(c.label, league === c.id, () => {
          league = c.id;
          this.pendingSportsLeague = league;
          render();
        })
      ));
      const kindRow = el("div", { class: "chip-row" }, SPORTS_KIND_CHIPS.map((c) =>
        chip(c.label, kind === c.id, () => {
          kind = c.id;
          this.pendingSportsKind = kind;
          render();
        })
      ));
      const panel = el("div", { class: "screen-center" }, [
        el("h2", {}, ["\u{26BE} Sports Map \u{1F3C0}"]),
        el("p", { class: "small-muted" }, ["Pick a league, then find each team's home city on the globe — zoomed in on North America."]),
        el("div", { class: "small-muted" }, ["League"]),
        leagueRow,
        el("div", { class: "small-muted" }, ["Round type"]),
        kindRow,
        el("button", { class: "btn btn-primary", onClick: () => this.startSportsRound(kind, league) }, ["Start \u{1F3DF}️"]),
        el("button", { class: "btn", onClick: () => this.renderHome() }, ["← Back"]),
      ]);
      clear(this.uiContent);
      this.uiContent.append(panel);
    };
    render();
  }

  private startSportsRound(kind: SportsRoundKind, league: LeagueFilter): void {
    const rng = mulberry32(Date.now() & 0xffffffff);
    const queue = buildSportsRoundQueue(league, SPORTS_ROUND_LENGTH, rng);
    this.sports = {
      kind,
      league,
      queue,
      index: 0,
      score: 0,
      streak: 0,
      xpEarned: 0,
      reverseCorrect: 0,
      questionStart: 0,
      timeoutHandle: null,
      tickHandle: null,
      choices: [],
    };
    this.playSportsQuestion();
  }

  private clearSportsTimers(): void {
    if (this.sports?.tickHandle) window.clearInterval(this.sports.tickHandle);
    if (this.sports?.timeoutHandle) window.clearTimeout(this.sports.timeoutHandle);
    if (this.sports) {
      this.sports.tickHandle = null;
      this.sports.timeoutHandle = null;
    }
  }

  private playSportsQuestion(): void {
    if (!this.sports) return;
    this.setScreen("sportsPlaying");
    this.globe.setAutoRotate(false);
    this.globe.clearPins();

    const target = this.sports.queue[this.sports.index];
    this.sports.questionStart = performance.now();

    const quitBtn = el("button", { class: "icon-btn", "aria-label": "Quit Sports Map", onClick: () => this.confirmQuitSports() }, ["✕"]);
    const scorePill = el("div", { class: "pill" }, [`Score ${this.sports.score}`]);
    const streakPill = el("div", { class: `pill ${this.sports.streak > 0 ? "combo-pill" : ""}` }, [
      this.sports.streak > 0 ? `\u{1F525} x${this.sports.streak}` : "No streak",
    ]);

    if (this.sports.kind === "find") {
      this.globe.flyTo(NORTH_AMERICA_CENTER.lat, NORTH_AMERICA_CENTER.lon, NORTH_AMERICA_ZOOM);

      const promptBanner = el("div", { class: "prompt-banner prompt-banner-flag" }, [
        el("div", { class: "sports-badge-img", html: badgeSvgFor(target) }),
        el("div", {}, [`Tap ${target.name}'s home city!`]),
        target.isHometown ? el("div", { class: "hometown-ribbon" }, ["\u{1F3E0} Hometown Team!"]) : el("div"),
      ]);
      const hudTop = el("div", { class: "hud-top" }, [quitBtn, promptBanner, el("div", { class: "hud-stats" }, [scorePill, streakPill])]);
      const timerFill = el("div", { class: "timer-bar-fill", style: "width:100%;" });
      const timerTrack = el("div", { class: "timer-bar-track" }, [timerFill]);
      const progress = el("div", { class: "hud-bottom" }, [
        el("div", { class: "pill" }, [`Q${this.sports.index + 1} / ${this.sports.queue.length}`]),
      ]);

      clear(this.uiContent);
      this.uiContent.append(hudTop, timerTrack, progress);
      sfx.playUiOpen();

      const tick = window.setInterval(() => {
        const elapsed = performance.now() - this.sports!.questionStart;
        const pct = Math.max(0, 1 - elapsed / ANSWER_TIMEOUT_MS);
        timerFill.style.width = `${pct * 100}%`;
      }, 100);
      this.sports.tickHandle = tick;

      this.sports.timeoutHandle = window.setTimeout(() => {
        const hit = this.globe.raycastPointer(window.innerWidth / 2, window.innerHeight / 2);
        this.submitSportsFind(hit?.lat ?? target.lat + 40, hit?.lon ?? target.lon + 40);
      }, ANSWER_TIMEOUT_MS);

      this.activeTapHandler = (lat, lon) => this.submitSportsFind(lat, lon);
      return;
    }

    // "name" kind: drop a pin right on the venue and ask the player to pick the team from a few choices.
    const choiceRng = mulberry32((Date.now() + this.sports.index * 7919) & 0xffffffff);
    this.sports.choices = buildReverseChoices(target, teamsForLeague(this.sports.league), choiceRng);
    this.globe.dropPin(target.lat, target.lon, "target");
    this.globe.flyTo(target.lat, target.lon, NORTH_AMERICA_ZOOM);

    const promptBanner = el("div", { class: "prompt-banner" }, ["❓ Which team plays here?"]);
    const hudTop = el("div", { class: "hud-top" }, [quitBtn, promptBanner, el("div", { class: "hud-stats" }, [scorePill, streakPill])]);
    const choiceGrid = el("div", { class: "sports-choice-grid" }, this.sports.choices.map((choice) =>
      el("button", { class: "btn sports-choice-btn", onClick: () => this.submitSportsChoice(choice, target) }, [
        el("div", { class: "sports-badge-img-sm", html: badgeSvgFor(choice) }),
        el("div", { class: "choice-name" }, [choice.name]),
      ])
    ));
    const bottomArea = el("div", { class: "hud-bottom", style: "flex-direction:column; justify-content:flex-start; align-items:center; width:100%; gap:10px;" }, [
      el("div", { class: "pill" }, [`Q${this.sports.index + 1} / ${this.sports.queue.length}`]),
      choiceGrid,
    ]);

    clear(this.uiContent);
    this.uiContent.append(hudTop, bottomArea);
    sfx.playUiOpen();
  }

  private submitSportsFind(lat: number, lon: number): void {
    if (!this.sports) return;
    this.activeTapHandler = null;
    this.clearSportsTimers();

    const target = this.sports.queue[this.sports.index];
    const elapsedMs = performance.now() - this.sports.questionStart;
    const distanceKm = greatCircleDistanceKm({ lat, lon }, { lat: target.lat, lon: target.lon });
    const result = scoreSportsGuess(distanceKm, elapsedMs, this.sports.streak);

    this.sports.streak = result.rating === "miss" ? 0 : this.sports.streak + 1;
    this.sports.score += result.totalPoints;
    this.sports.xpEarned += xpForAnswer(result.totalPoints, result.rating);
    this.save.bestStreak = Math.max(this.save.bestStreak, this.sports.streak);
    if (result.rating === "perfect") this.save.perfectCount += 1;
    else if (result.rating === "great") this.save.greatCount += 1;
    if (MASTERY_RATINGS.has(result.rating)) this.save = recordLearned(this.save, target.id);

    this.globe.dropPin(lat, lon, result.rating === "miss" ? "miss" : "tap");
    this.globe.launchProjectile(lat, lon, target.lat, target.lon, this.settings.selectedSkin).then(() => {
      this.globe.dropPin(target.lat, target.lon, "target");
      if (result.rating === "perfect" || result.rating === "great") this.globe.burstConfetti(target.lat, target.lon);
    });
    this.playRatingSfx(result.rating, this.sports.streak);
    this.globe.flyTo(target.lat, target.lon, NORTH_AMERICA_ZOOM);

    this.lastSportsResult = { team: target, kind: "find", score: result, points: result.totalPoints, correct: result.rating !== "miss" };
    window.setTimeout(() => this.renderSportsRoundResult(), 650);
  }

  private submitSportsChoice(choice: SportsTeam, target: SportsTeam): void {
    if (!this.sports) return;
    this.activeTapHandler = null;
    const elapsedMs = performance.now() - this.sports.questionStart;
    const correct = choice.id === target.id;
    const points = pointsForReverseGuess(correct, elapsedMs);

    this.sports.streak = correct ? this.sports.streak + 1 : 0;
    this.sports.score += points;
    this.sports.xpEarned += xpForSportsPoints(points);
    this.save.bestStreak = Math.max(this.save.bestStreak, this.sports.streak);

    if (correct) {
      this.sports.reverseCorrect += 1;
      this.save = recordLearned(this.save, target.id);
      this.globe.burstConfetti(target.lat, target.lon);
      sfx.playPerfect();
    } else {
      sfx.playMiss();
    }

    this.lastSportsResult = { team: target, kind: "name", score: null, points, correct };
    window.setTimeout(() => this.renderSportsRoundResult(), 500);
  }

  private renderSportsRoundResult(): void {
    if (!this.sports || !this.lastSportsResult) return;
    this.setScreen("sportsRoundResult");
    const { team, kind, score, points, correct } = this.lastSportsResult;

    const ratingLabel = kind === "find" ? score!.rating.toUpperCase() : correct ? "CORRECT!" : "NOT QUITE";
    const ratingClass = kind === "find" ? `rating-${score!.rating}` : correct ? "rating-perfect" : "rating-miss";
    const distanceRows =
      kind === "find"
        ? [
            el("div", { class: "row-stat" }, [el("span", {}, ["Distance"]), el("span", {}, [`${Math.round(score!.distanceKm)} km`])]),
            el("div", { class: "row-stat" }, [el("span", {}, ["Time bonus"]), el("span", {}, [`+${score!.timeBonus}`])]),
          ]
        : [];

    const panel = el("div", { class: "result-card" }, [
      el("div", { class: `rating-badge ${ratingClass}` }, [ratingLabel]),
      el("div", { class: "score-line" }, [`+${points}`]),
      ...distanceRows,
      el("div", { class: "fact-card" }, [
        el("div", { style: "display:flex; align-items:center; gap:10px; margin-bottom:6px;" }, [
          el("div", { class: "sports-badge-img-sm", html: badgeSvgFor(team) }),
          el("strong", {}, [team.name]),
        ]),
        el("div", {}, [`${team.venue} • ${team.city}`]),
        el("div", {}, [team.fact]),
        team.isHometown ? el("div", { class: "hometown-ribbon" }, ["\u{1F3E0} Hometown Team!"]) : el("div"),
      ]),
      el("button", {
        class: "btn btn-primary",
        onClick: () => this.nextSportsQuestion(),
      }, [this.sports.index + 1 < this.sports.queue.length ? "Next →" : "Finish →"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private nextSportsQuestion(): void {
    if (!this.sports) return;
    this.sports.index += 1;
    if (this.sports.index >= this.sports.queue.length) {
      this.finishSportsRound();
    } else {
      this.playSportsQuestion();
    }
  }

  private finishSportsRound(): void {
    if (!this.sports) return;
    const before = levelForXp(this.save.xp);
    this.save.xp += this.sports.xpEarned;
    this.save.gamesPlayed += 1;
    this.save.sportsRoundsPlayed += 1;
    this.save.sportsBestScore = Math.max(this.save.sportsBestScore, this.sports.score);
    this.save.sportsReverseCorrect += this.sports.reverseCorrect;
    const after = levelForXp(this.save.xp);

    const leagueMode = this.sports.league === "mixed" ? "sports-mixed" : this.sports.league === "MLB" ? "sports-mlb" : "sports-nba";
    this.save = addLeaderboardEntry(
      this.save,
      leaderboardEntryForActiveProfile(this.profiles, leagueMode, this.sports.score, dateKey())
    );
    this.save = recordWeeklyScore(this.save, this.sports.score);

    const leveledUp = after.level > before.level;
    if (leveledUp) sfx.playLevelUp();
    this.unlockAchievements();
    saveSave(this.profileId, this.save);

    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["\u{1F3C6} Sports Map Complete!"]),
      el("div", { class: "score-line" }, [`${this.sports.score} pts`]),
      el("div", { class: "row-stat" }, [el("span", {}, ["XP earned"]), el("span", {}, [`+${this.sports.xpEarned}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Best streak"]), el("span", {}, [`${this.save.bestStreak}`])]),
      leveledUp
        ? el("div", { class: "fact-card" }, [el("strong", {}, [`Level up! You're now level ${after.level} \u{1F389}`])])
        : el("div"),
      el("button", { class: "btn btn-primary", onClick: () => this.renderSportsSetup() }, ["Play Again \u{1F3DF}️"]),
      el("button", { class: "btn", onClick: () => this.renderHome() }, ["\u{1F3E0} Home"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
    this.sports = null;
    this.setScreen("sportsSummary");
    this.globe.clearPins();
    this.globe.setAutoRotate(true);
  }

  private confirmQuitSports(): void {
    if (!this.sports) return;
    this.clearSportsTimers();
    this.activeTapHandler = null;
    this.sports = null;
    this.renderHome();
  }

  // ---------- FAMILY PROFILES & LEADERBOARD ----------
  private switchProfile(id: string): void {
    if (id === this.profileId) return;
    this.profiles = setActiveProfile(this.profiles, id);
    saveProfiles(this.profiles);
    this.profileId = id;
    this.save = loadSave(this.profileId);
  }

  private renderProfiles(): void {
    this.setScreen("family");
    this.globe.setAutoRotate(true);
    let pendingAvatar = nextAvatar(this.profiles);
    let pendingColor = nextColor(this.profiles);

    const render = () => {
      const board = weeklyLeaderboard(this.profiles);
      const nameInput = el("input", { class: "btn", style: "text-align:center;", placeholder: "Family member's name" }) as HTMLInputElement;

      const avatarRow = el("div", { class: "chip-row" }, AVATARS.map((a) =>
        chip(a, pendingAvatar === a, () => { pendingAvatar = a; render(); })
      ));
      const colorRow = el("div", { class: "chip-row" }, PROFILE_COLORS.map((c) => {
        const swatch = el("div", {
          class: `color-swatch ${pendingColor === c ? "selected" : ""}`,
          style: `background:${c};`,
          role: "button",
          tabindex: "0",
          "aria-label": "Pick avatar color",
          "aria-pressed": String(pendingColor === c),
          onClick: () => { pendingColor = c; render(); },
        }, []);
        swatch.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pendingColor = c;
            render();
          }
        });
        return swatch;
      }));

      const rows = board.map((p, i) => {
        const isActive = p.id === this.profileId;
        const profileLevel = levelForXp(loadSave(p.id).xp).level;
        return el("div", { class: `family-row ${isActive ? "active" : ""}` }, [
          el("div", { class: "family-avatar", style: `background:${p.color};` }, [p.avatar]),
          el("div", { class: "family-rank" }, [`${i + 1}`]),
          el("div", { class: "family-name" }, [`${p.name} • Lv ${profileLevel}`]),
          el("div", { class: "family-score" }, [`${p.weeklyScore}`]),
          el("button", {
            class: "btn", style: "margin:0; padding:6px 10px; width:auto; font-size:0.8rem;",
            onClick: () => { this.switchProfile(p.id); render(); },
          }, [isActive ? "Playing" : "Play as"]),
          board.length > 1
            ? el("button", {
                class: "icon-btn", style: "width:32px; height:32px; min-height:32px; font-size:0.8rem;",
                "aria-label": `Remove ${p.name}`,
                onClick: () => {
                  if (confirm(`Remove ${p.name}? This deletes their progress.`)) {
                    this.profiles = removeProfile(this.profiles, p.id);
                    deleteSave(p.id);
                    saveProfiles(this.profiles);
                    if (this.profileId === p.id) {
                      this.profileId = this.profiles.activeProfileId!;
                      this.save = loadSave(this.profileId);
                    }
                    render();
                  }
                },
              }, ["✕"])
            : el("div"),
        ]);
      });

      const panel = el("div", { class: "screen-center" }, [
        el("h2", {}, ["\u{1F46A} Family & Profiles"]),
        el("p", { class: "small-muted" }, ["Weekly score resets every Monday. Each player keeps their own level, stars, and achievements."]),
        board.length > 0 ? el("div", { class: "family-list" }, rows) : el("p", { class: "small-muted" }, ["No players yet — add one below."]),
        nameInput,
        el("div", { class: "small-muted" }, ["Pick an avatar"]),
        avatarRow,
        el("div", { class: "small-muted" }, ["Pick a color"]),
        colorRow,
        el("button", {
          class: "btn btn-primary",
          onClick: () => {
            const name = nameInput.value.trim();
            if (!name) return;
            this.profiles = addProfile(this.profiles, name, pendingAvatar, pendingColor);
            saveProfiles(this.profiles);
            pendingAvatar = nextAvatar(this.profiles);
            pendingColor = nextColor(this.profiles);
            render();
          },
        }, ["+ Add Player"]),
        el("button", { class: "btn", onClick: () => this.renderHome() }, ["← Back"]),
      ]);
      clear(this.uiContent);
      this.uiContent.append(panel);
    };
    render();
  }

  // ---------- RACE MODE ----------
  private renderRaceSetup(): void {
    this.setScreen("raceSetup");
    let name1 = "Player 1";
    let name2 = "Player 2";
    const input1 = el("input", { class: "btn", style: "text-align:center;", value: name1 }) as HTMLInputElement;
    const input2 = el("input", { class: "btn", style: "text-align:center;", value: name2 }) as HTMLInputElement;
    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["2-Player Hot-Seat Race"]),
      el("p", { class: "small-muted" }, ["Pass the device between turns. Same questions, best score wins!"]),
      input1,
      input2,
      el("button", {
        class: "btn btn-primary",
        onClick: () => this.startRace(input1.value || name1, input2.value || name2),
      }, ["Start Race \u{1F3C1}"]),
      el("button", { class: "btn", onClick: () => this.renderHome() }, ["← Back"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private startRace(name1: string, name2: string): void {
    const pool = getTargets("countries");
    const rng = mulberry32(Date.now() & 0xffffffff);
    const queue = buildRoundQueue(pool, {}, RACE_ROUND_LENGTH, rng);
    this.race = {
      queue,
      index: 0,
      names: [name1, name2],
      scores: [0, 0],
      turn: 0,
      questionStart: 0,
    };
    this.playRaceTurn();
  }

  private playRaceTurn(): void {
    if (!this.race) return;
    this.setScreen("racePlaying");
    this.globe.setAutoRotate(false);
    this.globe.clearPins();

    const target = this.race.queue[this.race.index];
    this.race.questionStart = performance.now();
    const playerIdx = this.race.turn;
    const playerName = this.race.names[playerIdx];

    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, [`${playerName}'s turn`]),
      el("div", { class: "prompt-banner", style: "margin-bottom:12px;" }, [target.prompt]),
      el("button", {
        class: "btn btn-primary",
        onClick: () => this.beginRaceTap(),
      }, ["Ready ✈️"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private beginRaceTap(): void {
    if (!this.race) return;
    const target = this.race.queue[this.race.index];
    this.race.questionStart = performance.now();

    const hud = el("div", { class: "hud-top" }, [
      el("div", {}),
      el("div", { class: "prompt-banner" }, [target.prompt]),
      el("div", { class: "hud-stats" }, [
        el("div", { class: "pill" }, [this.race.names[this.race.turn]]),
      ]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(hud);
    this.globe.clearPins();
    this.activeTapHandler = (lat, lon) => this.submitRaceAnswer(lat, lon);
  }

  private submitRaceAnswer(lat: number, lon: number): void {
    if (!this.race) return;
    this.activeTapHandler = null;
    const target = this.race.queue[this.race.index];
    const elapsedMs = performance.now() - this.race.questionStart;
    let distanceKm = greatCircleDistanceKm({ lat, lon }, { lat: target.lat, lon: target.lon });
    if (this.isCountryShapeHit(target, lat, lon)) distanceKm = 0;
    const result = scoreAnswer(distanceKm, elapsedMs, target.difficulty, 0);
    this.playRatingSfx(result.rating, 0);

    this.globe.dropPin(lat, lon, "tap");
    this.globe.flyTo(target.lat, target.lon, 1.7);

    const playerIdx = this.race.turn;
    this.race.scores[playerIdx] += result.totalPoints;

    if (playerIdx === 0) {
      this.race.turn = 1;
      window.setTimeout(() => this.renderRaceTurnResult(result, target, true), 500);
    } else {
      window.setTimeout(() => this.renderRaceTurnResult(result, target, false), 500);
    }
  }

  private renderRaceTurnResult(score: AnswerScore, target: GeoTarget, hasNextPlayer: boolean): void {
    if (!this.race) return;
    this.setScreen("raceRoundResult");
    const panel = el("div", { class: "result-card" }, [
      el("div", { class: `rating-badge rating-${score.rating}` }, [score.rating.toUpperCase()]),
      el("div", { class: "score-line" }, [`+${score.totalPoints}`]),
      el("div", { class: "fact-card" }, [el("strong", {}, [target.name]), el("div", {}, [target.fact])]),
      el("div", { class: "race-score-row" }, [
        el("div", { class: "race-player" }, [
          el("div", { class: "player-name" }, [this.race.names[0]]),
          el("div", { class: "player-score" }, [`${this.race.scores[0]}`]),
        ]),
        el("div", { class: "race-player" }, [
          el("div", { class: "player-name" }, [this.race.names[1]]),
          el("div", { class: "player-score" }, [`${this.race.scores[1]}`]),
        ]),
      ]),
      el("button", {
        class: "btn btn-primary",
        onClick: () => (hasNextPlayer ? this.playRaceTurn() : this.nextRaceQuestion()),
      }, [hasNextPlayer ? "Next Player →" : "Next Question →"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  private nextRaceQuestion(): void {
    if (!this.race) return;
    this.race.index += 1;
    this.race.turn = 0;
    if (this.race.index >= this.race.queue.length) {
      this.finishRace();
    } else {
      this.playRaceTurn();
    }
  }

  private finishRace(): void {
    if (!this.race) return;
    const [s1, s2] = this.race.scores;
    const winner = s1 === s2 ? "It's a tie!" : s1 > s2 ? `${this.race.names[0]} wins!` : `${this.race.names[1]} wins!`;
    this.save.racesPlayed += 1;
    if (s1 !== s2) this.save.raceWins += 1;
    this.unlockAchievements();
    saveSave(this.profileId, this.save);
    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["Race Complete!"]),
      el("div", { class: "race-score-row" }, [
        el("div", { class: "race-player" }, [
          el("div", { class: "player-name" }, [this.race.names[0]]),
          el("div", { class: "player-score" }, [`${s1}`]),
        ]),
        el("div", { class: "race-player" }, [
          el("div", { class: "player-name" }, [this.race.names[1]]),
          el("div", { class: "player-score" }, [`${s2}`]),
        ]),
      ]),
      el("div", { class: "fact-card" }, [winner]),
      el("button", { class: "btn btn-primary", onClick: () => this.renderRaceSetup() }, ["Race Again"]),
      el("button", { class: "btn", onClick: () => this.renderHome() }, ["\u{1F3E0} Home"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
    this.race = null;
    this.setScreen("raceSummary");
    this.globe.clearPins();
    this.globe.setAutoRotate(true);
  }

  // ---------- LEARNED MAP ----------
  private renderLearned(): void {
    this.setScreen("learned");
    const countryNames = new Set<string>();
    for (const id of this.save.learnedIds) {
      const fromCountries = countryNameForTargetId("countries", id);
      const fromCapitals = countryNameForTargetId("capitals", id);
      if (fromCountries) countryNames.add(fromCountries);
      if (fromCapitals) countryNames.add(fromCapitals);
    }
    const canvas = el("canvas", { id: "learned-canvas", width: "640", height: "360" }) as HTMLCanvasElement;
    const panel = el("div", { class: "screen-center", style: "width:min(640px,100%);" }, [
      el("h2", {}, ["Learned Map"]),
      el("p", { class: "small-muted" }, [`${countryNames.size} countries mastered • ${this.save.learnedIds.length} targets total`]),
      el("div", { class: "learned-canvas-wrap" }, [canvas]),
      el("button", { class: "btn btn-primary", onClick: () => this.renderHome() }, ["← Back"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
    void renderLearnedMap(canvas, countryNames);
  }

  // ---------- STATS ----------
  private renderStats(): void {
    this.setScreen("stats");
    const level = levelForXp(this.save.xp);
    const rows = this.save.leaderboard.map((entry) =>
      el("tr", {}, [
        el("td", { style: entry.color ? `color:${entry.color};` : "" }, [
          entry.avatar ? `${entry.avatar} ${entry.name}` : entry.name,
        ]),
        el("td", {}, [entry.mode]),
        el("td", {}, [`${entry.score}`]),
        el("td", {}, [entry.date]),
      ])
    );
    const panel = el("div", { class: "screen-center" }, [
      el("h2", {}, ["Stats & Leaderboard"]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Level"]), el("span", {}, [`${level.level}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["XP"]), el("span", {}, [`${this.save.xp}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Games played"]), el("span", {}, [`${this.save.gamesPlayed}`])]),
      el("div", { class: "row-stat" }, [el("span", {}, ["Best streak"]), el("span", {}, [`${this.save.bestStreak}`])]),
      rows.length > 0
        ? el("table", { class: "leaderboard" }, [
            el("tr", {}, [el("td", {}, ["Name"]), el("td", {}, ["Mode"]), el("td", {}, ["Score"]), el("td", {}, ["Date"])]),
            ...rows,
          ])
        : el("p", { class: "small-muted" }, ["No scores yet — play a round!"]),
      el("button", { class: "btn btn-primary", onClick: () => this.renderHome() }, ["← Back"]),
    ]);
    clear(this.uiContent);
    this.uiContent.append(panel);
  }

  // ---------- SETTINGS ----------
  private renderSettings(): void {
    this.setScreen("settings");
    const level = levelForXp(this.save.xp);
    const unlocked = unlockedAtLevel(level.level);
    const unlockedIds = new Set(unlocked.map((u) => u.id));

    const render = () => {
      const skinChips = el("div", { class: "chip-row" }, UNLOCKABLES.filter((u) => u.kind === "skin").map((u) =>
        chip(
          unlockedIds.has(u.id) ? u.name : `\u{1F512} ${u.name}`,
          this.settings.selectedSkin === u.id,
          () => {
            if (!unlockedIds.has(u.id)) return;
            this.settings.selectedSkin = u.id;
            saveSettings(this.settings);
            render();
          },
          unlockedIds.has(u.id) ? "" : "opacity:0.4;"
        )
      ));

      const themeChips = el("div", { class: "chip-row" }, UNLOCKABLES.filter((u) => u.kind === "theme").map((u) =>
        chip(
          unlockedIds.has(u.id) ? u.name : `\u{1F512} ${u.name}`,
          this.settings.selectedTheme === u.id,
          () => {
            if (!unlockedIds.has(u.id)) return;
            this.settings.selectedTheme = u.id;
            this.globe.setTheme(u.id);
            saveSettings(this.settings);
            render();
          },
          unlockedIds.has(u.id) ? "" : "opacity:0.4;"
        )
      ));

      const a11yToggle = (key: keyof AppSettings["accessibility"], label: string) =>
        chip(label, this.settings.accessibility[key], () => {
          this.settings.accessibility = { ...this.settings.accessibility, [key]: !this.settings.accessibility[key] };
          this.applyAccessibility();
          saveSettings(this.settings);
          render();
        });

      const a11yChips = el("div", { class: "chip-row" }, [
        a11yToggle("largeText", "\u{1F524} Large Text"),
        a11yToggle("colorBlindMode", "\u{1F3A8} Color-blind Pins"),
        a11yToggle("reducedMotion", "\u{1F6D1} Reduced Motion"),
      ]);

      const panel = el("div", { class: "screen-center" }, [
        el("h2", {}, ["Settings"]),
        el("div", { class: "small-muted" }, ["Plane / Rocket Skin"]),
        skinChips,
        el("div", { class: "small-muted" }, ["Globe Theme"]),
        themeChips,
        el("div", { class: "small-muted" }, ["Accessibility"]),
        a11yChips,
        el("button", { class: "btn", onClick: () => this.renderTutorial(0) }, ["▶️ Replay Tutorial"]),
        el("button", {
          class: "btn",
          onClick: () => {
            if (confirm("Reset this profile's progress? This cannot be undone.")) {
              this.save = defaultSave();
              saveSave(this.profileId, this.save);
              render();
            }
          },
        }, ["Reset Progress"]),
        el("button", { class: "btn btn-primary", onClick: () => this.renderHome() }, ["← Back"]),
      ]);
      clear(this.uiContent);
      this.uiContent.append(panel);
    };
    render();
  }
}

const globeRoot = document.getElementById("globe-root")!;
const uiRoot = document.getElementById("ui-root")!;
new GeoRacerApp(globeRoot, uiRoot);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* offline support is best-effort */
    });
  });
}
