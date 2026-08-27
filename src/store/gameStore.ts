import { create } from 'zustand';
import { Race, DailyRoute, RaceResult, HintType } from '../types';

const CLICK_PENALTY = 10; // seconds per click for scoring
const HINT_CLICK_PENALTY = 3; // extra clicks per hint used

interface GameStore {
  race: Race | null;
  currentArticleTitle: string | null;

  startRace: (route: DailyRoute) => void;
  navigateTo: (title: string) => void;
  useHint: () => HintType | null;
  completeRace: () => RaceResult | null;
  forfeitRace: () => RaceResult | null;
  resetRace: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  race: null,
  currentArticleTitle: null,

  startRace: (route: DailyRoute) => {
    set({
      race: {
        startArticle: { pageid: route.startPageid, title: route.startTitle },
        endArticle: { pageid: route.endPageid, title: route.endTitle },
        parClicks: route.parClicks,
        clickHistory: [route.startTitle],
        startTime: Date.now(),
        hintsUsed: 0,
        status: 'active',
        difficulty: route.difficulty,
      },
      currentArticleTitle: route.startTitle,
    });
  },

  navigateTo: (title: string) => {
    set((state) => {
      if (!state.race || state.race.status !== 'active') return state;
      return {
        race: {
          ...state.race,
          clickHistory: [...state.race.clickHistory, title],
        },
        currentArticleTitle: title,
      };
    });
  },

  useHint: () => {
    const { race } = get();
    if (!race || race.hintsUsed >= 3) return null;

    const hintTypes: HintType[] = ['category', 'waypoint', 'direct'];
    const hintType = hintTypes[race.hintsUsed];

    set((state) => ({
      race: state.race
        ? { ...state.race, hintsUsed: state.race.hintsUsed + 1 }
        : null,
    }));

    return hintType;
  },

  completeRace: () => {
    const { race } = get();
    if (!race || race.status !== 'active') return null;

    const endTime = Date.now();
    const timeSeconds = Math.floor((endTime - race.startTime) / 1000);
    const clicks = race.clickHistory.length - 1; // exclude starting article
    const totalClicks = clicks + race.hintsUsed * HINT_CLICK_PENALTY;
    const score = timeSeconds + totalClicks * CLICK_PENALTY;

    const result: RaceResult = {
      timeSeconds,
      clicks: totalClicks,
      parClicks: race.parClicks,
      hintsUsed: race.hintsUsed,
      clickHistory: race.clickHistory,
      difficulty: race.difficulty,
      score,
      status: 'completed',
    };

    set((state) => ({
      race: state.race
        ? { ...state.race, status: 'completed', endTime }
        : null,
    }));

    return result;
  },

  forfeitRace: () => {
    const { race } = get();
    if (!race) return null;

    const endTime = Date.now();
    const timeSeconds = Math.floor((endTime - race.startTime) / 1000);
    // DNF gets max penalty: 999 clicks
    const result: RaceResult = {
      timeSeconds,
      clicks: 999,
      parClicks: race.parClicks,
      hintsUsed: race.hintsUsed,
      clickHistory: race.clickHistory,
      difficulty: race.difficulty,
      score: 9999,
      status: 'dnf',
    };

    set((state) => ({
      race: state.race
        ? { ...state.race, status: 'dnf', endTime }
        : null,
    }));

    return result;
  },

  resetRace: () => set({ race: null, currentArticleTitle: null }),
}));
