import type { ICoord } from '@domain/engine/geometry/coord';

export interface BoardPoint {
  readonly x: number;
  readonly y: number;
}

/** Presentation adapter boundary for mapping between board and screen. */
export interface IBoardProjection<TCoord extends ICoord> {
  centerOf(coord: TCoord): BoardPoint;
  coordAt(point: BoardPoint): TCoord;
}
