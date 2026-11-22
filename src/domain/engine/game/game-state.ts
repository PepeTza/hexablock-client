/**
 * What every game has, whatever the variant: its score and how many moves it
 * took (RN-39 sends both to the server). Each variant extends it with its own
 * data, such as the tray of Hexa Lines or the goals of Hexa Sort.
 *
 * A state is an immutable plain object: every move produces a new one, so the
 * previous state stays available for undo (T20) and the engine can drop a
 * failed move or a preview without restoring anything. Its fields are plain
 * data or immutable value objects; a piece or random source is kept as a
 * `Snapshot`, which never changes once stored (see `SourcedGameRules`).
 *
 * The rule that keeps moves atomic: rules and scoring policies keep no memory
 * between moves. Everything that changes while a game is played (the tray, a
 * streak, the position of a source) goes in the state.
 *
 * The status of the game (in progress, paused...) is not here: it is the
 * session state of the engine (D-22). The seed belongs to the whole game, so
 * it is kept by the engine too.
 */
export interface GameState {
  readonly score: number;
  readonly moveCount: number;
}
