import type { Board } from '../board/board';
import type { DomainEvent, GameOutcome } from '../events/domain-event';
import type { ICoord } from '../geometry/coord';
import type { IScoringPolicy } from '../scoring/scoring-policy';
import type { GameState } from './game-state';
import type { IGameRules, MoveOutcome } from './game-rules';

/** What the resolution step returns: the new state and what happened. */
export interface Resolved<
  TState extends GameState,
  TResolution,
  TEvent extends DomainEvent = DomainEvent,
> {
  /** The state after resolving, before the points are added. */
  readonly state: TState;
  /** What happened, for the scoring policy. */
  readonly resolution: TResolution;
  /** Events of the variant (for example `LineCleared`), in order. */
  readonly events?: readonly TEvent[];
}

/**
 * Template Method: the skeleton of a turn, the same for every variant
 * (CU-02). `play` runs the steps always in this order:
 *
 * 1. `validate`: may the move be played? (RN-02, RN-20, RN-28)
 * 2. `apply`: put it on the board.
 * 3. `resolve`: its consequences, such as clearing lines (RN-09), a cascade
 *    (RN-21) or merges (RN-27).
 * 4. Score: the injected `IScoringPolicy` (Strategy) turns the resolution
 *    into points; the move counter goes up unless `countsAsMove` says no.
 * 5. `evaluateEnd`: victory, defeat or neither.
 *
 * A variant writes only the steps. `play` must not be overridden (TypeScript
 * has no `final`), so no variant can skip a step, for example the score.
 *
 * `TResolution` is what `resolve` tells the scoring policy; only the variant
 * and its policy know it.
 */
export abstract class BaseGameRules<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TMove,
  TState extends GameState,
  TResolution,
  TEvent extends DomainEvent = DomainEvent,
> implements IGameRules<TCell, TCoord, TMove, TState, TEvent> {
  constructor(private readonly scoring: IScoringPolicy<TResolution>) {}

  play(
    board: Board<TCell, TCoord>,
    state: TState,
    move: TMove,
  ): MoveOutcome<TState, TEvent> {
    const reason = this.validate(board, state, move);
    if (reason !== null) {
      return { kind: 'rejected', reason };
    }
    this.apply(board, state, move);
    const resolved = this.resolve(board, state, move);
    const points = this.scoring.pointsFor(resolved.resolution);
    const scored: TState = {
      ...resolved.state,
      score: resolved.state.score + points,
      moveCount: resolved.state.moveCount + (this.countsAsMove(move) ? 1 : 0),
    };
    return {
      kind: 'applied',
      state: scored,
      points,
      events: resolved.events ?? [],
      outcome: this.evaluateEnd(board, scored),
    };
  }

  /** Why `move` cannot be played, or `null` when it can. Must not change the board. */
  protected abstract validate(
    board: Board<TCell, TCoord>,
    state: TState,
    move: TMove,
  ): string | null;

  /** Puts the validated move on the board. */
  protected abstract apply(
    board: Board<TCell, TCoord>,
    state: TState,
    move: TMove,
  ): void;

  /** The consequences of the applied move: the new state and what happened. */
  protected abstract resolve(
    board: Board<TCell, TCoord>,
    state: TState,
    move: TMove,
  ): Resolved<TState, TResolution, TEvent>;

  /** How the game ended after this move, or `null` when it goes on. */
  protected abstract evaluateEnd(
    board: Board<TCell, TCoord>,
    state: TState,
  ): GameOutcome | null;

  /**
   * Whether the move adds one to the move counter. A hook: `true` unless a
   * variant says otherwise (in Hexa Fit, a rotation is a move that does not
   * count, RN-17).
   */
  protected countsAsMove(move: TMove): boolean {
    void move;
    return true;
  }
}
