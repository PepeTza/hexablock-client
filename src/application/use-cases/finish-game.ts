import type { VariantFactoryRegistry } from '@domain/engine/game/variant-factory';
import { emptyProgress, type GameId } from '@domain/progress/player-progress';
import type { ProgressEvent } from '@domain/progress/progress-events';
import type {
  FinishedGameSummary,
  FinishReason,
  ProgressEvaluation,
} from '@domain/progress/progress-model';

import { Either } from '../common/either';
import type { IEventBus } from '../ports/event-bus';
import type { ILogger } from '../ports/logger';
import type { IProgressRepository } from '../ports/progress-repository';
import type { ISessionProvider } from '../ports/session-provider';
import type { ISyncQueue } from '../ports/sync-queue';
import type { AsyncCommandService } from './use-case';

/** Result data returned to the victory or defeat screen (CU-07, RF-16). */
export interface FinishGameOutput {
  readonly score: number;
  readonly seed: number | null;
  readonly reason: FinishReason;
  readonly isNewRecord: boolean;
  readonly stars: number | null;
  readonly unlockedLevelId: string | null;
  /** `true` when local saving failed; the result screen is still shown (CU-07 A3). */
  readonly saveFailed: boolean;
}

/** Ports and registry injected into `FinishGameUseCase` (DIP). */
export interface FinishGameDeps {
  readonly factories: VariantFactoryRegistry;
  readonly progress: IProgressRepository;
  readonly sessions: ISessionProvider;
  readonly syncQueue: ISyncQueue;
  readonly eventBus: IEventBus;
  readonly logger: ILogger;
}

/**
 * Generic use case CU-07 (Finish game): evaluates progress via the variant's
 * `IProgressModel` strategy, saves it locally, queues sync and score
 * submission when a session is active (RF-27), publishes the completion event
 * and returns the result screen data without conditionals per variant.
 */
export class FinishGameUseCase implements AsyncCommandService<
  FinishedGameSummary,
  FinishGameOutput
> {
  constructor(private readonly deps: FinishGameDeps) {}

  async execute(
    summary: FinishedGameSummary,
  ): Promise<Either<Error, FinishGameOutput>> {
    const progressModel = this.deps.factories
      .get(summary.gameId)
      .createProgressModel();
    const current =
      (await this.deps.progress.findByGame(summary.gameId)) ??
      emptyProgress(summary.gameId);
    const evaluation = progressModel.evaluate(current, summary);

    const { gameId } = summary;
    const { progress } = evaluation;
    const saved =
      progress !== null &&
      (await this.attempt(
        'Failed to save progress locally',
        gameId,
        async () => {
          await this.deps.progress.save(progress);
          return true;
        },
        false,
      ));

    const hasSession = await this.attempt(
      'Failed to check the account session',
      gameId,
      () => this.deps.sessions.hasActiveSession(),
      false,
    );
    if (hasSession) {
      // Only what was saved is synced; otherwise old progress would be sent.
      if (saved) {
        await this.attempt(
          'Failed to queue progress sync',
          gameId,
          () => this.deps.syncQueue.enqueueProgressSync(gameId),
          undefined,
        );
      }
      if (evaluation.shouldSubmitScore) {
        await this.attempt(
          'Failed to queue score submission',
          gameId,
          () => this.deps.syncQueue.enqueueScoreSubmission(summary),
          undefined,
        );
      }
    }

    this.deps.eventBus.publish(this.endEvent(summary, evaluation));

    return Either.right({
      score: summary.score,
      seed: summary.seed,
      reason: summary.reason,
      isNewRecord: evaluation.isNewRecord,
      stars: evaluation.stars,
      unlockedLevelId: evaluation.unlockedLevelId,
      saveFailed: progress !== null && !saved,
    });
  }

  /**
   * Runs a step the result screen does not depend on (local save, session
   * check, queueing). If it throws, logs a warning and returns `fallback`, so
   * the player still sees the result (CU-07 A3, RF-27).
   */
  private async attempt<T>(
    message: string,
    gameId: GameId,
    step: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    try {
      return await step();
    } catch (error) {
      this.deps.logger.warn(message, {
        gameId,
        error: error instanceof Error ? error.message : String(error),
      });
      return fallback;
    }
  }

  /** `LevelCompleted` when a level is won, `GameFinished` otherwise (CU-07 step 5). */
  private endEvent(
    summary: FinishedGameSummary,
    evaluation: ProgressEvaluation,
  ): ProgressEvent {
    if (summary.levelId !== null && summary.reason === 'victory') {
      return {
        type: 'LevelCompleted',
        gameId: summary.gameId,
        levelId: summary.levelId,
        stars: evaluation.stars,
      };
    }
    return {
      type: 'GameFinished',
      gameId: summary.gameId,
      reason: summary.reason,
      score: summary.score,
      isNewRecord: evaluation.isNewRecord,
    };
  }
}
