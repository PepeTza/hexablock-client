import { InMemoryProgressRepository } from '@adapters/persistence/in-memory-progress-repository';
import { MainMenuPresenter } from '@adapters/presentation/main-menu/main-menu-presenter';
import { MENU_VARIANTS } from '@adapters/presentation/main-menu/menu-variants';
import { LoadProgressSummaryUseCase } from '@application/use-cases/load-progress-summary';

/** Services exposed to UI screens through `ServicesProvider`. */
export interface AppServices {
  readonly mainMenu: MainMenuPresenter;
}

/**
 * Composition root: the only file in `frameworks/` that instantiates adapters
 * and wires use cases with their repositories (DIP).
 */
export function createAppServices(): AppServices {
  const progress = new InMemoryProgressRepository();
  const loadSummary = new LoadProgressSummaryUseCase({ progress });
  const mainMenu = new MainMenuPresenter(loadSummary, MENU_VARIANTS);
  return { mainMenu };
}
