import type { EventListener } from '@domain/engine/events/domain-event';
import type {
  IGameSession,
  VariantFactoryRegistry,
} from '@domain/engine/game/variant-factory';
import type { GameId } from '@domain/progress/player-progress';

import type {
  ILevelRepository,
  ILevelSummary,
} from '../ports/level-repository';
import type { IProgressRepository } from '../ports/progress-repository';
import type {
  ISeedConfigRepository,
  ISeedGenerator,
} from '../ports/seed-config-repository';
import type { IUseCase } from './use-case';

/** Input required to start a new game session (CU-01). */
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
export class StartGameUseCase implements IUseCase<
  StartGameInput,
  Promise<StartGameOutput>
> {
  constructor(private readonly deps: StartGameDeps) {}

  async execute(input: StartGameInput): Promise<StartGameOutput> {
    const factory = this.deps.factories.get(input.gameId);
    const level = factory.usesLevels
      ? await this.loadUnlockedLevel(input.gameId, input.levelId)
      : undefined;
    const seed = factory.usesSeed
      ? await this.resolveSeed(input.gameId, level?.id)
      : null;
    const engine = factory.createEngine({
      seed,
      level,
      listeners: input.listeners,
    });
    return {
      gameId: input.gameId,
      levelId: level?.id ?? null,
      seed,
      engine,
    };
  }

  private async loadUnlockedLevel(
    gameId: GameId,
    levelId: string | undefined,
  ): Promise<ILevelSummary> {
    if (levelId === undefined) {
      throw new RangeError(`Variant ${gameId} requires a levelId`);
    }
    const level = await this.deps.levels.findById(gameId, levelId);
    if (level === null) {
      throw new RangeError(`Level ${levelId} was not found for ${gameId}`);
    }
    const ordered = [...(await this.deps.levels.findByGame(gameId))].sort(
      (a, b) => a.order - b.order,
    );
    const position = ordered.findIndex((item) => item.id === level.id);
    if (position > 0) {
      const previous = ordered[position - 1];
      if (previous !== undefined) {
        const progress = await this.deps.progress.findByGame(gameId);
        const isUnlocked = progress?.levels[previous.id]?.completed === true;
        if (!isUnlocked) {
          throw new RangeError(`Level ${level.id} is locked`);
        }
      }
    }
    return level;
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
