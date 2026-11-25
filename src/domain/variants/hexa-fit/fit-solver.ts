import type { ICoord } from '../../engine/geometry/coord';
import type { Piece } from '../../engine/pieces/piece';

export interface FitSolutionPlacement<TCoord extends ICoord> {
  readonly pieceIndex: number;
  readonly anchor: TCoord;
  readonly rotation: number;
  readonly cells: readonly TCoord[];
}

/** Exact-cover backtracking for a catalog-resolved Fit figure (RN-13). */
export function solveFitFigure<TCoord extends ICoord>(
  figure: readonly TCoord[],
  pieces: readonly Piece<TCoord>[],
): readonly FitSolutionPlacement<TCoord>[] | null {
  const keys = new Set(figure.map((cell) => cell.key()));
  const area = pieces.reduce((sum, piece) => sum + piece.shape.size, 0);
  if (keys.size === 0 || keys.size !== figure.length || area !== keys.size) {
    return null;
  }

  const placementsByCell = new Map<string, FitSolutionPlacement<TCoord>[]>();
  pieces.forEach((piece, pieceIndex) => {
    for (let turn = 0; turn < piece.shape.geometry.rotationSteps; turn++) {
      const rotated = piece.rotate(turn);
      for (const anchor of figure) {
        const cells = rotated.cellsAt(anchor);
        if (!cells.every((cell) => keys.has(cell.key()))) continue;
        const placement = {
          pieceIndex,
          anchor,
          rotation: rotated.rotation,
          cells,
        };
        for (const cell of cells) {
          const key = cell.key();
          const candidates = placementsByCell.get(key) ?? [];
          candidates.push(placement);
          placementsByCell.set(key, candidates);
        }
      }
    }
  });

  const chosen: FitSolutionPlacement<TCoord>[] = [];
  const usedPieces = new Set<number>();
  const covered = new Set<string>();

  function search(): boolean {
    const next = figure.find((cell) => !covered.has(cell.key()));
    if (next === undefined) return true;

    for (const candidate of placementsByCell.get(next.key()) ?? []) {
      if (
        usedPieces.has(candidate.pieceIndex) ||
        candidate.cells.some((cell) => covered.has(cell.key()))
      ) {
        continue;
      }

      usedPieces.add(candidate.pieceIndex);
      candidate.cells.forEach((cell) => covered.add(cell.key()));
      chosen.push(candidate);
      if (search()) return true;
      chosen.pop();
      candidate.cells.forEach((cell) => covered.delete(cell.key()));
      usedPieces.delete(candidate.pieceIndex);
    }

    return false;
  }

  return search() ? chosen : null;
}
