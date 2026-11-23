import { FitGamePresenter } from '@adapters/presentation/hexa-fit/fit-game-presenter';
import { LinesGamePresenter } from '@adapters/presentation/hexa-lines/lines-game-presenter';
import { FinishGameUseCase } from '@application/use-cases/finish-game';
import { VariantFactoryRegistry } from '@domain/engine/game/variant-factory';
import { createLinesGame } from '@domain/variants/hexa-lines/lines-game';
import { LinesVariantFactory } from '@domain/variants/hexa-lines/lines-variant-factory';
import { InMemoryProgressRepository } from '@adapters/persistence/in-memory-progress-repository';
import { GameResultPresenter } from '@adapters/presentation/game-result/game-result-presenter';
import { MainMenuPresenter } from '@adapters/presentation/main-menu/main-menu-presenter';
import { MENU_VARIANTS } from '@adapters/presentation/main-menu/menu-variants';
import { LoadProgressSummaryUseCase } from '@application/use-cases/load-progress-summary';

import { FIT_DEMO_FACTORY, FIT_DEMO_ID } from './fit-demo';

/** Services exposed to UI screens through `ServicesProvider`. */
export interface AppServices {
  readonly mainMenu: MainMenuPresenter;
  readonly gameResult: GameResultPresenter;
  readonly startFit: () => FitGamePresenter;
  readonly startLines: () => LinesGamePresenter;
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
  const linesFactory = new LinesVariantFactory();
  factories.register(linesFactory.gameId, linesFactory);
  factories.register(FIT_DEMO_FACTORY.gameId, FIT_DEMO_FACTORY);
  const finishGame = new FinishGameUseCase({
    factories,
    progress,
    sessions: { hasActiveSession: () => Promise.resolve(false) },
    syncQueue: {
      enqueueProgressSync: () => Promise.resolve(),
      enqueueScoreSubmission: () => Promise.resolve(),
    },
    eventBus: { publish: () => undefined },
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
  });
  const startLines = () =>
    new LinesGamePresenter(
      createLinesGame(Date.now() >>> 0),
      finishGame,
      Date.now,
    );
  const startFit = () =>
    new FitGamePresenter(
      FIT_DEMO_FACTORY.createEngine(),
      FIT_DEMO_ID,
      finishGame,
      () => performance.now(),
    );
  return { mainMenu, gameResult, startLines, startFit };
}
