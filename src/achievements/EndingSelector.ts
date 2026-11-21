export type EndingType = 'normal' | 'good' | 'true';

export interface EndingInput {
  completedSecrets: number;
  totalSecrets: number;
  inscriptions: number;
  totalInscriptions: number;
}

export function selectEnding(input: EndingInput): EndingType {
  const loreComplete = input.inscriptions >= input.totalInscriptions;
  if (loreComplete && input.completedSecrets >= input.totalSecrets) return 'true';
  if (loreComplete) return 'good';
  return 'normal';
}