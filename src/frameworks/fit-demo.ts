import type { LevelDefinition } from '@domain/content/level-definition';
import { BoardShape } from '@domain/engine/board/board-shape';
import type { IVariantFactory } from '@domain/engine/game/variant-factory';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { loadHexPieceCatalog } from '@domain/engine/hex/hex-piece-catalog';
import { Piece } from '@domain/engine/pieces/piece';
import { startFitGame } from '@domain/variants/hexa-fit/fit-game';
import { FitProgressModel } from '@domain/variants/hexa-fit/fit-progress-model';

/** Temporary offline fixture until published levels can be loaded. */
export const FIT_DEMO_ID = 'fit-demo';

/** Bundled demo level entry so Level Selection can launch the Fit demo. */
export const FIT_DEMO_LEVEL: LevelDefinition = {
  id: FIT_DEMO_ID,
  gameId: 'hexa-fit',
  order: 1,
  schemaVersion: 1,
  publishedAt: '2026-11-24T00:00:00Z',
  spec: {},
};

function createFitDemo() {
  const catalog = loadHexPieceCatalog();
  const figure = BoardShape.of([
    new HexCoord(-1, 0),
    HexCoord.ORIGIN,
    new HexCoord(1, 0),
  ]);
  return startFitGame(figure, [
    Piece.of(catalog.get('p2-01')),
    Piece.of(catalog.get('p1-01')),
  ]);
}

export const FIT_DEMO_FACTORY = {
  gameId: 'hexa-fit',
  usesSeed: false,
  usesLevels: true,
  createEngine: createFitDemo,
  createProgressModel: () =>
    new FitProgressModel((id) =>
      id === FIT_DEMO_ID
        ? { twoStars: 650, threeStars: 800, nextLevelId: null }
        : undefined,
    ),
} satisfies IVariantFactory;
