export interface AchievementDef {
  id: string;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  'first-secret': { id: 'first-secret', title: 'Первая тайна', description: 'Найден первый секрет пирамиды.' },
  'secrets-10': { id: 'secrets-10', title: 'Любопытный исследователь', description: 'Найдено 10 секретов.' },
  'secrets-50': { id: 'secrets-50', title: 'Знаток пирамиды', description: 'Найдено 50 секретов.' },
  'all-secrets': { id: 'all-secrets', title: 'Все 120 тайн', description: 'Найдены все 120 секретов пирамиды.' },
  'no-hints': { id: 'no-hints', title: 'Собственный ум', description: 'Игра пройдена без единой подсказки.' },
  'no-deaths': { id: 'no-deaths', title: 'Бессмертный', description: 'Игра пройдена без смертей.' },
  speedrun: { id: 'speedrun', title: 'Быстрее ветра', description: 'Игра пройдена менее чем за 45 минут.' },
  'full-exploration': { id: 'full-exploration', title: 'Полное исследование', description: 'Все комнаты, все секреты и все надписи найдены.' },
  'lore-keeper': { id: 'lore-keeper', title: 'Хранитель преданий', description: 'Собраны все 12 фрагментов древней надписи.' },
};

export interface AchievementSnapshot {
  completedSecrets: number;
  totalSecrets: number;
  hintsUsed: number;
  deaths: number;
  elapsedMs: number;
  visitedRooms: number;
  inscriptions: number;
  finished: boolean;
}

export class AchievementsManager {
  private unlockedIds = new Set<string>();

  get unlocked(): string[] {
    return [...this.unlockedIds];
  }

  evaluate(s: AchievementSnapshot): string[] {
    const conditions: Record<string, boolean> = {
      'first-secret': s.completedSecrets >= 1,
      'secrets-10': s.completedSecrets >= 10,
      'secrets-50': s.completedSecrets >= 50,
      'all-secrets': s.completedSecrets >= s.totalSecrets,
      'no-hints': s.finished && s.hintsUsed === 0,
      'no-deaths': s.finished && s.deaths === 0,
      speedrun: s.finished && s.elapsedMs <= 45 * 60_000,
      'full-exploration': s.finished && s.visitedRooms >= 20 && s.completedSecrets >= s.totalSecrets && s.inscriptions >= 12,
      'lore-keeper': s.inscriptions >= 12,
    };
    const fresh: string[] = [];
    for (const [id, met] of Object.entries(conditions)) {
      if (met && !this.unlockedIds.has(id)) {
        this.unlockedIds.add(id);
        fresh.push(id);
      }
    }
    return fresh;
  }

  serialize(): string[] {
    return this.unlocked;
  }

  restore(ids: string[]): void {
    this.unlockedIds = new Set(ids.filter((id) => id in ACHIEVEMENTS));
  }
}