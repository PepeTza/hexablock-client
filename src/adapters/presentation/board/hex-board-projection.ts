import { HexCoord } from '@domain/engine/hex/hex-coord';

import type { BoardPoint, IBoardProjection } from './board-projection';

const SQRT_3 = Math.sqrt(3);

/** Strategy: project the D-21 pointy-top grid independently of the renderer. */
export class HexBoardProjection implements IBoardProjection<HexCoord> {
  private readonly origin: BoardPoint;

  constructor(
    origin: BoardPoint,
    private readonly size: number,
  ) {
    if (!Number.isFinite(size) || size <= 0) {
      throw new RangeError('Hex cell size must be finite and positive');
    }
    this.origin = { ...origin };
  }

  // Red Blob Games: pointy-top layout and cube rounding.
  // https://www.redblobgames.com/grids/hexagons/#hex-to-pixel
  centerOf({ q, r }: HexCoord): BoardPoint {
    return {
      x: this.origin.x + this.size * SQRT_3 * (q + r / 2),
      y: this.origin.y + this.size * 1.5 * r,
    };
  }

  coordAt({ x, y }: BoardPoint): HexCoord {
    const dx = (x - this.origin.x) / this.size;
    const dy = (y - this.origin.y) / this.size;
    const q = dx / SQRT_3 - dy / 3;
    const r = (2 * dy) / 3;
    const s = -q - r;
    const roundedQ = Math.round(q);
    const roundedR = Math.round(r);
    const roundedS = Math.round(s);
    const qError = Math.abs(roundedQ - q);
    const rError = Math.abs(roundedR - r);
    const sError = Math.abs(roundedS - s);

    if (qError > rError && qError > sError) {
      return new HexCoord(-roundedR - roundedS, roundedR);
    }
    if (rError > sError) {
      return new HexCoord(roundedQ, -roundedQ - roundedS);
    }
    return new HexCoord(roundedQ, roundedR);
  }
}
