import { InMemoryProgressRepository } from '@adapters/persistence/in-memory-progress-repository';
import { FitGamePresenter } from '@adapters/presentation/hexa-fit/fit-game-presenter';
import { GameResultPresenter } from '@adapters/presentation/game-result/game-result-presenter';
import { MainMenuPresenter } from '@adapters/presentation/main-menu/main-menu-presenter';
import { MENU_VARIANTS } from '@adapters/presentation/main-menu/menu-variants';
import { AsyncExceptionHandlingCommandServiceDecorator } from '@application/aspects/exception-handling-decorator';
import { AsyncLoggingCommandServiceDecorator } from '@application/aspects/logging-use-case-decorator';
import { FinishGameUseCase } from '@application/use-cases/finish-game';
import { VariantFactoryRegistry } from '@domain/engine/game/variant-factory';
import { LoadProgressSummaryUseCase } from '@application/use-cases/load-progress-summary';

import { FIT_DEMO_FACTORY, FIT_DEMO_ID } from './fit-demo';

/** Services exposed to UI screens through `ServicesProvider`. */
export interface AppServices {
  readonly mainMenu: MainMenuPresenter;
  readonly gameResult: GameResultPresenter;
  readonly startFit: () => FitGamePresenter;
}

/**
 * Composition root: the only file in `frameworks/` that instantiates adapters
 * and wires use cases with their repositories (DIP).
 */
export function createAppServices(): AppServices {
  const progress = new InMemoryProgressRepository();
  const loadSummary = new LoadProgressSummaryUseCase({ progress });
  const mainMenu = new MainMenuPresenter(loadSummary, MENU_VARIANTS);
  const gameResult = new GameResultPresenter();
  const factories = new VariantFactoryRegistry();
  factories.register(FIT_DEMO_FACTORY.gameId, FIT_DEMO_FACTORY);
  const logger = console;
  const clock = { now: () => performance.now() };
  const finishGame = new AsyncLoggingCommandServiceDecorator(
    'FinishGame',
    new AsyncExceptionHandlingCommandServiceDecorator(
      new FinishGameUseCase({
        factories,
        progress,
        sessions: { hasActiveSession: () => Promise.resolve(false) },
        syncQueue: {
          enqueueProgressSync: () => Promise.resolve(),
          enqueueScoreSubmission: () => Promise.resolve(),
        },
        eventBus: { publish: () => undefined },
        logger,
      }),
    ),
    logger,
    clock,
    {
      input: ({ gameId, reason }) => ({ gameId, reason }),
      output: ({ saveFailed }) => ({ saveFailed }),
    },
  );
  const startFit = () =>
    new FitGamePresenter(
      FIT_DEMO_FACTORY.createEngine(),
      FIT_DEMO_ID,
      finishGame,
      clock.now,
    );
  return { mainMenu, gameResult, startFit };
}
