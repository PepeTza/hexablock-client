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
 *
 * The menu works without the progress (HU01): if loading it fails, `load`
 * still returns every variant, with no progress label, instead of failing.
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
    const summaries = await this.loadSummaries();
    const byGameId =
      summaries === null
        ? null
        : new Map(summaries.map((summary) => [summary.gameId, summary]));
    const variants = this.entries.map((entry) => ({
      gameId: entry.gameId,
      name: entry.name,
      progressLabel:
        byGameId === null
          ? null
          : PROGRESS_LABELS[entry.progressKind](
              byGameId.get(entry.gameId) ?? {
                gameId: entry.gameId,
                highScore: 0,
                completedLevels: 0,
              },
            ),
    }));
    return {
      title: SUITE_NAME,
      variants,
    };
  }

  /** The progress summaries, or `null` when they could not be loaded. */
  private async loadSummaries(): Promise<readonly ProgressSummary[] | null> {
    try {
      return await this.loadSummary.execute({
        gameIds: this.entries.map((entry) => entry.gameId),
      });
    } catch {
      // Not logged yet: the app has no logger adapter until a variant is
      // playable. The menu itself does not need the progress (HU01).
      return null;
    }
  }
}
