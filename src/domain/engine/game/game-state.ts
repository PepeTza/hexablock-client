/**
 * What every game has, whatever the variant: its score and how many moves it
 * took (RN-39 sends both to the server). Each variant extends it with its own
 * data, such as the tray of Hexa Lines or the goals of Hexa Sort.
 *
 * A state is an immutable plain object (no class, no methods): every move
 * produces a new one, so the previous state stays available for undo (T20)
 * and the engine can drop a failed move without restoring anything.
 *
 * The status of the game (in progress, paused...) is not here: it is the
 * session state of the engine (D-22). The seed belongs to the whole game, so
 * it is kept by the engine too.
 */
export interface GameState {
  readonly score: number;
  readonly moveCount: number;
}
