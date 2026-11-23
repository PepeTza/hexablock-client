/** SPIKE: temporary pointy-top projection for the Skia experiment (#11). */
export interface Axial {
  readonly q: number;
  readonly r: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

const SQRT_3 = Math.sqrt(3);

// Red Blob Games, Hexagonal Grids: pointy-top layout and cube rounding.
// https://www.redblobgames.com/grids/hexagons/#hex-to-pixel
export function cellCenter(cell: Axial, origin: Point, size: number): Point {
  'worklet';
  return {
    x: origin.x + size * SQRT_3 * (cell.q + cell.r / 2),
    y: origin.y + size * 1.5 * cell.r,
  };
}

export function pointToCell(point: Point, origin: Point, size: number): Axial {
  'worklet';
  const x = (point.x - origin.x) / size;
  const y = (point.y - origin.y) / size;
  const q = x / SQRT_3 - y / 3;
  const r = (2 * y) / 3;
  const s = -q - r;
  const roundedQ = Math.round(q);
  const roundedR = Math.round(r);
  const roundedS = Math.round(s);
  const qError = Math.abs(roundedQ - q);
  const rError = Math.abs(roundedR - r);
  const sError = Math.abs(roundedS - s);

  if (qError > rError && qError > sError) {
    return { q: -roundedR - roundedS || 0, r: roundedR || 0 };
  }
  if (rError > sError) {
    return { q: roundedQ || 0, r: -roundedQ - roundedS || 0 };
  }
  return { q: roundedQ || 0, r: roundedR || 0 };
}

export function findDropCenter(
  point: Point,
  origin: Point,
  size: number,
  board: readonly Axial[],
  offsets: readonly Axial[],
): Point | null {
  'worklet';
  const anchor = pointToCell(point, origin, size);
  const fits = offsets.every(({ q, r }) =>
    board.some((cell) => cell.q === anchor.q + q && cell.r === anchor.r + r),
  );
  return fits ? cellCenter(anchor, origin, size) : null;
}
