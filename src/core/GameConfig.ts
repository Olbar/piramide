import type { DifficultyId, SecretTier } from './types';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  description: string;
  requiredSecrets: number;
  trapSpeed: number;
  trapInterval: number;
  platformScale: number;
  extraRoomHints: boolean;
  roomCount: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  explorer: {
    id: 'explorer',
    label: 'Исследователь',
    description: 'Для новичков: 30 секретов, медленные ловушки, широкие платформы.',
    requiredSecrets: 30,
    trapSpeed: 0.7,
    trapInterval: 1.5,
    platformScale: 1.25,
    extraRoomHints: true,
    roomCount: 20,
  },
  seeker: {
    id: 'seeker',
    label: 'Искатель',
    description: 'Для обычных игроков: 60 секретов и сбалансированные ловушки.',
    requiredSecrets: 60,
    trapSpeed: 1,
    trapInterval: 1,
    platformScale: 1,
    extraRoomHints: false,
    roomCount: 20,
  },
  archaeologist: {
    id: 'archaeologist',
    label: 'Археолог',
    description: 'Для опытных игроков: 90 секретов, быстрые ловушки, узкие платформы.',
    requiredSecrets: 90,
    trapSpeed: 1.3,
    trapInterval: 0.75,
    platformScale: 0.85,
    extraRoomHints: false,
    roomCount: 20,
  },
  pharaoh: {
    id: 'pharaoh',
    label: 'Проклятие фараона',
    description: 'Для настоящих мастеров: все 120 секретов и безжалостные ловушки.',
    requiredSecrets: 120,
    trapSpeed: 1.6,
    trapInterval: 0.55,
    platformScale: 0.7,
    extraRoomHints: false,
    roomCount: 20,
  },
};

export function getDifficulty(id: DifficultyId): DifficultyConfig {
  const config = DIFFICULTIES[id];
  if (!config) throw new Error(`Неизвестная сложность: ${id}`);
  return config;
}

export function difficultyTier(id: DifficultyId): SecretTier {
  return getDifficulty(id).requiredSecrets / 30 as SecretTier;
}

export const PHYSICS = {
  gravity: 1500,
  walkSpeed: 220,
  runSpeed: 340,
  jumpVelocity: -620,
  ropeClimbSpeed: 180,
  coyoteMs: 110,
  jumpBufferMs: 130,
  maxFallSpeed: 900,
  playerWidth: 34,
  playerHeight: 52,
} as const;

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const SAVE_VERSION = 1;
export const TOTAL_ROOMS = 20;
export const TOTAL_SECRETS = 120;
export const HINTS_PER_RUN = 3;