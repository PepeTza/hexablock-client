import type { LevelDefinition } from '../../content/level-definition';
import type {
  ILevelValidator,
  LevelValidationResult,
} from '../../content/level-validator';
import type { IBoardGeometry } from '../../engine/geometry/board-geometry';
import type { ICoord } from '../../engine/geometry/coord';
import type { PieceCatalog } from '../../engine/pieces/piece-catalog';
import { Piece } from '../../engine/pieces/piece';
import { solveFitFigure, type FitSolutionPlacement } from './fit-solver';

type Result<TCoord extends ICoord> = LevelValidationResult<
  readonly FitSolutionPlacement<TCoord>[]
>;

function invalid(field: string, message: string) {
  return { valid: false as const, errors: [{ field, message }] };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validates the proposed Fit v1 payload and searches for a cover (RN-13). */
export class FitLevelValidator<
  TCoord extends ICoord,
> implements ILevelValidator<readonly FitSolutionPlacement<TCoord>[]> {
  constructor(
    private readonly geometry: IBoardGeometry<TCoord>,
    private readonly catalog: PieceCatalog<TCoord>,
    private readonly readCell: (value: unknown) => TCoord | null,
  ) {}

  validate(level: LevelDefinition): Result<TCoord> {
    if (level.gameId !== 'hexa-fit')
      return invalid('gameId', 'Expected hexa-fit');
    if (level.schemaVersion !== 1) {
      return invalid('schemaVersion', 'Expected version 1');
    }

    return this.validateSpec(level.spec);
  }

  /** Validate a Fit v1 spec payload before or after publication (RN-13). */
  validateSpec(spec: unknown): Result<TCoord> {
    if (!isObject(spec)) {
      return invalid('spec', 'Expected a JSON object');
    }
    if (
      Object.keys(spec).some(
        (key) =>
          key !== 'figure' && key !== 'pieces' && key !== 'starThresholds',
      )
    ) {
      return invalid('spec', 'Expected only figure, pieces and starThresholds');
    }
    const { figure, pieces, starThresholds } = spec;
    if (!Array.isArray(figure) || figure.length === 0) {
      return invalid('spec.figure', 'Expected a non-empty array');
    }

    const cells: TCoord[] = [];
    for (const [index, value] of figure.entries()) {
      const cell = this.readCell(value);
      if (cell === null)
        return invalid(`spec.figure[${index}]`, 'Expected a valid coordinate');
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
    const resolved: Piece<TCoord>[] = [];
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
    if (!isObject(starThresholds) || Object.keys(starThresholds).length !== 2) {
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

  private isConnected(cells: readonly TCoord[]): boolean {
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
