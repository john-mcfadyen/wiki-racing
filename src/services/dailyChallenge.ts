import { DailyChallenge, DailyRoute } from '../types';
import { validateWikiPages } from './wikipedia';

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

/**
 * Validates all pages referenced in a set of routes with a single batched
 * API call. Returns routes that pass validation; logs warnings for any that
 * are skipped (missing, redirect, or disambiguation pages).
 */
async function filterValidRoutes(routes: DailyRoute[]): Promise<DailyRoute[]> {
  // Collect every unique title that needs checking
  const allTitles = Array.from(
    new Set(routes.flatMap((r) => [r.startTitle, r.endTitle]))
  );

  const validations = await validateWikiPages(allTitles);

  const valid: DailyRoute[] = [];
  for (const route of routes) {
    const startV = validations.get(route.startTitle);
    const endV = validations.get(route.endTitle);

    const startOk = startV?.valid ?? false;
    const endOk = endV?.valid ?? false;

    if (startOk && endOk) {
      valid.push(route);
    } else {
      const problems: string[] = [];
      if (!startOk) problems.push(`start "${route.startTitle}": ${startV?.reason ?? 'unknown'}`);
      if (!endOk) problems.push(`end "${route.endTitle}": ${endV?.reason ?? 'unknown'}`);
      console.warn(`[WikiRacer] Skipping ${route.difficulty} route — ${problems.join(', ')}`);
    }
  }

  return valid;
}

export async function fetchDailyChallenge(): Promise<DailyChallenge> {
  const todayId = getTodayId();
  const raw =
    HARDCODED_CHALLENGES[todayId] ??
    HARDCODED_CHALLENGES[Object.keys(HARDCODED_CHALLENGES).sort().at(-1)!];

  const validRoutes = await filterValidRoutes(raw.routes);

  if (validRoutes.length === 0) {
    throw new Error('No valid routes available for today\'s challenge.');
  }

  return { ...raw, routes: validRoutes };
}
