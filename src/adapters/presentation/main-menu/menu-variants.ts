import type { MenuVariantEntry } from './main-menu-view-model';

/**
 * Menu configuration listed in docs/EXTENSIBILITY.md: adding a fifth variant
 * means appending one entry here rather than branching in the screen (OCP).
 */
export const MENU_VARIANTS: readonly MenuVariantEntry[] = [
  { gameId: 'hexa-lines', name: 'Hexa Lines', progressKind: 'high-score' },
  { gameId: 'hexa-fit', name: 'Hexa Fit', progressKind: 'levels' },
  { gameId: 'hexa-sort', name: 'Hexa Sort', progressKind: 'levels' },
  { gameId: 'hexa-merge', name: 'Hexa Merge', progressKind: 'high-score' },
];
