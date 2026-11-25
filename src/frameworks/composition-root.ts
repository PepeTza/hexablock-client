import { InMemoryProgressRepository } from '@adapters/persistence/in-memory-progress-repository';
import { GameResultPresenter } from '@adapters/presentation/game-result/game-result-presenter';
import { MainMenuPresenter } from '@adapters/presentation/main-menu/main-menu-presenter';
import { MENU_VARIANTS } from '@adapters/presentation/main-menu/menu-variants';
import type { ILevelRepository } from '@application/ports/level-repository';
import type { IProgressRepository } from '@application/ports/progress-repository';
import {
  LoadLevelsUseCase,
  type LevelSelection,
  type LoadLevelsInput,
} from '@application/use-cases/load-levels';
import { LoadProgressSummaryUseCase } from '@application/use-cases/load-progress-summary';
import type { AsyncCommandService } from '@application/use-cases/use-case';

/** Services exposed to UI screens through `ServicesProvider`. */
export interface AppServices {
  readonly mainMenu: MainMenuPresenter;
  readonly gameResult: GameResultPresenter;
  readonly loadLevels?: AsyncCommandService<LoadLevelsInput, LevelSelection>;
}

/** Optional overrides used in integration and navigation tests. */
export interface AppServiceDependencies {
  readonly progress?: IProgressRepository;
  readonly levels?: Pick<ILevelRepository, 'findByGame'>;
}

const EMPTY_LEVELS: Pick<ILevelRepository, 'findByGame'> = {
  findByGame: () => Promise.resolve([]),
};

/**
 * Composition root: the only file in `frameworks/` that instantiates adapters
 * and wires use cases with their repositories (DIP).
 */
export function createAppServices(
  deps: AppServiceDependencies = {},
): AppServices {
  const progress = deps.progress ?? new InMemoryProgressRepository();
  const levels = deps.levels ?? EMPTY_LEVELS;
  const loadSummary = new LoadProgressSummaryUseCase({ progress });
  const loadLevels = new LoadLevelsUseCase({ levels, progress });
  const mainMenu = new MainMenuPresenter(loadSummary, MENU_VARIANTS);
  const gameResult = new GameResultPresenter();
  return { mainMenu, gameResult, loadLevels };
}
