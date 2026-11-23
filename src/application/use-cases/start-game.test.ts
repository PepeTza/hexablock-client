import type { SeedConfig } from '@domain/content/seed-config';
import {
  type IGameSession,
  type IVariantFactory,
  VariantFactoryRegistry,
  type VariantStartContext,
} from '@domain/engine/game/variant-factory';
import type { GameId, PlayerProgress } from '@domain/progress/player-progress';
import type { IProgressModel } from '@domain/progress/progress-model';

import type { Either } from '../common/either';
import type {
  ILevelRepository,
  ILevelSummary,
} from '../ports/level-repository';
import type { IProgressRepository } from '../ports/progress-repository';
import type {
  ISeedConfigRepository,
  ISeedGenerator,
} from '../ports/seed-config-repository';
import { StartGameUseCase } from './start-game';

function expectRight<T>(outcome: Either<Error, T>): T {
  if (outcome.isLeft()) {
    throw outcome.value;
  }
  return outcome.value;
}

function createFakeSession(seed: number | null): IGameSession {
  return {
    seed,
    state: { score: 0, moveCount: 0 },
    status: 'playing',
    outcome: null,
    subscribe: () => () => undefined,
    applyMove: () => ({ kind: 'rejected', reason: 'stub' }),
    pause: () => undefined,
    resume: () => undefined,
    resolutionDone: () => undefined,
  };
}

function createFakeFactory(
  gameId: GameId,
  options: { usesSeed: boolean; usesLevels: boolean },
  received: VariantStartContext[],
): IVariantFactory {
  const progressModel: IProgressModel = {
    evaluate: () => ({
      progress: null,
      isNewRecord: false,
      stars: null,
      unlockedLevelId: null,
      shouldSubmitScore: false,
    }),
  };
  return {
    gameId,
    usesSeed: options.usesSeed,
    usesLevels: options.usesLevels,
    createEngine: (context) => {
      received.push(context);
      return createFakeSession(context.seed);
    },
    createProgressModel: () => progressModel,
  };
}

function createHarness(
  options: {
    levels?: readonly ILevelSummary[];
    /** What `findByGame` lists; defaults to `levels`. */
    listedLevels?: readonly ILevelSummary[];
    progress?: ReadonlyMap<GameId, PlayerProgress>;
    seedConfigs?: ReadonlyMap<string, SeedConfig>;
    generatedSeed?: number;
  } = {},
) {
  const received: VariantStartContext[] = [];
  const factories = new VariantFactoryRegistry();
  factories.register(
    'hexa-lines',
    createFakeFactory(
      'hexa-lines',
      { usesSeed: true, usesLevels: false },
      received,
    ),
  );
  factories.register(
    'hexa-fit',
    createFakeFactory(
      'hexa-fit',
      { usesSeed: false, usesLevels: true },
      received,
    ),
  );
  factories.register(
    'hexa-sort',
    createFakeFactory(
      'hexa-sort',
      { usesSeed: true, usesLevels: true },
      received,
    ),
  );

  const levelsList = options.levels ?? [];
  const listedLevels = options.listedLevels ?? levelsList;
  const levels: ILevelRepository = {
    findByGame: (gameId) =>
      Promise.resolve(listedLevels.filter((level) => level.gameId === gameId)),
    findById: (gameId, levelId) =>
      Promise.resolve(
        levelsList.find(
          (level) => level.gameId === gameId && level.id === levelId,
        ) ?? null,
      ),
  };

  const progressMap = options.progress ?? new Map<GameId, PlayerProgress>();
  const progress: IProgressRepository = {
    findByGame: (gameId) => Promise.resolve(progressMap.get(gameId) ?? null),
    save: () => Promise.resolve(),
  };

  const seedMap = options.seedConfigs ?? new Map<string, SeedConfig>();
  const seedConfigs: ISeedConfigRepository = {
    findSeedConfig: (gameId, levelId) =>
      Promise.resolve(
        seedMap.get(levelId ? `${gameId}:${levelId}` : gameId) ?? null,
      ),
  };

  const seedGenerator: ISeedGenerator = {
    generate: () => options.generatedSeed ?? 9999,
  };

  const useCase = new StartGameUseCase({
    factories,
    levels,
    progress,
    seedConfigs,
    seedGenerator,
  });

  return { useCase, received };
}

describe('StartGameUseCase', () => {
  it('should_start_engine_with_fixed_seed_when_seed_config_is_fixed', async () => {
    // Arrange
    const { useCase, received } = createHarness({
      seedConfigs: new Map([['hexa-lines', { mode: 'fixed', value: 1234 }]]),
    });

    // Act
    const result = expectRight(await useCase.execute({ gameId: 'hexa-lines' }));

    // Assert
    expect(result.seed).toBe(1234);
    expect(result.levelId).toBeNull();
    expect(result.engine.seed).toBe(1234);
    expect(received[0]?.seed).toBe(1234);
  });

  it('should_generate_random_seed_when_seed_config_is_random_or_missing', async () => {
    // Arrange
    const withRandomConfig = createHarness({
      seedConfigs: new Map([['hexa-lines', { mode: 'random' }]]),
      generatedSeed: 777,
    });
    const withoutConfig = createHarness({ generatedSeed: 888 });

    // Act
    const fromRandom = expectRight(
      await withRandomConfig.useCase.execute({ gameId: 'hexa-lines' }),
    );
    const fromFallback = expectRight(
      await withoutConfig.useCase.execute({ gameId: 'hexa-lines' }),
    );

    // Assert
    expect(fromRandom.seed).toBe(777);
    expect(fromFallback.seed).toBe(888);
  });

  it('should_start_engine_with_null_seed_when_variant_uses_no_seed', async () => {
    // Arrange
    const level1: ILevelSummary = {
      id: 'fit-01',
      gameId: 'hexa-fit',
      order: 1,
    };
    const { useCase, received } = createHarness({ levels: [level1] });

    // Act
    const result = expectRight(
      await useCase.execute({ gameId: 'hexa-fit', levelId: 'fit-01' }),
    );

    // Assert
    expect(result.seed).toBeNull();
    expect(result.levelId).toBe('fit-01');
    expect(received[0]?.level).toEqual(level1);
  });

  it('should_load_unlocked_level_when_variant_uses_levels', async () => {
    // Arrange
    const levels: ILevelSummary[] = [
      { id: 'sort-02', gameId: 'hexa-sort', order: 2 },
      { id: 'sort-01', gameId: 'hexa-sort', order: 1 },
    ];
    const progress = new Map<GameId, PlayerProgress>([
      [
        'hexa-sort',
        {
          gameId: 'hexa-sort',
          highScore: 0,
          levels: {
            'sort-01': { completed: true, bestScore: 100, stars: 0 },
          },
        },
      ],
    ]);
    const { useCase } = createHarness({
      levels,
      progress,
      seedConfigs: new Map([
        ['hexa-sort:sort-02', { mode: 'fixed', value: 55 }],
      ]),
    });

    // Act
    const result = expectRight(
      await useCase.execute({ gameId: 'hexa-sort', levelId: 'sort-02' }),
    );

    // Assert
    expect(result.levelId).toBe('sort-02');
    expect(result.seed).toBe(55);
  });

  it('should_return_either_left_when_variant_factory_is_missing', async () => {
    // Arrange
    const { useCase } = createHarness();

    // Act
    const outcome = await useCase.execute({ gameId: 'unknown-variant' });

    // Assert
    expect(outcome.isLeft()).toBe(true);
    expect(
      outcome.fold(
        (err) => err.message,
        () => '',
      ),
    ).toBe('No variant factory registered for unknown-variant');
  });

  it('should_return_either_left_when_level_is_missing_or_locked', async () => {
    // Arrange
    const levels: ILevelSummary[] = [
      { id: 'fit-01', gameId: 'hexa-fit', order: 1 },
      { id: 'fit-02', gameId: 'hexa-fit', order: 2 },
    ];
    const { useCase } = createHarness({ levels });

    // Act
    const missingId = await useCase.execute({ gameId: 'hexa-fit' });
    const unknownLevel = await useCase.execute({
      gameId: 'hexa-fit',
      levelId: 'fit-99',
    });
    const lockedLevel = await useCase.execute({
      gameId: 'hexa-fit',
      levelId: 'fit-02',
    });

    // Assert
    for (const outcome of [missingId, unknownLevel, lockedLevel]) {
      expect(outcome.isLeft()).toBe(true);
      if (outcome.isLeft()) {
        expect(outcome.value).toBeInstanceOf(RangeError);
      }
    }
  });

  it('should_return_either_left_as_not_found_when_level_list_does_not_include_it', async () => {
    // Arrange
    const first: ILevelSummary = { id: 'fit-01', gameId: 'hexa-fit', order: 1 };
    const orphan: ILevelSummary = {
      id: 'fit-07',
      gameId: 'hexa-fit',
      order: 7,
    };
    const { useCase, received } = createHarness({
      levels: [first, orphan],
      listedLevels: [first],
    });

    // Act
    const outcome = await useCase.execute({
      gameId: 'hexa-fit',
      levelId: 'fit-07',
    });

    // Assert
    expect(outcome.isLeft()).toBe(true);
    expect(
      outcome.fold(
        (err) => err.message,
        () => '',
      ),
    ).toBe('Level fit-07 was not found for hexa-fit');
    expect(received).toEqual([]);
  });
});
