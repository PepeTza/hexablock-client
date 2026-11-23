import type {
  LoadProgressSummaryInput,
  ProgressSummary,
} from '@application/use-cases/load-progress-summary';
import type { AsyncCommandService } from '@application/use-cases/use-case';

import {
  type CarouselStep,
  type MainMenuMode,
  type MainMenuViewModel,
  type MenuVariantEntry,
  type ProgressKind,
  SUITE_NAME,
} from './main-menu-view-model';

/** Minimum horizontal drag distance in points to change carousel cards. */
export const DEFAULT_SWIPE_THRESHOLD = 40;

/**
 * Pure circular index navigation for the main menu carousel (#117):
 * wraps around in both directions (`0 ↔ count - 1`) for any number of
 * variants in `MENU_VARIANTS` (OCP).
 */
export function stepCarouselIndex(
  currentIndex: number,
  count: number,
  step: CarouselStep,
): number {
  if (count <= 0) {
    return 0;
  }
  return (((currentIndex + step) % count) + count) % count;
}

/** Switches between the default `'carousel'` view and the `'list'` view (#117). */
export function toggleMenuMode(mode: MainMenuMode): MainMenuMode {
  return mode === 'carousel' ? 'list' : 'carousel';
}

/**
 * Translates a horizontal swipe displacement (`dx`) into a carousel step:
 * swiping left (`dx <= -threshold`) advances to the next variant (`1`),
 * swiping right (`dx >= threshold`) moves to the previous one (`-1`), and
 * shorter drags return `0`.
 */
export function resolveCarouselSwipe(
  dx: number,
  threshold: number = DEFAULT_SWIPE_THRESHOLD,
): CarouselStep | 0 {
  if (dx <= -threshold) {
    return 1;
  }
  if (dx >= threshold) {
    return -1;
  }
  return 0;
}

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
    private readonly loadSummary: AsyncCommandService<
      LoadProgressSummaryInput,
      readonly ProgressSummary[]
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
      const outcome = await this.loadSummary.execute({
        gameIds: this.entries.map((entry) => entry.gameId),
      });
      return outcome.fold(
        () => null,
        (summaries) => summaries,
      );
    } catch {
      // Not logged yet: the app has no logger adapter until a variant is
      // playable. The menu itself does not need the progress (HU01).
      return null;
    }
  }
}
