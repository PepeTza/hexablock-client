import type { GameEngine } from '@domain/engine/game/game-engine';
import type { ICoord } from '@domain/engine/geometry/coord';
import type { HexCoord } from '@domain/engine/hex/hex-coord';
import type {
  LinesGameState,
  PlacePieceMove,
} from '@domain/variants/hexa-lines/lines-game';
import type { LineCleared } from '@domain/variants/hexa-lines/resolve-lines';

type PreviewSession<TCoord extends ICoord> = Pick<
  GameEngine<
    string,
    TCoord,
    PlacePieceMove<TCoord>,
    LinesGameState<TCoord>,
    LineCleared<TCoord>
  >,
  'state' | 'preview'
>;

export interface LinesPlacementPreview<TCoord extends ICoord = HexCoord> {
  readonly valid: boolean;
  readonly cells: readonly TCoord[];
  readonly clearing: readonly TCoord[];
}

/** Maps the engine simulation to cells the renderer can highlight. */
export function previewLinesPlacement<TCoord extends ICoord = HexCoord>(
  session: PreviewSession<TCoord>,
  move: PlacePieceMove<TCoord>,
): LinesPlacementPreview<TCoord> {
  const cells = session.state.tray[move.slot]?.cellsAt(move.anchor) ?? [];
  const preview = session.preview(move);
  if (preview.kind === 'rejected') {
    return { valid: false, cells, clearing: [] };
  }

  const clearing = preview.events.flatMap((event) => event.cells);

  return { valid: true, cells, clearing };
}
