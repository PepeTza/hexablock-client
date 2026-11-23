import type { GameOutcome } from '../events/domain-event';

/** The status of a game as the UI sees it (D-22). */
export type GameStatus = 'playing' | 'resolving' | 'paused' | 'finished';

/**
 * What happened with a move, as the UI needs it (CU-02): rejected with its
 * reason (the piece goes back, CU-02 A1), or applied with its points and,
 * when the move ended the game, the pending outcome. The game reaches
 * `finished` with that outcome once the UI calls `resolutionDone`.
 */
export type MoveResult =
  | { readonly kind: 'rejected'; readonly reason: string }
  | {
      readonly kind: 'applied';
      readonly points: number;
      readonly pendingOutcome: GameOutcome | null;
    };

/**
 * What a session state may ask the engine to do. The engine gives the states
 * this small view of itself instead of its whole public interface.
 */
export interface SessionContext<TMove> {
  /** Plays the move on a copy and keeps it if applied. */
  play(move: TMove): MoveResult;
  /** Emits `MoveRejected` without touching the game and returns the rejection. */
  reject(move: TMove, reason: string): MoveResult;
  /** Undoes the last applied move if permitted and available (CU-04). */
  undo(): boolean;
  /** Redoes the last undone move if permitted and available (CU-05). */
  redo(): boolean;
  /** Replaces the current session state. */
  moveTo(state: SessionState<TMove>): void;
  emitPaused(): void;
  emitResumed(): void;
  /** Moves to `FinishedState` and emits `GameOver`. */
  finish(outcome: GameOutcome): void;
}

/**
 * State pattern (D-22): the session of a game is always in one of four
 * states, and the current one decides what each action does. The engine
 * delegates every action to it, so there is no `if (paused)` in the engine.
 *
 * "Ignored" means nothing happens and no event is emitted (CU-06 A1);
 * "rejected" means `MoveRejected` is emitted and the game stays as it was.
 * The transition table is in docs/use-cases.md, CU-06.
 */
export abstract class SessionState<TMove> {
  abstract readonly status: GameStatus;

  /** Plays or rejects `move`, and says which (CU-02). */
  abstract applyMove(context: SessionContext<TMove>, move: TMove): MoveResult;

  /** Ignored unless a state says otherwise. */
  undo(context: SessionContext<TMove>): boolean {
    void context;
    return false;
  }

  /** Ignored unless a state says otherwise. */
  redo(context: SessionContext<TMove>): boolean {
    void context;
    return false;
  }

  /** Ignored unless a state says otherwise. */
  pause(context: SessionContext<TMove>): void {
    void context;
  }

  /** Ignored unless a state says otherwise. */
  resume(context: SessionContext<TMove>): void {
    void context;
  }

  /** Ignored unless a state says otherwise. */
  resolutionDone(context: SessionContext<TMove>): void {
    void context;
  }
}

/** In progress: accepts moves, undo/redo (staying playing) and pause. */
export class PlayingState<TMove> extends SessionState<TMove> {
  readonly status = 'playing';

  applyMove(context: SessionContext<TMove>, move: TMove): MoveResult {
    const result = context.play(move);
    if (result.kind === 'applied') {
      context.moveTo(new ResolvingState(result.pendingOutcome));
    }
    return result;
  }

  undo(context: SessionContext<TMove>): boolean {
    return context.undo();
  }

  redo(context: SessionContext<TMove>): boolean {
    return context.redo();
  }

  pause(context: SessionContext<TMove>): void {
    context.moveTo(new PausedState(null));
    context.emitPaused();
  }
}

/**
 * The UI is showing the consequences of the last move (RN-06): moves are
 * rejected until it calls `resolutionDone`. The end of the game was already
 * evaluated when the move was applied, so it is kept here as `pending`.
 */
export class ResolvingState<TMove> extends SessionState<TMove> {
  readonly status = 'resolving';

  constructor(private readonly pending: GameOutcome | null) {
    super();
  }

  applyMove(context: SessionContext<TMove>, move: TMove): MoveResult {
    return context.reject(move, 'a move is still being resolved');
  }

  /** Pausing mid-animation drops the lock: on resume the animation is gone. */
  pause(context: SessionContext<TMove>): void {
    context.moveTo(new PausedState(this.pending));
    context.emitPaused();
  }

  resolutionDone(context: SessionContext<TMove>): void {
    continueAfter(context, this.pending);
  }
}

/** Paused by the player or by going to the background (RN-07). */
export class PausedState<TMove> extends SessionState<TMove> {
  readonly status = 'paused';

  constructor(private readonly pending: GameOutcome | null) {
    super();
  }

  applyMove(context: SessionContext<TMove>, move: TMove): MoveResult {
    return context.reject(move, 'the game is paused');
  }

  resume(context: SessionContext<TMove>): void {
    context.emitResumed();
    continueAfter(context, this.pending);
  }
}

/** Victory or defeat: nothing but retry or quit, which start a new game. */
export class FinishedState<TMove> extends SessionState<TMove> {
  readonly status = 'finished';

  constructor(readonly outcome: GameOutcome) {
    super();
  }

  applyMove(context: SessionContext<TMove>, move: TMove): MoveResult {
    return context.reject(move, 'the game is over');
  }
}

/** Back to playing, or to the end if the last move ended the game. */
function continueAfter<TMove>(
  context: SessionContext<TMove>,
  pending: GameOutcome | null,
): void {
  if (pending === null) {
    context.moveTo(new PlayingState());
  } else {
    context.finish(pending);
  }
}
