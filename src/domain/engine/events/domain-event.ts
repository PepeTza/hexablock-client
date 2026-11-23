/**
 * Something that happened in a game, told to whoever listens: the UI to
 * animate, audio to play a sound, autosave to store the game (Observer,
 * RF-06). Each event is a plain object named by its `type`.
 *
 * The engine emits the events below. Each variant adds its own (for example
 * `LineCleared` in Hexa Lines or `TileMerged` in Hexa Merge) through
 * `Resolved.events` of its rules.
 */
export interface DomainEvent {
  readonly type: string;
}

/** Receives every event of a game. */
export type EventListener = (event: DomainEvent) => void;

/**
 * Told when a listener throws while receiving `event`. A listener bug (in
 * audio, autosave...) is not a failed move, so the engine reports it here
 * and keeps notifying the other listeners.
 */
export type ListenerErrorHandler = (error: unknown, event: DomainEvent) => void;

/** How a finished game ended. */
export type GameOutcome = 'victory' | 'defeat';

export interface GameStarted extends DomainEvent {
  readonly type: 'GameStarted';
}

export interface MoveApplied<TMove> extends DomainEvent {
  readonly type: 'MoveApplied';
  readonly move: TMove;
  /** Points the move added to the score. */
  readonly points: number;
}

export interface MoveRejected<TMove> extends DomainEvent {
  readonly type: 'MoveRejected';
  readonly move: TMove;
  /** Why: a rule of the variant, or that the game is not in progress. */
  readonly reason: string;
}

export interface MoveUndone<TMove> extends DomainEvent {
  readonly type: 'MoveUndone';
  readonly move: TMove;
}

export interface MoveRedone<TMove> extends DomainEvent {
  readonly type: 'MoveRedone';
  readonly move: TMove;
}

export interface GamePaused extends DomainEvent {
  readonly type: 'GamePaused';
}

export interface GameResumed extends DomainEvent {
  readonly type: 'GameResumed';
}

export interface GameOver extends DomainEvent {
  readonly type: 'GameOver';
  readonly outcome: GameOutcome;
  readonly score: number;
}

/** Every event the engine itself emits. */
export type EngineEvent<TMove> =
  | GameStarted
  | MoveApplied<TMove>
  | MoveRejected<TMove>
  | MoveUndone<TMove>
  | MoveRedone<TMove>
  | GamePaused
  | GameResumed
  | GameOver;
