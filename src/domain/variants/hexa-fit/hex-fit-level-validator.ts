import { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import { loadHexPieceCatalog } from '../../engine/hex/hex-piece-catalog';
import { FitLevelValidator } from './fit-level-validator';

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

/** Wires the Fit v1 format to the hex catalog and geometry. */
export function createHexFitLevelValidator(): FitLevelValidator<HexCoord> {
  const geometry = new HexGeometry();
  return new FitLevelValidator(
    geometry,
    loadHexPieceCatalog(geometry),
    readCell,
  );
}
