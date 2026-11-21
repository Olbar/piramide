import type { Condition, SecretContext } from '../core/types';

export function evaluateCondition(condition: Condition, ctx: SecretContext): boolean {
  switch (condition.type) {
    case 'always':
      return true;
    case 'item':
      return ctx.items.includes(condition.item);
    case 'zone':
      return ctx.reachedZones.includes(condition.zone);
    case 'puzzle':
      return ctx.solvedPuzzles.includes(condition.puzzle);
    case 'interact':
      return ctx.interacted.includes(condition.object);
    case 'secret':
      return ctx.completedSecrets.includes(condition.secret);
    case 'all':
      return condition.conditions.every((c) => evaluateCondition(c, ctx));
    case 'any':
      return condition.conditions.some((c) => evaluateCondition(c, ctx));
  }
}