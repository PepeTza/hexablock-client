import { Either } from '@application/common/either';
import type { IEventBus } from '@application/ports/event-bus';
import type {
  ILevelRepository,
  ILevelSummary,
} from '@application/ports/level-repository';
import type { ILogger } from '@application/ports/logger';
import type { IProgressRepository } from '@application/ports/progress-repository';
import type { ISessionProvider } from '@application/ports/session-provider';
import type { ISyncQueue } from '@application/ports/sync-queue';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import type { AsyncCommandService } from '@application/use-cases/use-case';
import type { GameId, PlayerProgress } from '@domain/progress/player-progress';
import type { ProgressEvent } from '@domain/progress/progress-events';
import type { FinishedGameSummary } from '@domain/progress/progress-model';

/** Object Mother / Test Doubles for application-layer ports (Clean Architecture Ch. 28). */

export class FakeProgressRepository implements IProgressRepository {
  private readonly store = new Map<GameId, PlayerProgress>();

  constructor(initial: readonly PlayerProgress[] = []) {
    for (const progress of initial) {
      this.store.set(progress.gameId, progress);
    }
  }

  findByGame(gameId: GameId): Promise<PlayerProgress | null> {
    return Promise.resolve(this.store.get(gameId) ?? null);
  }

  save(progress: PlayerProgress): Promise<void> {
    this.store.set(progress.gameId, progress);
    return Promise.resolve();
  }
}

export class FakeLevelRepository implements ILevelRepository {
  private readonly levelsByGame: ReadonlyMap<GameId, readonly ILevelSummary[]>;

  constructor(
    entries: Readonly<Record<GameId, readonly ILevelSummary[]>> = {},
  ) {
    this.levelsByGame = new Map(Object.entries(entries));
  }

  findByGame(gameId: GameId): Promise<readonly ILevelSummary[]> {
    return Promise.resolve(this.levelsByGame.get(gameId) ?? []);
  }

  findById(gameId: GameId, levelId: string): Promise<ILevelSummary | null> {
    const found =
      this.levelsByGame.get(gameId)?.find((level) => level.id === levelId) ??
      null;
    return Promise.resolve(found);
  }
}

export class FakeSessionProvider implements ISessionProvider {
  constructor(private readonly active: boolean = false) {}

  hasActiveSession(): Promise<boolean> {
    return Promise.resolve(this.active);
  }
}

export class FakeSyncQueue implements ISyncQueue {
  readonly progressSyncs: GameId[] = [];
  readonly scoreSubmissions: FinishedGameSummary[] = [];

  enqueueProgressSync(gameId: GameId): Promise<void> {
    this.progressSyncs.push(gameId);
    return Promise.resolve();
  }

  enqueueScoreSubmission(summary: FinishedGameSummary): Promise<void> {
    this.scoreSubmissions.push(summary);
    return Promise.resolve();
  }
}

export class FakeEventBus implements IEventBus {
  readonly published: ProgressEvent[] = [];

  publish(event: ProgressEvent): void {
    this.published.push(event);
  }
}

export class FakeLogger implements ILogger {
  readonly infos: { readonly message: string; readonly context?: unknown }[] =
    [];
  readonly warnings: {
    readonly message: string;
    readonly context?: unknown;
  }[] = [];
  readonly errors: { readonly message: string; readonly context?: unknown }[] =
    [];

  info(message: string, context?: unknown): void {
    this.infos.push({ message, context });
  }

  warn(message: string, context?: unknown): void {
    this.warnings.push({ message, context });
  }

  error(message: string, context?: unknown): void {
    this.errors.push({ message, context });
  }
}

export function createFinishGameStub(output: Partial<FinishGameOutput> = {}): {
  readonly finishGame: AsyncCommandService<
    FinishedGameSummary,
    FinishGameOutput
  >;
  readonly calls: FinishedGameSummary[];
} {
  const calls: FinishedGameSummary[] = [];
  const finishGame: AsyncCommandService<FinishedGameSummary, FinishGameOutput> =
    {
      execute: (summary) => {
        calls.push(summary);
        return Promise.resolve(
          Either.right({
            score: summary.score,
            seed: summary.seed,
            reason: summary.reason,
            isNewRecord: true,
            stars: null,
            unlockedLevelId: null,
            saveFailed: false,
            ...output,
          }),
        );
      },
    };
  return { finishGame, calls };
}
