import type { EventListener } from '@domain/engine/events/domain-event';
import type {
  IGameSession,
  VariantFactoryRegistry,
} from '@domain/engine/game/variant-factory';
import type { GameId } from '@domain/progress/player-progress';

import { Either } from '../common/either';
import type {
  ILevelRepository,
  ILevelSummary,
} from '../ports/level-repository';
import type { IProgressRepository } from '../ports/progress-repository';
import type {
  ISeedConfigRepository,
  ISeedGenerator,
} from '../ports/seed-config-repository';
import type { AsyncCommandService } from './use-case';

/** Command required to start a new game session (CU-01). */
export interface StartGameInput {
  readonly gameId: GameId;
  readonly levelId?: string;
  readonly listeners?: readonly EventListener[];
}

/** Running session and resolved configuration returned to the UI (CU-01). */
export interface StartGameOutput {
  readonly gameId: GameId;
  readonly levelId: string | null;
  readonly seed: number | null;
  readonly engine: IGameSession;
}

/** Ports and registry injected into `StartGameUseCase` (DIP). */
export interface StartGameDeps {
  readonly factories: VariantFactoryRegistry;
  readonly levels: ILevelRepository;
  readonly progress: IProgressRepository;
  readonly seedConfigs: ISeedConfigRepository;
  readonly seedGenerator: ISeedGenerator;
}

/**
 * Generic use case CU-01 (Start game): looks up the variant's Abstract
 * Factory from `VariantFactoryRegistry`, validates level existence and unlock
 * status when applicable (RN-19, RN-25), resolves the seed (RN-05) and starts
 * the engine with zero conditionals per variant (OCP).
 */
export class StartGameUseCase implements AsyncCommandService<
  StartGameInput,
  StartGameOutput
> {
  constructor(private readonly deps: StartGameDeps) {}

  async execute(
    input: StartGameInput,
  ): Promise<Either<Error, StartGameOutput>> {
    if (!this.deps.factories.has(input.gameId)) {
      return Either.left(
        new RangeError(`No variant factory registered for ${input.gameId}`),
      );
    }
    const factory = this.deps.factories.get(input.gameId);

    let level: ILevelSummary | undefined;
    if (factory.usesLevels) {
      const levelOutcome = await this.loadUnlockedLevel(
        input.gameId,
        input.levelId,
      );
      if (levelOutcome.isLeft()) {
        return Either.left(levelOutcome.value);
      }
      level = levelOutcome.value;
    }

    const seed = factory.usesSeed
      ? await this.resolveSeed(input.gameId, level?.id)
      : null;
    const engine = factory.createEngine({
      seed,
      level,
      listeners: input.listeners,
    });
    return Either.right({
      gameId: input.gameId,
      levelId: level?.id ?? null,
      seed,
      engine,
    });
  }

  private async loadUnlockedLevel(
    gameId: GameId,
    levelId: string | undefined,
  ): Promise<Either<Error, ILevelSummary>> {
    if (levelId === undefined) {
      return Either.left(
        new RangeError(`Variant ${gameId} requires a levelId`),
      );
    }
    const level = await this.deps.levels.findById(gameId, levelId);
    if (level === null) {
      return Either.left(
        new RangeError(`Level ${levelId} was not found for ${gameId}`),
      );
    }
    const ordered = [...(await this.deps.levels.findByGame(gameId))].sort(
      (a, b) => a.order - b.order,
    );
    const position = ordered.findIndex((item) => item.id === level.id);
    if (position === -1) {
      // Without its place in the list the unlock check cannot run, so the
      // level is treated as missing rather than as unlocked (CU-01 A2).
      return Either.left(
        new RangeError(`Level ${levelId} was not found for ${gameId}`),
      );
    }
    if (position > 0) {
      const previous = ordered[position - 1];
      if (previous !== undefined) {
        const progress = await this.deps.progress.findByGame(gameId);
        const isUnlocked = progress?.levels[previous.id]?.completed === true;
        if (!isUnlocked) {
          return Either.left(new RangeError(`Level ${level.id} is locked`));
        }
      }
    }
    return Either.right(level);
  }

  private async resolveSeed(
    gameId: GameId,
    levelId: string | undefined,
  ): Promise<number> {
    const config = await this.deps.seedConfigs.findSeedConfig(gameId, levelId);
    if (config?.mode === 'fixed') {
      return config.value;
    }
    return this.deps.seedGenerator.generate();
  }
}
