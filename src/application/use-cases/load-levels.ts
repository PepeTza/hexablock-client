import type { GameId } from '@domain/progress/player-progress';

import type { ILevelRepository } from '../ports/level-repository';
import type { IProgressRepository } from '../ports/progress-repository';
import type { IUseCase } from './use-case';

export interface LoadLevelsInput {
  readonly gameId: GameId;
}

export interface LevelSelectionEntry {
  readonly id: string;
  readonly order: number;
  readonly locked: boolean;
  readonly completed: boolean;
  readonly stars: number;
  readonly bestScore: number;
}

export interface LevelSelection {
  readonly levels: readonly LevelSelectionEntry[];
  readonly completedLevels: number;
  readonly totalStars: number;
}

interface LoadLevelsDeps {
  readonly levels: Pick<ILevelRepository, 'findByGame'>;
  readonly progress: Pick<IProgressRepository, 'findByGame'>;
}

/** CU-08: list available levels and saved progress without changing either. */
export class LoadLevelsUseCase implements IUseCase<
  LoadLevelsInput,
  Promise<LevelSelection>
> {
  constructor(private readonly deps: LoadLevelsDeps) {}

  async execute({ gameId }: LoadLevelsInput): Promise<LevelSelection> {
    const [storedLevels, progress] = await Promise.all([
      this.deps.levels.findByGame(gameId),
      this.deps.progress.findByGame(gameId),
    ]);
    const ordered = [...storedLevels].sort((a, b) => a.order - b.order);
    const saved = progress?.levels ?? {};
    const levels: LevelSelectionEntry[] = [];
    let unlocked = true;
    let completedLevels = 0;
    let totalStars = 0;

    for (const { id, order } of ordered) {
      const record = Object.hasOwn(saved, id) ? saved[id] : undefined;
      const completed = record?.completed === true;
      const stars = record?.stars ?? 0;
      levels.push({
        id,
        order,
        locked: !unlocked,
        completed,
        stars,
        bestScore: record?.bestScore ?? 0,
      });

      unlocked = completed;
      completedLevels += Number(completed);
      totalStars += stars;
    }

    return { levels, completedLevels, totalStars };
  }
}
