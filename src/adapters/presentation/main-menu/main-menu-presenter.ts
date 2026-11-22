import type {
  LoadProgressSummaryInput,
  ProgressSummary,
} from '@application/use-cases/load-progress-summary';
import type { IUseCase } from '@application/use-cases/use-case';

import {
  type MainMenuViewModel,
  type MenuVariantEntry,
  type ProgressKind,
  SUITE_NAME,
} from './main-menu-view-model';

const PROGRESS_LABELS: Record<
  ProgressKind,
  (summary: ProgressSummary) => string
> = {
  'high-score': (summary) => `Best: ${summary.highScore}`,
  levels: (summary) => `Levels completed: ${summary.completedLevels}`,
};

/**
 * Presenter: translates variant menu entries and progress summaries from
 * `LoadProgressSummaryUseCase` into ready-to-render labels for the passive
 * main menu view, keeping formatting and data lookup out of React components.
 */
export class MainMenuPresenter {
  constructor(
    private readonly loadSummary: IUseCase<
      LoadProgressSummaryInput,
      Promise<readonly ProgressSummary[]>
    >,
    private readonly entries: readonly MenuVariantEntry[],
  ) {}

  async load(): Promise<MainMenuViewModel> {
    const summaries = await this.loadSummary.execute({
      gameIds: this.entries.map((entry) => entry.gameId),
    });
    const byGameId = new Map(
      summaries.map((summary) => [summary.gameId, summary]),
    );
    const variants = this.entries.map((entry) => {
      const summary = byGameId.get(entry.gameId) ?? {
        gameId: entry.gameId,
        highScore: 0,
        completedLevels: 0,
      };
      return {
        gameId: entry.gameId,
        name: entry.name,
        progressLabel: PROGRESS_LABELS[entry.progressKind](summary),
      };
    });
    return {
      title: SUITE_NAME,
      variants,
    };
  }
}
