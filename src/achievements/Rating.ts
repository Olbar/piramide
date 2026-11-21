export type Rank = 'S' | 'A' | 'B' | 'C' | 'D';

export interface RatingInput {
  elapsedMs: number;
  secretsFound: number;
  totalSecrets: number;
  hintsUsed: number;
  deaths: number;
}

export interface RatingResult {
  score: number;
  rank: Rank;
  title: string;
}

const RANK_TITLES: Record<Rank, string> = {
  S: 'Легенда пирамиды',
  A: 'Мастер-археолог',
  B: 'Опытный искатель',
  C: 'Выживший',
  D: 'Еле выбрался',
};

export function computeRating(input: RatingInput): RatingResult {
  const secretPart = (input.secretsFound / Math.max(input.totalSecrets, 1)) * 70;
  const minutes = input.elapsedMs / 60_000;
  let timeBonus = 0;
  if (minutes <= 30) timeBonus = 30;
  else if (minutes <= 60) timeBonus = 22;
  else if (minutes <= 120) timeBonus = 14;
  else if (minutes <= 240) timeBonus = 7;
  const penalty = input.hintsUsed * 4 + input.deaths * 1.5;
  const score = Math.round(Math.min(100, Math.max(0, secretPart + timeBonus - penalty)));
  const rank: Rank = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D';
  return { score, rank, title: RANK_TITLES[rank] };
}