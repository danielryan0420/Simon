import "./style.css";
import { GlobeScene } from "./render/globe";
import { el, clear } from "./ui/dom";
import { getTargets, countryNameForTargetId, MODES, type Mode } from "./game/targets";
import { buildRoundQueue, type QuestionFilter } from "./game/questions";
import { buildDailyChallenge, dateKey, isNextDay } from "./game/daily";
import { mulberry32 } from "./game/rng";
import { greatCircleDistanceKm } from "./game/geo";
import { scoreAnswer, type AnswerScore } from "./game/scoring";
import { levelForXp, xpForAnswer, newlyUnlockedForLevel, unlockedAtLevel, UNLOCKABLES } from "./game/progression";
import {
  loadSave,
  saveSave,
  recordLearned,
  addLeaderboardEntry,
  type SaveData,
} from "./game/storage";
import { ROUND_LENGTH, RACE_ROUND_LENGTH, ANSWER_TIMEOUT_MS, MASTERY_RATINGS } from "./game/constants";
import * as sfx from "./game/sfx";
import * as music from "./game/music";
import { renderLearnedMap } from "./render/learnedMap";
import { ACHIEVEMENTS, newlyUnlockedAchievements, type Achievement } from "./game/achievements";
import type { Difficulty, GeoTarget, Region } from "./data/types";

const REGIONS: Region[] = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "rookie", label: "Rookie" },
  { id: "pilot", label: "Pilot" },
  { id: "ace", label: "Ace" },
  { id: "hard", label: "Hard" },
];

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
  | "raceSummary";

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
}

interface RaceState {
  queue: GeoTarget[];
  index: number;
  names: [string, string];
  scores: [number, number];
  turn: 0 | 1;
  questionStart: number;
}

class GeoRacerApp {
  private uiContent: HTMLElement;
  private globe: GlobeScene;
  private save: SaveData;
  private screen: Screen = "home";
  private pendingMode: Mode = "countries";
  private pendingDifficulty: Difficulty = "rookie";
  private pendingRegions: Region[] = [];
  private round: RoundState | null = null;
  private race: RaceState | null = null;
  private lastResult: { target: GeoTarget; score: AnswerScore; mode: Mode } | null = null;
  private raceLastResult: { target: GeoTarget; scores: [AnswerScore, AnswerScore] } | null = null;
  private activeTapHandler: ((lat: number, lon: number) => void) | null = null;
  private achievementToastRoot: HTMLElement;
  private achievementToastQueue: Achievement[] = [];
  private achievementToastShowing = false;

  constructor(globeRoot: HTMLElement, uiRoot: HTMLElement) {
    this.save = loadSave();
    this.globe = new GlobeScene(globeRoot, { onTap: (lat, lon) => this.activeTapHandler?.(lat, lon) });
    this.globe.setTheme(this.save.selectedTheme);

    this.uiContent = el("div", { id: "ui-content", style: "flex:1; display:flex; flex-direction:column; min-height:0;" });
    uiRoot.append(this.uiContent);

    const muteBtn = el("button", {
      class: "icon-btn mute-fixed",
      style: "position:fixed; z-index:50;",
      onClick: () => {
        sfx.toggleMuted();
        muteBtn.textContent = sfx.isMuted() ? "\u{1F507}" : "\u{1F50A}";
      },
    });
    muteBtn.textContent = sfx.isMuted() ? "\u{1F507}" : "\u{1F50A}";
    muteBtn.style.top = "max(12px, var(--safe-top))";
    muteBtn.style.right = "max(12px, var(--safe-right))";
    document.body.append(muteBtn);

    const musicBtn = el("button", {
      class: "icon-btn mute-fixed",
      style: "position:fixed; z-index:50;",
      onClick: () => {
        music.toggleMusic();
        musicBtn.textContent = music.isMusicOn() ? "\u{1F3B5}" : "\u{1F3B6}";
      },
    });
    musicBtn.textContent = music.isMusicOn() ? "\u{1F3B5}" : "\u{1F3B6}";
    musicBtn.style.top = "max(12px, var(--safe-top))";
    musicBtn.style.right = "max(64px, calc(var(--safe-right) + 52px))";
    document.body.append(musicBtn);

    this.achievementToastRoot = el("div", { class: "achievement-toast-root" });
    document.body.append(this.achievementToastRoot);

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
    const panel = el("div", { class: "screen-center" }, [
      el("div", { class: "logo" }, ["GEO RACER"]),
      el("div", { class: "subtitle" }, [`Level ${level.level} explorer • ${this.save.xp} XP`]),
      el("button", { class: "btn btn-primary", onClick: () => this.renderModeSelect() }, ["✈️ Play"]),
      el("button", { class: "btn btn-accent", onClick: () => this.startDaily() }, ["\u{1F31F} Daily Challenge"]),
      el("button", { class: "btn", onClick: () => this.renderRaceSetup() }, ["\u{1F3C1} 2-Player Race"]),
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
        el("div", {
          class: `chip ${this.pendingDifficulty === d.id ? "selected" : ""}`,
          onClick: () => {
            this.pendingDifficulty = d.id;
            render();
          },
        }, [d.label])
      ));

      const regionRow = el("div", { class: "chip-row" }, REGIONS.map((r) =>
        el("div", {
          class: `chip ${regionsSelected.has(r) ? "selected" : ""}`,
          onClick: () => {
            if (regionsSelected.has(r)) regionsSelected.delete(r);
            else regionsSelected.add(r);
            this.pendingRegions = [...regionsSelected];
            render();
          },
        }, [r])
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
    const quitBtn = el("button", { class: "icon-btn", onClick: () => this.confirmQuitRound() }, ["✕"]);

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

  private submitAnswer(lat: number, lon: number): void {
    if (!this.round) return;
    this.activeTapHandler = null;
    this.clearQuestionTimers();

    const target = this.round.queue[this.round.index];
    const elapsedMs = performance.now() - this.round.questionStart;
    const distanceKm = greatCircleDistanceKm({ lat, lon }, { lat: target.lat, lon: target.lon });
    const difficulty = target.difficulty;
    const result = scoreAnswer(distanceKm, elapsedMs, difficulty, this.round.streak);

    this.round.streak = result.rating === "miss" ? 0 : this.round.streak + 1;
    this.round.score += result.totalPoints;
    this.round.xpEarned += xpForAnswer(result.totalPoints, result.rating);
    this.save.bestStreak = Math.max(this.save.bestStreak, this.round.streak);
    if (result.rating === "perfect") this.save.perfectCount += 1;
    else if (result.rating === "great") this.save.greatCount += 1;

    if (MASTERY_RATINGS.has(result.rating)) {
      this.save = recordLearned(this.save, target.id);
    }

    this.globe.dropPin(lat, lon, result.rating === "miss" ? 0xff5a5f : 0x38bdf8);
    this.globe.launchProjectile(lat, lon, target.lat, target.lon, this.save.selectedSkin).then(() => {
      this.globe.dropPin(target.lat, target.lon, 0x3ddc84);
      if (result.rating === "perfect" || result.rating === "great") {
        this.globe.burstConfetti(target.lat, target.lon);
      }
    });

    this.playRatingSfx(result.rating, this.round.streak);
    this.globe.flyTo(target.lat, target.lon, 1.7, 1200);

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

    this.save = addLeaderboardEntry(this.save, {
      name: "Player",
      mode: this.round.mode,
      score: this.round.score,
      date: dateKey(),
    });
    this.unlockAchievements();
    saveSave(this.save);

    const leveledUp = after.level > before.level;
    if (leveledUp) sfx.playLevelUp();

    const unlocks = leveledUp
      ? Array.from({ length: after.level - before.level }, (_, i) => newlyUnlockedForLevel(before.level + 1 + i)).flat()
      : [];

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
    const distanceKm = greatCircleDistanceKm({ lat, lon }, { lat: target.lat, lon: target.lon });
    const result = scoreAnswer(distanceKm, elapsedMs, target.difficulty, 0);
    this.playRatingSfx(result.rating, 0);

    this.globe.dropPin(lat, lon, 0x38bdf8);
    this.globe.flyTo(target.lat, target.lon, 1.7, 1000);

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
    saveSave(this.save);
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
        el("td", {}, [entry.name]),
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
        el("div", {
          class: `chip ${this.save.selectedSkin === u.id ? "selected" : ""}`,
          style: unlockedIds.has(u.id) ? "" : "opacity:0.4;",
          onClick: () => {
            if (!unlockedIds.has(u.id)) return;
            this.save.selectedSkin = u.id;
            saveSave(this.save);
            render();
          },
        }, [unlockedIds.has(u.id) ? u.name : `\u{1F512} ${u.name}`])
      ));

      const themeChips = el("div", { class: "chip-row" }, UNLOCKABLES.filter((u) => u.kind === "theme").map((u) =>
        el("div", {
          class: `chip ${this.save.selectedTheme === u.id ? "selected" : ""}`,
          style: unlockedIds.has(u.id) ? "" : "opacity:0.4;",
          onClick: () => {
            if (!unlockedIds.has(u.id)) return;
            this.save.selectedTheme = u.id;
            this.globe.setTheme(u.id);
            saveSave(this.save);
            render();
          },
        }, [unlockedIds.has(u.id) ? u.name : `\u{1F512} ${u.name}`])
      ));

      const panel = el("div", { class: "screen-center" }, [
        el("h2", {}, ["Settings"]),
        el("div", { class: "small-muted" }, ["Plane / Rocket Skin"]),
        skinChips,
        el("div", { class: "small-muted" }, ["Globe Theme"]),
        themeChips,
        el("button", {
          class: "btn",
          onClick: () => {
            if (confirm("Reset all progress? This cannot be undone.")) {
              this.save = {
                ...loadSave(),
                xp: 0,
                learnedIds: [],
                leaderboard: [],
                gamesPlayed: 0,
                bestStreak: 0,
                lastDailyKey: null,
                lastDailyScore: null,
                perfectCount: 0,
                greatCount: 0,
                dailyCompletedCount: 0,
                dailyStreak: 0,
                racesPlayed: 0,
                raceWins: 0,
                unlockedAchievementIds: [],
              };
              saveSave(this.save);
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
