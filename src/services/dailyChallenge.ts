import { DailyChallenge } from '../types';

// Hardcoded challenges for MVP — will be replaced with Supabase fetch
const HARDCODED_CHALLENGES: Record<string, DailyChallenge> = {
  '20260827': {
    id: '20260827',
    routes: [
      {
        difficulty: 'easy',
        startPageid: 25202,
        startTitle: 'Cat',
        endPageid: 21450,
        endTitle: 'Dog',
        parClicks: 3,
      },
      {
        difficulty: 'medium',
        startPageid: 18717,
        startTitle: 'Pizza',
        endPageid: 31196,
        endTitle: 'Ancient Rome',
        parClicks: 4,
      },
      {
        difficulty: 'hard',
        startPageid: 22567,
        startTitle: 'Beethoven',
        endPageid: 45448,
        endTitle: 'Quantum mechanics',
        parClicks: 5,
      },
    ],
  },
};

function getTodayId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export async function fetchDailyChallenge(): Promise<DailyChallenge> {
  const todayId = getTodayId();

  // Try hardcoded first (MVP)
  if (HARDCODED_CHALLENGES[todayId]) {
    return HARDCODED_CHALLENGES[todayId];
  }

  // Fallback: return the most recent hardcoded challenge
  const keys = Object.keys(HARDCODED_CHALLENGES).sort().reverse();
  return HARDCODED_CHALLENGES[keys[0]];
}
