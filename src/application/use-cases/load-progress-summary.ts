import type { GameId } from '@domain/progress/player-progress';

import { Either } from '../common/either';
import { UnexpectedError } from '../common/unexpected-error';
import type { IProgressRepository } from '../ports/progress-repository';
import type { AsyncCommandService } from './use-case';

/** Variants to summarise for the main menu (CU-08 summary, HU01). */
export interface LoadProgressSummaryInput {
  readonly gameIds: readonly GameId[];
}

/** Minimal progress figures displayed per variant on the home screen. */
export interface ProgressSummary {
  readonly gameId: GameId;
  readonly highScore: number;
  readonly completedLevels: number;
}

/** Ports injected into `LoadProgressSummaryUseCase` (DIP). */
export interface LoadProgressSummaryDeps {
  readonly progress: IProgressRepository;
}

/**
 * Generic use case (CU-08 summary part, HU01, decision 12): queries
 * `IProgressRepository` for each requested variant and summarises its high score
 * and completed level count with zero conditionals per variant. Unlock rules
 * belong to the full CU-08 level list (`LoadLevelsUseCase`, T28).
 */
export class LoadProgressSummaryUseCase implements AsyncCommandService<
  LoadProgressSummaryInput,
  readonly ProgressSummary[]
> {
  constructor(private readonly deps: LoadProgressSummaryDeps) {}

  async execute(
    input: LoadProgressSummaryInput,
  ): Promise<Either<Error, readonly ProgressSummary[]>> {
    try {
      const summaries = await Promise.all(
        input.gameIds.map((gameId) => this.summariseVariant(gameId)),
      );
      return Either.right(summaries);
    } catch (error) {
      return Either.left(new UnexpectedError(error));
    }
  }

  private async summariseVariant(gameId: GameId): Promise<ProgressSummary> {
    const progress = await this.deps.progress.findByGame(gameId);
    if (progress === null) {
      return { gameId, highScore: 0, completedLevels: 0 };
    }
    const completedLevels = Object.values(progress.levels).filter(
      (level) => level.completed,
    ).length;
    return {
      gameId,
      highScore: progress.highScore,
      completedLevels,
    };
  }
}
