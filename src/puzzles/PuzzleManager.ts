import type { PuzzleDef } from '../core/types';

export type AttemptResult = 'progress' | 'solved' | 'wrong' | 'unknown';

export class PuzzleManager {
  private defs = new Map<string, PuzzleDef>();
  private solved = new Set<string>();
  private progressMap = new Map<string, number>();

  constructor(puzzles: PuzzleDef[]) {
    for (const puzzle of puzzles) this.defs.set(puzzle.id, puzzle);
  }

  get(id: string): PuzzleDef | undefined {
    return this.defs.get(id);
  }

  isSolved(id: string): boolean {
    return this.solved.has(id);
  }

  progress(id: string): number {
    return this.progressMap.get(id) ?? 0;
  }

  attempt(id: string, step: string): AttemptResult {
    const def = this.defs.get(id);
    if (!def) return 'unknown';
    if (this.solved.has(id)) return 'solved';
    const index = this.progress(id);
    if (def.steps[index] === step) {
      const next = index + 1;
      if (next >= def.steps.length) {
        this.solved.add(id);
        this.progressMap.delete(id);
        return 'solved';
      }
      this.progressMap.set(id, next);
      return 'progress';
    }
    this.progressMap.set(id, 0);
    return 'wrong';
  }

  get solvedPuzzles(): string[] {
    return [...this.solved];
  }

  serialize(): string[] {
    return this.solvedPuzzles;
  }

  restore(ids: string[]): void {
    this.solved = new Set(ids.filter((id) => this.defs.has(id)));
    this.progressMap.clear();
  }
}