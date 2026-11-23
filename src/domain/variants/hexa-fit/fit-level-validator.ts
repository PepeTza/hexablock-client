import type { LevelDefinition } from '../../content/level-definition';
import type {
  ILevelValidator,
  LevelValidationResult,
} from '../../content/level-validator';
import { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import { loadHexPieceCatalog } from '../../engine/hex/hex-piece-catalog';
import { Piece } from '../../engine/pieces/piece';
import { solveFitFigure, type FitSolutionPlacement } from './fit-solver';

type Result = LevelValidationResult<readonly FitSolutionPlacement[]>;

function invalid(field: string, message: string): Result {
  return { valid: false, errors: [{ field, message }] };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCell(value: unknown): HexCoord | null {
  if (!isObject(value)) return null;
  const { q, r } = value;
  return typeof q === 'number' &&
    typeof r === 'number' &&
    Number.isSafeInteger(q) &&
    Number.isSafeInteger(r)
    ? new HexCoord(q, r)
    : null;
}

/** Validates the proposed Fit v1 payload and searches for a cover (RN-13). */
export class FitLevelValidator implements ILevelValidator<
  readonly FitSolutionPlacement[]
> {
  private readonly geometry = new HexGeometry();
  private readonly catalog = loadHexPieceCatalog(this.geometry);

  validate(level: LevelDefinition): Result {
    if (level.gameId !== 'hexa-fit')
      return invalid('gameId', 'Expected hexa-fit');
    if (level.schemaVersion !== 1) {
      return invalid('schemaVersion', 'Expected version 1');
    }

    const { figure, pieces, starThresholds } = level.spec;
    if (!Array.isArray(figure) || figure.length === 0) {
      return invalid('spec.figure', 'Expected a non-empty array');
    }

    const cells: HexCoord[] = [];
    for (const [index, value] of figure.entries()) {
      const cell = readCell(value);
      if (cell === null)
        return invalid(`spec.figure[${index}]`, 'Expected axial integers');
      cells.push(cell);
    }
    if (!this.isConnected(cells)) {
      return invalid(
        'spec.figure',
        'Expected a connected set of distinct cells',
      );
    }

    if (!Array.isArray(pieces) || pieces.length === 0) {
      return invalid('spec.pieces', 'Expected a non-empty array');
    }
    const resolved: Piece<HexCoord>[] = [];
    for (const [index, id] of pieces.entries()) {
      if (typeof id !== 'string')
        return invalid(`spec.pieces[${index}]`, 'Expected a catalog ID');
      try {
        resolved.push(Piece.of(this.catalog.get(id)));
      } catch {
        return invalid(`spec.pieces[${index}]`, 'Unknown catalog ID');
      }
    }
    if (
      resolved.reduce((area, piece) => area + piece.shape.size, 0) !==
      cells.length
    ) {
      return invalid(
        'spec.pieces',
        'Total piece area must equal the figure area',
      );
    }
    if (!isObject(starThresholds)) {
      return invalid('spec.starThresholds', 'Expected two score thresholds');
    }
    const { twoStars, threeStars } = starThresholds;
    if (
      typeof twoStars !== 'number' ||
      typeof threeStars !== 'number' ||
      !Number.isSafeInteger(twoStars) ||
      !Number.isSafeInteger(threeStars) ||
      twoStars <= 0 ||
      threeStars <= twoStars
    ) {
      return invalid(
        'spec.starThresholds',
        'Expected increasing positive integers',
      );
    }

    const solution = solveFitFigure(cells, resolved);
    return solution === null
      ? invalid('spec.figure', 'No exact cover exists for the supplied pieces')
      : { valid: true, solution };
  }

  private isConnected(cells: readonly HexCoord[]): boolean {
    const first = cells[0];
    const remaining = new Set(cells.map((cell) => cell.key()));
    if (first === undefined || remaining.size !== cells.length) return false;

    const queued = [first];
    remaining.delete(first.key());
    for (const cell of queued) {
      for (const neighbour of this.geometry.neighbours(cell)) {
        if (remaining.delete(neighbour.key())) queued.push(neighbour);
      }
    }
    return remaining.size === 0;
  }
}
