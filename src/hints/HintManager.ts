import type { HintRecord } from '../core/types';

export interface HintResult {
  ok: boolean;
  text?: string;
  stage?: number;
}

export class HintManager {
  private used = 0;
  private stages = new Map<string, number>();
  private records: HintRecord[] = [];

  constructor(private readonly limit: number) {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('Лимит подсказок должен быть целым числом >= 1');
    }
  }

  get remaining(): number {
    return this.limit - this.used;
  }

  get usedCount(): number {
    return this.used;
  }

  get journal(): HintRecord[] {
    return [...this.records];
  }

  useHint(): boolean {
    if (this.remaining <= 0) return false;
    this.used += 1;
    return true;
  }

  requestHint(contextId: string, texts: [string, string, string]): HintResult {
    if (this.remaining <= 0) return { ok: false };
    const stage = this.stages.get(contextId) ?? 0;
    if (stage >= texts.length) return { ok: false };
    this.used += 1;
    this.stages.set(contextId, stage + 1);
    const record: HintRecord = { contextId, stage: stage + 1, text: texts[stage] };
    this.records.push(record);
    return { ok: true, text: record.text, stage: record.stage };
  }

  onRoomChange(): void {
    // Подсказки не восстанавливаются при переходе между комнатами.
  }

  restore(used: number, journal: HintRecord[]): void {
    this.used = Math.min(Math.max(0, used), this.limit);
    this.records = [...journal];
    this.stages.clear();
    for (const record of journal) {
      const prev = this.stages.get(record.contextId) ?? 0;
      this.stages.set(record.contextId, Math.max(prev, record.stage));
    }
  }
}