import type { GameId } from '@domain/progress/player-progress';

/** Display title of the mobile suite shown on the main menu (HU01, RF-14). */
export const SUITE_NAME = 'HexaBlock Suite';

/** Strategy key deciding which summary figure a menu entry formats. */
export type ProgressKind = 'high-score' | 'levels';

/** Declarative menu entry for one variant (docs/EXTENSIBILITY.md, OCP). */
export interface MenuVariantEntry {
  readonly gameId: GameId;
  readonly name: string;
  readonly progressKind: ProgressKind;
}

/** Ready-to-render item for one variant card in the main menu. */
export interface MenuVariantItem {
  readonly gameId: GameId;
  readonly name: string;
  /** The record or completed levels, or `null` when the progress could not be loaded. */
  readonly progressLabel: string | null;
}

/** View model consumed by the passive main menu view. */
export interface MainMenuViewModel {
  readonly title: string;
  readonly variants: readonly MenuVariantItem[];
}
