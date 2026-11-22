import type { Board } from '../board/board';
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
  type SessionContext,
  type SessionState,
} from './session-states';

/** Everything a game needs to start, created by the variant's factory (CU-01). */
export interface GameEngineConfig<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TMove,
  TState extends GameState,
> {
  readonly board: Board<TCell, TCoord>;
  readonly state: TState;
  readonly rules: IGameRules<TCell, TCoord, TMove, TState>;
  /** The seed of the game, shown at the end (RN-05); `null` when the variant uses none (Hexa Fit). */
  readonly seed: number | null;
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
> {
  readonly seed: number | null;
  private currentBoard: Board<TCell, TCoord>;
  private currentState: TState;
  private session: SessionState<TMove> = new PlayingState();
  private readonly rules: IGameRules<TCell, TCoord, TMove, TState>;
  private readonly listeners = new Set<EventListener>();
  private readonly onListenerError: ListenerErrorHandler | undefined;
  /** Events of the current action, delivered when it is complete. */
  private readonly outbox: DomainEvent[] = [];
  private readonly context: SessionContext<TMove>;

  private constructor(config: GameEngineConfig<TCell, TCoord, TMove, TState>) {
    this.currentBoard = config.board;
    this.currentState = config.state;
    this.rules = config.rules;
    this.seed = config.seed;
    this.onListenerError = config.onListenerError;
    config.listeners?.forEach((listener) => this.listeners.add(listener));
    this.context = {
      play: (move) => this.play(move),
      reject: (move, reason) => {
        this.emitEngine({ type: 'MoveRejected', move, reason });
      },
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
  >(
    config: GameEngineConfig<TCell, TCoord, TMove, TState>,
  ): GameEngine<TCell, TCoord, TMove, TState> {
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
    return this.session instanceof FinishedState ? this.session.outcome : null;
  }

  /** Adds a listener; returns the function that removes it. */
  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Plays a move (CU-02). What happens depends on the session state (D-22). */
  applyMove(move: TMove): void {
    this.act(() => {
      this.session.applyMove(this.context, move);
    });
  }

  /**
   * What `move` would do, without changing the game or emitting events
   * (CU-03). Only while playing: in any other status it is rejected.
   */
  preview(move: TMove): MoveOutcome<TState> {
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
  private play(move: TMove): {
    applied: boolean;
    outcome: GameOutcome | null;
  } {
    const draft = this.currentBoard.clone();
    const result = this.rules.play(draft, this.currentState, move);
    if (result.kind === 'rejected') {
      this.emitEngine({ type: 'MoveRejected', move, reason: result.reason });
      return { applied: false, outcome: null };
    }
    this.currentBoard = draft;
    this.currentState = result.state;
    this.emitEngine({ type: 'MoveApplied', move, points: result.points });
    result.events.forEach((event) => this.emit(event));
    return { applied: true, outcome: result.outcome };
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
   */
  private deliver(): void {
    let firstError: Error | null = null;
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
            firstError ??= toError(error);
          }
        }
      }
    }
    if (firstError !== null) {
      throw firstError;
    }
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
