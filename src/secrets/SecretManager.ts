import type { DifficultyId, SecretContext, SecretDef } from '../core/types';
import { difficultyTier } from '../core/GameConfig';
import { evaluateCondition } from './SecretConditions';

export interface SecretManagerState {
  discovered: string[];
  completed: string[];
}

export class SecretManager {
  private defs = new Map<string, SecretDef>();
  private discovered = new Set<string>();
  private completed = new Set<string>();

  constructor(secrets: SecretDef[]) {
    for (const secret of secrets) this.defs.set(secret.id, secret);
  }

  get all(): SecretDef[] {
    return [...this.defs.values()];
  }

  get(id: string): SecretDef | undefined {
    return this.defs.get(id);
  }

  get discoveredCount(): number {
    return this.discovered.size;
  }

  get completedCount(): number {
    return this.completed.size;
  }

  isDiscovered(id: string): boolean {
    return this.discovered.has(id);
  }

  isCompleted(id: string): boolean {
    return this.completed.has(id);
  }

  discover(id: string, ctx: SecretContext): boolean {
    const def = this.defs.get(id);
    if (!def || this.discovered.has(id)) return false;
    if (!evaluateCondition(def.discover, ctx)) return false;
    this.discovered.add(id);
    return true;
  }

  complete(id: string, ctx: SecretContext): boolean {
    const def = this.defs.get(id);
    if (!def || this.completed.has(id) || !this.discovered.has(id)) return false;
    if (!evaluateCondition(def.complete, ctx)) return false;
    this.completed.add(id);
    return true;
  }

  secretsForRoom(roomId: number): SecretDef[] {
    return this.all.filter((s) => s.roomId === roomId);
  }

  requiredCompletedCount(difficulty: DifficultyId): number {
    const tier = difficultyTier(difficulty);
    return this.all.filter((s) => s.tier <= tier && this.completed.has(s.id)).length;
  }

  requiredTotalCount(difficulty: DifficultyId): number {
    const tier = difficultyTier(difficulty);
    return this.all.filter((s) => s.tier <= tier).length;
  }

  allRequiredCompleted(difficulty: DifficultyId): boolean {
    return this.requiredCompletedCount(difficulty) >= this.requiredTotalCount(difficulty);
  }

  serialize(): SecretManagerState {
    return { discovered: [...this.discovered], completed: [...this.completed] };
  }

  restore(state: SecretManagerState): void {
    this.discovered = new Set(state.discovered.filter((id) => this.defs.has(id)));
    this.completed = new Set(state.completed.filter((id) => this.defs.has(id)));
  }
}