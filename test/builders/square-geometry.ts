import type { Axis } from '@domain/engine/geometry/axis';
import type { IBoardGeometry } from '@domain/engine/geometry/board-geometry';
import type { ICoord } from '@domain/engine/geometry/coord';
import { Direction } from '@domain/engine/geometry/direction';

/** Minimal non-hexagonal coordinate for RNF-14 geometry-independence tests. */
export class SquareCoord implements ICoord {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  key(): string {
    return `${this.x},${this.y}`;
  }
}

export const SQUARE_RIGHT = new Direction('RIGHT');
export const SQUARE_LEFT = new Direction('LEFT');

/** Minimal 1D square-grid geometry for verifying geometry-agnostic rules and presenters. */
export class LineSquareGeometry implements IBoardGeometry<SquareCoord> {
  readonly origin = new SquareCoord(0, 0);
  readonly directions = [SQUARE_RIGHT, SQUARE_LEFT];
  readonly axes: readonly Axis[] = [];

  neighbour(coord: SquareCoord, direction: Direction): SquareCoord {
    return direction === SQUARE_RIGHT
      ? new SquareCoord(coord.x + 1, coord.y)
      : new SquareCoord(coord.x - 1, coord.y);
  }

  neighbours(coord: SquareCoord): SquareCoord[] {
    return this.directions.map((direction) => this.neighbour(coord, direction));
  }

  line(): SquareCoord[] {
    return [];
  }

  ring(centre: SquareCoord, radius: number): SquareCoord[] {
    if (radius === 0) return [centre];
    return [
      new SquareCoord(centre.x - radius, centre.y),
      new SquareCoord(centre.x + radius, centre.y),
    ];
  }

  translate(
    coord: SquareCoord,
    from: SquareCoord,
    to: SquareCoord,
  ): SquareCoord {
    return new SquareCoord(coord.x - from.x + to.x, coord.y - from.y + to.y);
  }
}
