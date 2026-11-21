import { TOTAL_ROOMS } from './GameConfig';

export class GameProgress {
  private rooms = new Set<number>();
  private secrets = new Set<string>();

  constructor(
    private readonly totalRooms: number = TOTAL_ROOMS,
    readonly requiredSecrets: number = 30,
  ) {}

  get completedRoomsCount(): number {
    return this.rooms.size;
  }

  get completedSecretsCount(): number {
    return this.secrets.size;
  }

  completeRoom(id: number): void {
    if (id >= 1 && id <= this.totalRooms) this.rooms.add(id);
  }

  completeSecret(id: string): void {
    this.secrets.add(id);
  }

  completeAllRooms(): void {
    for (let i = 1; i <= this.totalRooms; i++) this.rooms.add(i);
  }

  completeRequiredSecrets(): void {
    for (let i = 0; i < this.requiredSecrets; i++) this.secrets.add(`required-${i}`);
  }

  isCompleted(): boolean {
    return this.rooms.size >= this.totalRooms && this.secrets.size >= this.requiredSecrets;
  }

  get ratio(): number {
    const roomPart = Math.min(this.rooms.size / this.totalRooms, 1);
    const secretPart = Math.min(this.secrets.size / this.requiredSecrets, 1);
    return (roomPart + secretPart) / 2;
  }
}