import type { InputState } from './Player';

export interface TouchState extends InputState {
  interact: boolean;
}

export const touchInput: TouchState = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  run: false,
  interact: false,
};

export function resetTouch(): void {
  for (const key of Object.keys(touchInput) as (keyof TouchState)[]) {
    touchInput[key] = false;
  }
}