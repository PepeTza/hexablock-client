import { loadHexPieceCatalog } from '../../engine/hex/hex-piece-catalog';
import { Piece } from '../../engine/pieces/piece';
import { RandomPieceSource } from '../../engine/pieces/random-piece-source';
import type { IRandomSource } from '../../engine/random/random-source';

/** D-07: shape weights belong to Lines. Each shape defaults to weight one. */
export function createLinesPieceSource(
  random: IRandomSource,
  weights: ReadonlyMap<string, number> = new Map(),
) {
  const catalog = loadHexPieceCatalog();
  for (const id of weights.keys()) {
    catalog.get(id);
  }

  // Every shape contributes six equally weighted orientations. Giving each
  // orientation the shape's weight preserves the relative shape weights.
  const entries = catalog.shapes.flatMap((shape) =>
    Array.from({ length: shape.geometry.rotationSteps }, (_, rotation) => ({
      item: Piece.of(shape, rotation),
      weight: weights.get(shape.id) ?? 1,
    })),
  );
  return RandomPieceSource.weighted(entries, random);
}
