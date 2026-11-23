import { PieceCatalog } from '../pieces/piece-catalog';
import { HexCoord } from './hex-coord';
import { HexGeometry } from './hex-geometry';
import data from './hex-pieces.json';

/** Largest piece of Hexa Lines and Hexa Fit, in cells (RN-03). */
export const MAX_PIECE_CELLS = 5;

/**
 * Reads one cell of the catalog data: an axial `[q, r]` pair of integers,
 * relative to the centre of the piece (`[0, 0]`).
 */
export function parseHexCell(raw: unknown, path: string): HexCoord {
  if (!Array.isArray(raw) || raw.length !== 2) {
    throw new TypeError(`${path} must be a [q, r] pair of integers`);
  }
  const q: unknown = raw[0];
  const r: unknown = raw[1];
  if (
    typeof q !== 'number' ||
    typeof r !== 'number' ||
    !Number.isInteger(q) ||
    !Number.isInteger(r)
  ) {
    throw new TypeError(`${path} must be a [q, r] pair of integers`);
  }
  return new HexCoord(q, r);
}

/**
 * The piece catalog of the game (D-07): every poly-hex of 1 to 4 cells (15
 * shapes, with mirror images counted apart because pieces never flip) and a
 * selection of 6 of the 33 shapes of 5 cells. The data is in
 * `hex-pieces.json`; `docs/piece-catalog.md` draws every shape, including the
 * 5-cell ones that can replace the selected ones.
 *
 * Throws, naming the place in the data, if the JSON is not a valid catalog.
 */
export function loadHexPieceCatalog(
  geometry: HexGeometry = new HexGeometry(),
): PieceCatalog<HexCoord> {
  return PieceCatalog.fromData(data, geometry, parseHexCell, MAX_PIECE_CELLS);
}
