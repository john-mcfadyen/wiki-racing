export type RaceStatus = 'idle' | 'active' | 'completed' | 'dnf';
export type HintType = 'category' | 'waypoint' | 'direct';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WikiArticle {
  pageid: number;
  title: string;
  html: string; // stripped HTML with only internal links kept
}

export interface Hint {
  type: HintType;
  content: string;
  used: boolean;
}

export interface Race {
  startArticle: { pageid: number; title: string };
  endArticle: { pageid: number; title: string };
  parClicks: number;
  clickHistory: string[]; // article titles visited
  startTime: number; // Date.now()
  endTime?: number;
  hintsUsed: number;
  status: RaceStatus;
  difficulty: Difficulty;
}

export interface DailyRoute {
  challengeId: string; // YYYYMMDD — needed for result persistence
  difficulty: Difficulty;
  startPageid: number;
  startTitle: string;
  endPageid: number;
  endTitle: string;
  parClicks: number;
}

export interface DailyChallenge {
  id: string; // YYYYMMDD
  routes: DailyRoute[];
}

export interface RaceResult {
  timeSeconds: number;
  clicks: number;
  parClicks: number;
  hintsUsed: number;
  clickHistory: string[];
  difficulty: Difficulty;
  score: number;
  status: 'completed' | 'dnf';
}

export type RootStackParamList = {
  Home: undefined;
  Game: { route: DailyRoute };
  Result: { result: RaceResult };
};
