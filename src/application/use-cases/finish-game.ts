import type { VariantFactoryRegistry } from '@domain/engine/game/variant-factory';
import { emptyProgress } from '@domain/progress/player-progress';
import type { ProgressEvent } from '@domain/progress/progress-events';
import type {
  FinishedGameSummary,
  FinishReason,
  ProgressEvaluation,
} from '@domain/progress/progress-model';

import type { IEventBus } from '../ports/event-bus';
import type { ILogger } from '../ports/logger';
import type { IProgressRepository } from '../ports/progress-repository';
import type { ISessionProvider } from '../ports/session-provider';
import type { ISyncQueue } from '../ports/sync-queue';
import type { IUseCase } from './use-case';

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
export class FinishGameUseCase implements IUseCase<
  FinishedGameSummary,
  Promise<FinishGameOutput>
> {
  constructor(private readonly deps: FinishGameDeps) {}

  async execute(summary: FinishedGameSummary): Promise<FinishGameOutput> {
    const progressModel = this.deps.factories
      .get(summary.gameId)
      .createProgressModel();
    const current =
      (await this.deps.progress.findByGame(summary.gameId)) ??
      emptyProgress(summary.gameId);
    const evaluation = progressModel.evaluate(current, summary);

    let saveFailed = false;
    if (evaluation.progress !== null) {
      try {
        await this.deps.progress.save(evaluation.progress);
      } catch (error) {
        saveFailed = true;
        this.deps.logger.warn('Failed to save progress locally', {
          gameId: summary.gameId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (await this.deps.sessions.hasActiveSession()) {
      if (evaluation.progress !== null) {
        await this.deps.syncQueue.enqueueProgressSync(summary.gameId);
      }
      if (evaluation.shouldSubmitScore) {
        await this.deps.syncQueue.enqueueScoreSubmission(summary);
      }
    }

    this.deps.eventBus.publish(this.endEvent(summary, evaluation));

    return {
      score: summary.score,
      seed: summary.seed,
      reason: summary.reason,
      isNewRecord: evaluation.isNewRecord,
      stars: evaluation.stars,
      unlockedLevelId: evaluation.unlockedLevelId,
      saveFailed,
    };
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
