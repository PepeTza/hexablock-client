import type { Board } from '../board/board';
import type { HexCoord } from './hex-coord';

/**
 * The board of the four variants: a generic `Board` on hexagonal
 * coordinates. It is the statement's `HexBoard<TCell>`.
 *
 * Only a shorter name for `Board<TCell, HexCoord>`, not a new class. It lives
 * here, on the hexagonal side, so the generic engine never imports a concrete
 * geometry (DIP).
 */
export type HexBoard<TCell extends NonNullable<unknown>> = Board<
  TCell,
  HexCoord
>;
