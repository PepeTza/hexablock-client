import type { HexCoord } from '@domain/engine/hex/hex-coord';
import type {
  createLinesGame,
  PlacePieceMove,
} from '@domain/variants/hexa-lines/lines-game';

type PreviewSession = Pick<
  ReturnType<typeof createLinesGame>,
  'state' | 'preview'
>;

export interface LinesPlacementPreview {
  readonly valid: boolean;
  readonly cells: readonly HexCoord[];
  readonly clearing: readonly HexCoord[];
}

/** Maps the engine simulation to cells the renderer can highlight. */
export function previewLinesPlacement(
  session: PreviewSession,
  move: PlacePieceMove,
): LinesPlacementPreview {
  const cells = session.state.tray[move.slot]?.cellsAt(move.anchor) ?? [];
  const preview = session.preview(move);
  if (preview.kind === 'rejected') {
    return { valid: false, cells, clearing: [] };
  }

  const clearing = preview.events.flatMap((event) => event.cells);

  return { valid: true, cells, clearing };
}
