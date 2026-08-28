import AsyncStorage from '@react-native-async-storage/async-storage';
import { RaceResult, Difficulty } from '../types';

function resultKey(challengeId: string, difficulty: Difficulty): string {
  return `wikiracer:result:${challengeId}:${difficulty}`;
}

export async function saveResult(
  challengeId: string,
  difficulty: Difficulty,
  result: RaceResult
): Promise<void> {
  await AsyncStorage.setItem(resultKey(challengeId, difficulty), JSON.stringify(result));
}

export async function loadResult(
  challengeId: string,
  difficulty: Difficulty
): Promise<RaceResult | null> {
  const raw = await AsyncStorage.getItem(resultKey(challengeId, difficulty));
  return raw ? (JSON.parse(raw) as RaceResult) : null;
}

export async function loadAllResults(
  challengeId: string,
  difficulties: Difficulty[]
): Promise<Partial<Record<Difficulty, RaceResult>>> {
  const pairs = await Promise.all(
    difficulties.map(async (d) => [d, await loadResult(challengeId, d)] as const)
  );
  const out: Partial<Record<Difficulty, RaceResult>> = {};
  for (const [d, r] of pairs) {
    if (r) out[d] = r;
  }
  return out;
}
