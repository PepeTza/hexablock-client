import { BoardShape } from '@domain/engine/board/board-shape';
import { HexGeometry } from '@domain/engine/geometry/hex-geometry';

// Radius of the Hexa Lines board (requirements §3).
const LINES_BOARD_RADIUS = 4;

/**
 * Admin panel shell. The level editors arrive in iteration I3 (CU-17, CU-18);
 * for now the page proves that the panel runs the game's domain code.
 */
export function App() {
  const cells = BoardShape.ofRadius(new HexGeometry(), LINES_BOARD_RADIUS).size;

  return (
    <main>
      <h1>HexaBlock Admin</h1>
      <p>
        A radius-{LINES_BOARD_RADIUS} board has {cells} cells.
      </p>
    </main>
  );
}
