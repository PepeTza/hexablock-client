import type { Board } from '../board/board';
import { ApplyMoveCommand } from '../commands/command';
import { CommandHistory } from '../commands/command-history';
import type {
  DomainEvent,
  EngineEvent,
  EventListener,
  GameOutcome,
  ListenerErrorHandler,
} from '../events/domain-event';
import type { ICoord } from '../geometry/coord';
import type { GameState } from './game-state';
import type { IGameRules, MoveOutcome } from './game-rules';
import {
  FinishedState,
  PlayingState,
  type GameStatus,
  type MoveResult,
  type SessionContext,
  type SessionState,
} from './session-states';

/** Everything a game needs to start, created by the variant's factory (CU-01). */
export interface GameEngineConfig<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TMove,
  TState extends GameState,
  TEvent extends DomainEvent = DomainEvent,
> {
  readonly board: Board<TCell, TCoord>;
  readonly state: TState;
  readonly rules: IGameRules<TCell, TCoord, TMove, TState, TEvent>;
  /** The seed of the game, shown at the end (RN-05); `null` when the variant uses none (Hexa Fit). */
  readonly seed: number | null;
  /** Command history policy for undo and redo (defaults to `CommandHistory.disabled()`). */
  readonly history?: CommandHistory<TMove>;
  /** Listeners that must also receive `GameStarted`. */
  readonly listeners?: readonly EventListener[];
  /**
   * Where listener errors go (the app wires it to its logger). Without it,
   * the first listener error is rethrown once every listener got every event.
   */
  readonly onListenerError?: ListenerErrorHandler;
}

/**
 * A game session (glossary: Game engine): holds the board and the state,
 * plays moves through the injected rules and tells listeners what happened.
 * It knows nothing about the variant (RF-02, RF-03).
 *
 * - Atomic moves: the rules play on a copy of the board (Prototype,
 *   `Board.clone`). The copy and the new state replace the current ones only
 *   when the move is applied; a rejected move or an error leaves the game
 *   exactly as it was.
 * - Session states (State pattern, D-22): playing, resolving, paused or
 *   finished; the current one decides what each action does.
 * - Undo / redo (Command pattern, RF-07): each applied move is stored in
 *   `CommandHistory` with snapshots of the board and state before and after it.
 * - Observer: listeners receive the events of the engine and of the variant
 *   only once an action is complete. Events are queued in an outbox while the
 *   session state works and delivered after it, so a listener always sees
 *   the finished game (after a move, the session is already `resolving`) and
 *   a move it tries to play is handled by the new session state (RN-06). A
 *   listener that throws does not stop the others (`onListenerError`).
 *
 * `board` and `state` are for reading: changing them directly would bypass
 * the rules.
 */
export class GameEngine<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TMove,
  TState extends GameState,
  TEvent extends DomainEvent = DomainEvent,
> {
  readonly seed: number | null;
  private currentBoard: Board<TCell, TCoord>;
  private currentState: TState;
  private session: SessionState<TMove> = new PlayingState();
  private readonly rules: IGameRules<TCell, TCoord, TMove, TState, TEvent>;
  private readonly history: CommandHistory<TMove>;
  private readonly listeners = new Set<EventListener>();
  private readonly onListenerError: ListenerErrorHandler | undefined;
  /** Events of the current action, delivered when it is complete. */
  private readonly outbox: DomainEvent[] = [];
  private readonly context: SessionContext<TMove>;

  private constructor(
    config: GameEngineConfig<TCell, TCoord, TMove, TState, TEvent>,
  ) {
    this.currentBoard = config.board;
    this.currentState = config.state;
    this.rules = config.rules;
    this.seed = config.seed;
    this.history = config.history ?? CommandHistory.disabled<TMove>();
    this.onListenerError = config.onListenerError;
    config.listeners?.forEach((listener) => this.listeners.add(listener));
    this.context = {
      play: (move) => this.play(move),
      reject: (move, reason) => this.reject(move, reason),
      undo: () => this.performUndo(),
      redo: () => this.performRedo(),
      moveTo: (state) => {
        this.session = state;
      },
      emitPaused: () => {
        this.emitEngine({ type: 'GamePaused' });
      },
      emitResumed: () => {
        this.emitEngine({ type: 'GameResumed' });
      },
      finish: (outcome) => {
        this.session = new FinishedState(outcome);
        this.emitEngine({ type: 'GameOver', outcome, score: this.state.score });
      },
    };
  }

  /** Creates the game in progress and emits `GameStarted` to `config.listeners`. */
  static start<
    TCell extends NonNullable<unknown>,
    TCoord extends ICoord,
    TMove,
    TState extends GameState,
    TEvent extends DomainEvent = DomainEvent,
  >(
    config: GameEngineConfig<TCell, TCoord, TMove, TState, TEvent>,
  ): GameEngine<TCell, TCoord, TMove, TState, TEvent> {
    const engine = new GameEngine(config);
    engine.act(() => {
      engine.emit({ type: 'GameStarted' });
    });
    return engine;
  }

  get board(): Board<TCell, TCoord> {
    return this.currentBoard;
  }

  get state(): TState {
    return this.currentState;
  }

  get status(): GameStatus {
    return this.session.status;
  }

  /** How the game ended, or `null` while it goes on. */
  get outcome(): GameOutcome | null {
    return this.session.outcome;
  }

  /** Whether `undo()` can currently revert a move (playing and permitted). */
  get canUndo(): boolean {
    return this.status === 'playing' && this.history.canUndo;
  }

  /** Whether `redo()` can currently reapply an undone move. */
  get canRedo(): boolean {
    return this.status === 'playing' && this.history.canRedo;
  }

  /** Adds a listener; returns the function that removes it. */
  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Plays a move (CU-02) and says what happened: rejected with its reason, or
   * applied with its points and the pending outcome if it ended the game.
   * What happens depends on the session state (D-22).
   */
  applyMove(move: TMove): MoveResult {
    return this.act(() => this.session.applyMove(this.context, move));
  }

  /**
   * Reverts the last applied move when playing and undo is available (CU-04).
   * Ignored (returns `false`, emits nothing) when unavailable or not playing.
   */
  undo(): boolean {
    return this.act(() => this.session.undo(this.context));
  }

  /**
   * Reapplies the last undone move when playing and redo is available (CU-05).
   * Ignored (returns `false`, emits nothing) when unavailable or not playing.
   */
  redo(): boolean {
    return this.act(() => this.session.redo(this.context));
  }

  /**
   * Grants extra undo steps for the current session (e.g. from a booster
   * Decorator), enabling undo even on variants whose baseline allowance is 0.
   */
  grantUndo(extra = 1): void {
    this.history.grantUndo(extra);
  }

  /**
   * What `move` would do, without changing the game or emitting events
   * (CU-03). Only while playing: in any other status it is rejected.
   */
  preview(move: TMove): MoveOutcome<TState, TEvent> {
    if (this.status !== 'playing') {
      return { kind: 'rejected', reason: `the game is ${this.status}` };
    }
    return this.rules.play(this.currentBoard.clone(), this.currentState, move);
  }

  pause(): void {
    this.act(() => {
      this.session.pause(this.context);
    });
  }

  resume(): void {
    this.act(() => {
      this.session.resume(this.context);
    });
  }

  /** Called by the UI when it has finished showing the last move (RN-06). */
  resolutionDone(): void {
    this.act(() => {
      this.session.resolutionDone(this.context);
    });
  }

  /**
   * Plays on a copy and keeps it only if the move is applied. If the rules
   * throw, nothing was kept and the error goes on to the caller (CU-02 A5).
   */
  private play(move: TMove): MoveResult {
    const beforeBoard = this.currentBoard;
    const beforeState = this.currentState;
    const draft = beforeBoard.clone();
    const result = this.rules.play(draft, beforeState, move);
    if (result.kind === 'rejected') {
      return this.reject(move, result.reason);
    }
    this.currentBoard = draft;
    this.currentState = result.state;
    this.history.record(
      new ApplyMoveCommand(
        move,
        { board: beforeBoard, state: beforeState },
        { board: draft, state: result.state },
        (board, state) => {
          this.currentBoard = board;
          this.currentState = state;
        },
      ),
    );
    this.emitEngine({ type: 'MoveApplied', move, points: result.points });
    result.events.forEach((event) => this.emit(event));
    return {
      kind: 'applied',
      points: result.points,
      pendingOutcome: result.outcome,
    };
  }

  private performUndo(): boolean {
    const command = this.history.undo();
    if (command === null) {
      return false;
    }
    this.emitEngine({ type: 'MoveUndone', move: command.move });
    return true;
  }

  private performRedo(): boolean {
    const command = this.history.redo();
    if (command === null) {
      return false;
    }
    this.emitEngine({ type: 'MoveRedone', move: command.move });
    return true;
  }

  /** Emits `MoveRejected`; the game stays exactly as it was. */
  private reject(move: TMove, reason: string): MoveResult {
    this.emitEngine({ type: 'MoveRejected', move, reason });
    return { kind: 'rejected', reason };
  }

  /** Runs one action of the session, then delivers the events it queued. */
  private act<TResult>(action: () => TResult): TResult {
    const result = action();
    this.deliver();
    return result;
  }

  /** An engine event, checked against its exact shape. */
  private emitEngine(event: EngineEvent<TMove>): void {
    this.emit(event);
  }

  /** Queues `event`; it reaches the listeners when the action is complete. */
  private emit(event: DomainEvent): void {
    this.outbox.push(event);
  }

  /**
   * Delivers the queued events in order (first in, first out), each to every
   * listener. If a listener starts another action, its events join the end
   * of the same queue. A listener that throws does not stop the others: its
   * error goes to `onListenerError`, or, without one, the first error is
   * rethrown after everything was delivered.
   *
   * Isolating listeners follows the DOM's `dispatchEvent`, where a listener
   * that throws has its exception reported and the remaining listeners still
   * run (WHATWG DOM Standard, "inner invoke",
   * https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke).
   */
  private deliver(): void {
    // Kept as thrown (`unknown`): the first one is rethrown unchanged.
    const errors: unknown[] = [];
    for (
      let event = this.outbox.shift();
      event !== undefined;
      event = this.outbox.shift()
    ) {
      for (const listener of [...this.listeners]) {
        try {
          listener(event);
        } catch (error) {
          if (this.onListenerError !== undefined) {
            this.onListenerError(error, event);
          } else {
            errors.push(error);
          }
        }
      }
    }
    if (errors.length > 0) {
      throw errors[0];
    }
  }
}
