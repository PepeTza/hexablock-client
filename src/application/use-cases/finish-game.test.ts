import type { DomainEvent } from '@domain/engine/events/domain-event';
import {
  type IGameSession,
  type IVariantFactory,
  VariantFactoryRegistry,
} from '@domain/engine/game/variant-factory';
import type { GameId, PlayerProgress } from '@domain/progress/player-progress';
import type {
  FinishedGameSummary,
  IProgressModel,
  ProgressEvaluation,
} from '@domain/progress/progress-model';
import { SortProgressModel } from '@domain/variants/hexa-sort/sort-progress-model';

import type { Either } from '../common/either';
import type { IEventBus } from '../ports/event-bus';
import type { ILogger, LogContext } from '../ports/logger';
import type { IProgressRepository } from '../ports/progress-repository';
import type { ISessionProvider } from '../ports/session-provider';
import type { ISyncQueue } from '../ports/sync-queue';
import { FinishGameUseCase } from './finish-game';

function expectRight<T>(outcome: Either<Error, T>): T {
  if (outcome.isLeft()) {
    throw outcome.value;
  }
  return outcome.value;
}

function createFactoryWithProgressModel(
  gameId: GameId,
  progressModel: IProgressModel,
): IVariantFactory {
  const session: IGameSession = {
    seed: null,
    state: { score: 0, moveCount: 0 },
    status: 'finished',
    outcome: 'victory',
    subscribe: () => () => undefined,
    applyMove: () => ({ kind: 'rejected', reason: 'stub' }),
    pause: () => undefined,
    resume: () => undefined,
    resolutionDone: () => undefined,
  };
  return {
    gameId,
    usesSeed: true,
    usesLevels: false,
    createEngine: () => session,
    createProgressModel: () => progressModel,
  };
}

function createHarness(options: {
  evaluation: ProgressEvaluation;
  activeSession?: boolean;
  failSave?: boolean;
  failSession?: boolean;
  failProgressSync?: boolean;
  failScoreSubmission?: boolean;
}) {
  const saved: PlayerProgress[] = [];
  const syncedGames: GameId[] = [];
  const submittedScores: FinishedGameSummary[] = [];
  const publishedEvents: DomainEvent[] = [];
  const warnings: { message: string; context?: LogContext }[] = [];

  const factories = new VariantFactoryRegistry();
  factories.register(
    'hexa-lines',
    createFactoryWithProgressModel('hexa-lines', {
      evaluate: () => options.evaluation,
    }),
  );
  factories.register(
    'hexa-fit',
    createFactoryWithProgressModel('hexa-fit', {
      evaluate: () => options.evaluation,
    }),
  );
  // The real Hexa Sort model, so the Sort tests cover CU-07 end to end.
  factories.register(
    'hexa-sort',
    createFactoryWithProgressModel(
      'hexa-sort',
      new SortProgressModel((id) => (id === 'sort-01' ? 'sort-02' : null)),
    ),
  );

  const progress: IProgressRepository = {
    findByGame: () => Promise.resolve(null),
    save: (entry) => {
      if (options.failSave) {
        return Promise.reject(new Error('disk full'));
      }
      saved.push(entry);
      return Promise.resolve();
    },
  };
  const sessions: ISessionProvider = {
    hasActiveSession: () =>
      options.failSession
        ? Promise.reject(new Error('token store unavailable'))
        : Promise.resolve(options.activeSession ?? false),
  };
  const syncQueue: ISyncQueue = {
    enqueueProgressSync: (gameId) => {
      if (options.failProgressSync) {
        return Promise.reject(new Error('queue full'));
      }
      syncedGames.push(gameId);
      return Promise.resolve();
    },
    enqueueScoreSubmission: (summary) => {
      if (options.failScoreSubmission) {
        return Promise.reject(new Error('queue full'));
      }
      submittedScores.push(summary);
      return Promise.resolve();
    },
  };
  const eventBus: IEventBus = {
    publish: (event) => {
      publishedEvents.push(event);
    },
  };
  const logger: ILogger = {
    info: () => undefined,
    warn: (message, context) => {
      warnings.push({ message, context });
    },
    error: () => undefined,
  };

  const useCase = new FinishGameUseCase({
    factories,
    progress,
    sessions,
    syncQueue,
    eventBus,
    logger,
  });

  return {
    useCase,
    saved,
    syncedGames,
    submittedScores,
    publishedEvents,
    warnings,
  };
}

/** A finished Hexa Sort game on level `sort-01`. */
function sortGame(reason: 'victory' | 'defeat'): FinishedGameSummary {
  return {
    gameId: 'hexa-sort',
    levelId: 'sort-01',
    reason,
    score: 120,
    moveCount: 14,
    durationMs: 90_000,
    seed: 7,
  };
}

/** Any evaluation: the Hexa Sort tests use the real model instead. */
const UNUSED_EVALUATION: ProgressEvaluation = {
  progress: null,
  isNewRecord: false,
  stars: null,
  unlockedLevelId: null,
  shouldSubmitScore: false,
};

/** A finished Hexa Lines game lost with `score` points. */
function linesDefeat(score: number): FinishedGameSummary {
  return {
    gameId: 'hexa-lines',
    levelId: null,
    reason: 'defeat',
    score,
    moveCount: 10,
    durationMs: 30_000,
    seed: 5,
  };
}

describe('FinishGameUseCase', () => {
  it('should_publish_game_finished_with_its_data_when_guest_finishes', async () => {
    // Arrange
    const updated: PlayerProgress = {
      gameId: 'hexa-lines',
      highScore: 320,
      levels: {},
    };
    const harness = createHarness({
      evaluation: {
        progress: updated,
        isNewRecord: true,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: true,
      },
      activeSession: false,
    });

    // Act
    const result = expectRight(
      await harness.useCase.execute({
        gameId: 'hexa-lines',
        levelId: null,
        reason: 'defeat',
        score: 320,
        moveCount: 15,
        durationMs: 45_000,
        seed: 42,
      }),
    );

    // Assert
    expect(result).toEqual({
      score: 320,
      seed: 42,
      reason: 'defeat',
      isNewRecord: true,
      stars: null,
      unlockedLevelId: null,
      saveFailed: false,
    });
    expect(harness.saved).toEqual([updated]);
    expect(harness.syncedGames).toEqual([]);
    expect(harness.submittedScores).toEqual([]);
    expect(harness.publishedEvents).toEqual([
      {
        type: 'GameFinished',
        gameId: 'hexa-lines',
        reason: 'defeat',
        score: 320,
        isNewRecord: true,
      },
    ]);
  });

  it('should_enqueue_sync_and_score_submission_when_player_has_active_session', async () => {
    // Arrange
    const updated: PlayerProgress = {
      gameId: 'hexa-lines',
      highScore: 500,
      levels: {},
    };
    const harness = createHarness({
      evaluation: {
        progress: updated,
        isNewRecord: true,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: true,
      },
      activeSession: true,
    });
    const summary: FinishedGameSummary = {
      gameId: 'hexa-lines',
      levelId: null,
      reason: 'defeat',
      score: 500,
      moveCount: 22,
      durationMs: 60_000,
      seed: 7,
    };

    // Act
    await harness.useCase.execute(summary);

    // Assert
    expect(harness.syncedGames).toEqual(['hexa-lines']);
    expect(harness.submittedScores).toEqual([summary]);
  });

  it('should_skip_saving_and_score_submission_when_progress_model_reports_no_change', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: {
        progress: null,
        isNewRecord: false,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: false,
      },
      activeSession: true,
    });

    // Act
    const result = expectRight(
      await harness.useCase.execute({
        gameId: 'hexa-fit',
        levelId: 'fit-01',
        reason: 'quit',
        score: 0,
        moveCount: 2,
        durationMs: 5_000,
        seed: null,
      }),
    );

    // Assert
    expect(result.saveFailed).toBe(false);
    expect(harness.saved).toEqual([]);
    expect(harness.syncedGames).toEqual([]);
    expect(harness.submittedScores).toEqual([]);
  });

  it('should_publish_game_finished_with_reason_quit_when_player_quits', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: {
        progress: null,
        isNewRecord: false,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: false,
      },
    });

    // Act
    await harness.useCase.execute({
      gameId: 'hexa-fit',
      levelId: 'fit-01',
      reason: 'quit',
      score: 0,
      moveCount: 2,
      durationMs: 5_000,
      seed: null,
    });

    // Assert
    expect(harness.publishedEvents).toEqual([
      {
        type: 'GameFinished',
        gameId: 'hexa-fit',
        reason: 'quit',
        score: 0,
        isNewRecord: false,
      },
    ]);
  });

  it('should_publish_level_completed_with_stars_when_a_level_is_won', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: {
        progress: {
          gameId: 'hexa-fit',
          highScore: 0,
          levels: {
            'fit-01': { completed: true, bestScore: 250, stars: 3 },
          },
        },
        isNewRecord: true,
        stars: 3,
        unlockedLevelId: 'fit-02',
        shouldSubmitScore: true,
      },
      activeSession: false,
    });

    // Act
    const result = expectRight(
      await harness.useCase.execute({
        gameId: 'hexa-fit',
        levelId: 'fit-01',
        reason: 'victory',
        score: 250,
        moveCount: 5,
        durationMs: 12_000,
        seed: null,
      }),
    );

    // Assert
    expect(result.stars).toBe(3);
    expect(result.unlockedLevelId).toBe('fit-02');
    expect(harness.publishedEvents).toEqual([
      {
        type: 'LevelCompleted',
        gameId: 'hexa-fit',
        levelId: 'fit-01',
        stars: 3,
      },
    ]);
  });

  it('should_publish_level_completed_without_stars_when_a_sort_level_is_won', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: UNUSED_EVALUATION,
      activeSession: true,
    });

    // Act
    const result = expectRight(
      await harness.useCase.execute(sortGame('victory')),
    );

    // Assert
    expect(result).toEqual({
      score: 120,
      seed: 7,
      reason: 'victory',
      isNewRecord: true,
      stars: null,
      unlockedLevelId: 'sort-02',
      saveFailed: false,
    });
    expect(harness.saved).toEqual([
      {
        gameId: 'hexa-sort',
        highScore: 0,
        levels: { 'sort-01': { completed: true, bestScore: 120, stars: 0 } },
      },
    ]);
    expect(harness.submittedScores).toEqual([sortGame('victory')]);
    expect(harness.publishedEvents).toEqual([
      {
        type: 'LevelCompleted',
        gameId: 'hexa-sort',
        levelId: 'sort-01',
        stars: null,
      },
    ]);
  });

  it('should_keep_progress_and_send_no_score_when_a_sort_level_is_lost', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: UNUSED_EVALUATION,
      activeSession: true,
    });

    // Act
    const result = expectRight(
      await harness.useCase.execute(sortGame('defeat')),
    );

    // Assert: CU-07 A1.
    expect(result).toMatchObject({
      reason: 'defeat',
      seed: 7,
      unlockedLevelId: null,
    });
    expect(harness.saved).toEqual([]);
    expect(harness.syncedGames).toEqual([]);
    expect(harness.submittedScores).toEqual([]);
    expect(harness.publishedEvents).toEqual([
      {
        type: 'GameFinished',
        gameId: 'hexa-sort',
        reason: 'defeat',
        score: 120,
        isNewRecord: false,
      },
    ]);
  });

  it('should_still_return_result_with_warning_when_saving_progress_fails', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: {
        progress: { gameId: 'hexa-lines', highScore: 100, levels: {} },
        isNewRecord: true,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: true,
      },
      failSave: true,
    });

    // Act
    const result = expectRight(
      await harness.useCase.execute({
        gameId: 'hexa-lines',
        levelId: null,
        reason: 'defeat',
        score: 100,
        moveCount: 8,
        durationMs: 20_000,
        seed: 12,
      }),
    );

    // Assert
    expect(result.saveFailed).toBe(true);
    expect(result.score).toBe(100);
    expect(harness.warnings).toHaveLength(1);
    expect(harness.warnings[0]?.context).toMatchObject({
      gameId: 'hexa-lines',
      error: 'disk full',
    });
  });
  it('should_still_return_result_with_warning_when_session_provider_fails', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: {
        progress: { gameId: 'hexa-lines', highScore: 180, levels: {} },
        isNewRecord: true,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: true,
      },
      failSession: true,
    });

    // Act
    const result = expectRight(await harness.useCase.execute(linesDefeat(180)));

    // Assert
    expect(result.score).toBe(180);
    expect(result.saveFailed).toBe(false);
    expect(harness.syncedGames).toEqual([]);
    expect(harness.submittedScores).toEqual([]);
    expect(harness.warnings).toEqual([
      {
        message: 'Failed to check the account session',
        context: { gameId: 'hexa-lines', error: 'token store unavailable' },
      },
    ]);
    expect(harness.publishedEvents).toHaveLength(1);
  });

  it('should_still_queue_score_with_warning_when_progress_sync_queueing_fails', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: {
        progress: { gameId: 'hexa-lines', highScore: 210, levels: {} },
        isNewRecord: true,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: true,
      },
      activeSession: true,
      failProgressSync: true,
    });
    const summary = linesDefeat(210);

    // Act
    const result = expectRight(await harness.useCase.execute(summary));

    // Assert
    expect(result.score).toBe(210);
    expect(harness.submittedScores).toEqual([summary]);
    expect(harness.warnings).toEqual([
      {
        message: 'Failed to queue progress sync',
        context: { gameId: 'hexa-lines', error: 'queue full' },
      },
    ]);
  });

  it('should_still_return_result_with_warning_when_score_submission_queueing_fails', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: {
        progress: { gameId: 'hexa-lines', highScore: 240, levels: {} },
        isNewRecord: true,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: true,
      },
      activeSession: true,
      failScoreSubmission: true,
    });

    // Act
    const result = expectRight(await harness.useCase.execute(linesDefeat(240)));

    // Assert
    expect(result.score).toBe(240);
    expect(harness.syncedGames).toEqual(['hexa-lines']);
    expect(harness.warnings).toEqual([
      {
        message: 'Failed to queue score submission',
        context: { gameId: 'hexa-lines', error: 'queue full' },
      },
    ]);
    expect(harness.publishedEvents).toHaveLength(1);
  });

  it('should_not_queue_progress_sync_when_saving_progress_fails', async () => {
    // Arrange
    const harness = createHarness({
      evaluation: {
        progress: { gameId: 'hexa-lines', highScore: 90, levels: {} },
        isNewRecord: true,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: true,
      },
      activeSession: true,
      failSave: true,
    });
    const summary = linesDefeat(90);

    // Act
    const result = expectRight(await harness.useCase.execute(summary));

    // Assert
    expect(result.saveFailed).toBe(true);
    expect(harness.syncedGames).toEqual([]);
    expect(harness.submittedScores).toEqual([summary]);
  });
});
