import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import { CommandHistory } from '@domain/engine/commands/command-history';
import type {
  DomainEvent,
  GameOutcome,
  ListenerErrorHandler,
} from '@domain/engine/events/domain-event';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';
import { RandomPieceSource } from '@domain/engine/pieces/random-piece-source';
import { SeededRandom } from '@domain/engine/random/seeded-random';
import type { IScoringPolicy } from '@domain/engine/scoring/scoring-policy';
import { Snapshot } from '@domain/engine/state/snapshot';
import {
  BaseGameRules,
  type Resolved,
} from '@domain/engine/game/base-game-rules';
import { GameEngine } from '@domain/engine/game/game-engine';
import type { GameState } from '@domain/engine/game/game-state';
import {
  SourcedGameRules,
  type SourcedState,
} from '@domain/engine/game/sourced-game-rules';

// Test variant 1: put a number on an empty cell. The game is won when the
// board is full. A negative number makes `resolve` throw, after the board
// copy was already changed.
type PlaceNumber = { cell: HexCoord; value: number };
type NumberState = GameState & { readonly placed: number };
type Placed = { value: number };

class NumberRules extends BaseGameRules<
  number,
  HexCoord,
  PlaceNumber,
  NumberState,
  Placed
> {
  protected validate(
    board: Board<number, HexCoord>,
    _: NumberState,
    move: PlaceNumber,
  ): string | null {
    return board.isEmpty(move.cell) ? null : 'cell is taken';
  }

  protected apply(
    board: Board<number, HexCoord>,
    _: NumberState,
    move: PlaceNumber,
  ): void {
    board.place(move.cell, move.value);
  }

  protected resolve(
    _: Board<number, HexCoord>,
    state: NumberState,
    move: PlaceNumber,
  ): Resolved<NumberState, Placed> {
    if (move.value < 0) {
      throw new Error('broken rule');
    }
    return {
      state: { ...state, placed: state.placed + 1 },
      resolution: { value: move.value },
      events: [{ type: 'NumberPlaced' }],
    };
  }

  protected evaluateEnd(board: Board<number, HexCoord>): GameOutcome | null {
    return board.shape.coords.every((cell) => !board.isEmpty(cell))
      ? 'victory'
      : null;
  }
}

const faceValue: IScoringPolicy<Placed> = { pointsFor: (r) => r.value };
const evenDouble: IScoringPolicy<Placed> = {
  pointsFor: (r) => (r.value % 2 === 0 ? r.value * 2 : r.value),
};

// Test variant 2: colours, never the same colour twice in a row; 1 point each.
type Colour = 'red' | 'blue';
type PlaceColour = { cell: HexCoord; colour: Colour };
type ColourState = GameState & { readonly last: Colour | null };

class ColourRules extends BaseGameRules<
  Colour,
  HexCoord,
  PlaceColour,
  ColourState,
  null
> {
  constructor() {
    super({ pointsFor: () => 1 });
  }

  protected validate(
    board: Board<Colour, HexCoord>,
    state: ColourState,
    move: PlaceColour,
  ): string | null {
    if (!board.isEmpty(move.cell)) return 'cell is taken';
    return state.last === move.colour ? 'same colour twice' : null;
  }

  protected apply(
    board: Board<Colour, HexCoord>,
    _: ColourState,
    move: PlaceColour,
  ): void {
    board.place(move.cell, move.colour);
  }

  protected resolve(
    _: Board<Colour, HexCoord>,
    state: ColourState,
    move: PlaceColour,
  ): Resolved<ColourState, null> {
    return { state: { ...state, last: move.colour }, resolution: null };
  }

  protected evaluateEnd(): GameOutcome | null {
    return null;
  }
}

const geometry = new HexGeometry();
const hex = (q: number, r: number): HexCoord => new HexCoord(q, r);

function numberGame(
  options: {
    radius?: number;
    scoring?: IScoringPolicy<Placed>;
    onListenerError?: ListenerErrorHandler;
    history?: CommandHistory<PlaceNumber>;
  } = {},
) {
  const events: DomainEvent[] = [];
  const engine = GameEngine.start({
    board: new Board<number, HexCoord>(
      BoardShape.ofRadius(geometry, options.radius ?? 1),
      geometry,
    ),
    state: { score: 0, moveCount: 0, placed: 0 },
    rules: new NumberRules(options.scoring ?? faceValue),
    seed: 42,
    history: options.history,
    listeners: [(event) => events.push(event)],
    onListenerError: options.onListenerError,
  });
  const types = () => events.map((event) => event.type);
  return { engine, events, types };
}

describe('GameEngine', () => {
  describe('moves', () => {
    it('should_apply_move_and_add_points_when_move_is_valid', () => {
      // Arrange
      const { engine } = numberGame();

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(engine.board.cellAt(HexCoord.ORIGIN)).toBe(4);
      expect(engine.state).toEqual({ score: 4, moveCount: 1, placed: 1 });
    });

    it('should_leave_board_and_state_unchanged_when_move_is_invalid', () => {
      // Arrange
      const { engine, types } = numberGame();
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      engine.resolutionDone();
      const before = engine.state;

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 3 });

      // Assert
      expect(engine.board.cellAt(HexCoord.ORIGIN)).toBe(4);
      expect(engine.state).toBe(before);
      expect(types().at(-1)).toBe('MoveRejected');
    });

    it('should_leave_everything_unchanged_when_rules_throw', () => {
      // Arrange
      const { engine, types } = numberGame();
      const eventsBefore = types().length;

      // Act
      const act = () => engine.applyMove({ cell: hex(1, 0), value: -1 });

      // Assert
      expect(act).toThrow('broken rule');
      expect(engine.board.isEmpty(hex(1, 0))).toBe(true);
      expect(engine.state).toEqual({ score: 0, moveCount: 0, placed: 0 });
      expect(engine.status).toBe('playing');
      expect(types()).toHaveLength(eventsBefore);
    });

    it('should_emit_move_applied_and_variant_events_when_move_succeeds', () => {
      // Arrange
      const { engine, types } = numberGame();

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(types()).toEqual(['GameStarted', 'MoveApplied', 'NumberPlaced']);
    });

    it('should_not_change_anything_when_previewing', () => {
      // Arrange
      const { engine, types } = numberGame();

      // Act
      const preview = engine.preview({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(preview).toMatchObject({ kind: 'applied', points: 4 });
      expect(engine.board.isEmpty(HexCoord.ORIGIN)).toBe(true);
      expect(engine.state.score).toBe(0);
      expect(types()).toEqual(['GameStarted']);
    });

    it('should_run_two_different_variants_with_the_same_engine', () => {
      // Arrange
      const colours = GameEngine.start({
        board: new Board<Colour, HexCoord>(
          BoardShape.ofRadius(geometry, 1),
          geometry,
        ),
        state: { score: 0, moveCount: 0, last: null },
        rules: new ColourRules(),
        seed: null,
      });
      const { engine: numbers } = numberGame();

      // Act
      colours.applyMove({ cell: HexCoord.ORIGIN, colour: 'red' });
      numbers.applyMove({ cell: HexCoord.ORIGIN, value: 5 });

      // Assert
      expect(colours.board.cellAt(HexCoord.ORIGIN)).toBe('red');
      expect(colours.state).toEqual({ score: 1, moveCount: 1, last: 'red' });
      expect(numbers.state.score).toBe(5);
    });

    it('should_change_score_when_scoring_policy_changes', () => {
      // Arrange
      const { engine: plain } = numberGame({ scoring: faceValue });
      const { engine: doubled } = numberGame({ scoring: evenDouble });

      // Act
      plain.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      doubled.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(plain.state.score).toBe(4);
      expect(doubled.state.score).toBe(8);
    });
  });

  describe('listeners and preview', () => {
    it('should_notify_listener_until_it_unsubscribes', () => {
      // Arrange
      const { engine } = numberGame();
      const received: string[] = [];
      const unsubscribe = engine.subscribe((event) =>
        received.push(event.type),
      );

      // Act
      engine.pause();
      unsubscribe();
      engine.resume();

      // Assert
      expect(received).toEqual(['GamePaused']);
    });

    it('should_reject_preview_when_not_playing', () => {
      // Arrange
      const { engine } = numberGame();
      engine.pause();

      // Act
      const preview = engine.preview({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(preview).toEqual({
        kind: 'rejected',
        reason: 'the game is paused',
      });
    });
  });

  describe('move results', () => {
    it('should_return_applied_with_points_when_move_succeeds', () => {
      // Arrange
      const { engine } = numberGame();

      // Act
      const result = engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(result).toEqual({
        kind: 'applied',
        points: 4,
        pendingOutcome: null,
      });
    });

    it('should_return_the_pending_outcome_when_the_move_ends_the_game', () => {
      // Arrange
      const { engine } = numberGame({ radius: 0 });

      // Act
      const result = engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(result).toMatchObject({
        kind: 'applied',
        pendingOutcome: 'victory',
      });
      expect(engine.status).toBe('resolving');
    });

    it('should_return_rejected_with_the_reason_when_rules_reject', () => {
      // Arrange
      const { engine } = numberGame();
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      engine.resolutionDone();

      // Act
      const result = engine.applyMove({ cell: HexCoord.ORIGIN, value: 3 });

      // Assert
      expect(result).toEqual({ kind: 'rejected', reason: 'cell is taken' });
    });

    type Engine = ReturnType<typeof numberGame>['engine'];
    it.each([
      {
        status: 'resolving',
        reason: 'a move is still being resolved',
        reach: (engine: Engine) =>
          engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 }),
      },
      {
        status: 'paused',
        reason: 'the game is paused',
        reach: (engine: Engine) => engine.pause(),
      },
      {
        status: 'finished',
        reason: 'the game is over',
        reach: (engine: Engine) => {
          engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
          engine.resolutionDone();
        },
      },
    ])('should_return_rejected_when_$status', ({ reason, reach }) => {
      // Arrange
      const { engine } = numberGame({ radius: 0 });
      reach(engine);

      // Act
      const result = engine.applyMove({ cell: HexCoord.ORIGIN, value: 2 });

      // Assert
      expect(result).toEqual({ kind: 'rejected', reason });
    });
  });

  describe('notifying listeners', () => {
    const throwing = (event: DomainEvent) => {
      throw new Error(`bug on ${event.type}`);
    };

    it('should_be_resolving_when_listeners_receive_move_applied', () => {
      // Arrange
      const { engine } = numberGame();
      const statusSeen: string[] = [];
      engine.subscribe((event) => {
        if (event.type === 'MoveApplied') statusSeen.push(engine.status);
      });

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(statusSeen).toEqual(['resolving']);
    });

    it('should_reject_a_move_applied_from_a_listener', () => {
      // Arrange
      const { engine, types } = numberGame();
      engine.subscribe((event) => {
        if (event.type === 'MoveApplied') {
          engine.applyMove({ cell: hex(1, 0), value: 2 });
        }
      });

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(engine.state.moveCount).toBe(1);
      expect(engine.board.isEmpty(hex(1, 0))).toBe(true);
      expect(types()).toEqual([
        'GameStarted',
        'MoveApplied',
        'NumberPlaced',
        'MoveRejected',
      ]);
    });

    it('should_deliver_events_to_every_listener_when_one_throws', () => {
      // Arrange
      const reported: string[] = [];
      const { engine } = numberGame({
        onListenerError: (error, event) =>
          reported.push(`${(error as Error).message} / ${event.type}`),
      });
      const received: string[] = [];
      engine.subscribe(throwing);
      engine.subscribe((event) => received.push(event.type));

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(received).toEqual(['MoveApplied', 'NumberPlaced']);
      expect(reported).toEqual([
        'bug on MoveApplied / MoveApplied',
        'bug on NumberPlaced / NumberPlaced',
      ]);
    });

    it('should_finish_the_game_when_a_listener_throws_on_the_winning_move', () => {
      // Arrange
      const { engine } = numberGame({
        radius: 0,
        onListenerError: () => undefined,
      });
      engine.subscribe(throwing);
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      const statusAfterMove = engine.status;

      // Act
      engine.resolutionDone();

      // Assert
      expect(statusAfterMove).toBe('resolving');
      expect(engine.status).toBe('finished');
      expect(engine.outcome).toBe('victory');
    });

    it('should_rethrow_the_first_listener_error_after_notifying_everyone_when_no_handler', () => {
      // Arrange
      const { engine } = numberGame();
      const received: string[] = [];
      engine.subscribe(throwing);
      engine.subscribe((event) => received.push(event.type));

      // Act
      const act = () => engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(act).toThrow('bug on MoveApplied');
      expect(received).toEqual(['MoveApplied', 'NumberPlaced']);
      expect(engine.state.moveCount).toBe(1);
      expect(engine.status).toBe('resolving');
    });

    it('should_rethrow_the_original_error_when_a_listener_throws_without_handler', () => {
      // Arrange
      const { engine } = numberGame();
      const original = new RangeError('listener bug');
      engine.subscribe(() => {
        throw original;
      });

      // Act
      let rethrown: unknown = null;
      try {
        engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      } catch (error) {
        rethrown = error;
      }

      // Assert
      expect(rethrown).toBe(original);
    });
  });

  describe('session states (D-22)', () => {
    it('should_reject_move_when_resolving', () => {
      // Arrange
      const { engine, types } = numberGame();
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Act
      engine.applyMove({ cell: hex(1, 0), value: 2 });

      // Assert
      expect(engine.status).toBe('resolving');
      expect(engine.board.isEmpty(hex(1, 0))).toBe(true);
      expect(types().at(-1)).toBe('MoveRejected');
    });

    it('should_return_to_playing_when_resolution_done', () => {
      // Arrange
      const { engine } = numberGame();
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Act
      engine.resolutionDone();

      // Assert
      expect(engine.status).toBe('playing');
    });

    it('should_reject_move_when_paused', () => {
      // Arrange
      const { engine, types } = numberGame();
      engine.pause();

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Assert
      expect(engine.status).toBe('paused');
      expect(engine.board.isEmpty(HexCoord.ORIGIN)).toBe(true);
      expect(types()).toEqual(['GameStarted', 'GamePaused', 'MoveRejected']);
    });

    it('should_ignore_resume_when_playing', () => {
      // Arrange
      const { engine, types } = numberGame();

      // Act
      engine.resume();

      // Assert
      expect(engine.status).toBe('playing');
      expect(types()).toEqual(['GameStarted']);
    });

    it('should_go_to_paused_when_paused_while_resolving', () => {
      // Arrange
      const { engine } = numberGame();
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });

      // Act
      engine.pause();
      engine.resume();

      // Assert
      expect(engine.status).toBe('playing');
    });

    it('should_finish_after_resolution_when_rules_report_end', () => {
      // Arrange
      const { engine, types } = numberGame({ radius: 0 });
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      const statusWhileResolving = engine.status;

      // Act
      engine.resolutionDone();

      // Assert
      expect(statusWhileResolving).toBe('resolving');
      expect(engine.status).toBe('finished');
      expect(engine.outcome).toBe('victory');
      expect(types().at(-1)).toBe('GameOver');
    });

    it('should_finish_on_resume_when_paused_during_final_resolution', () => {
      // Arrange
      const { engine, events } = numberGame({ radius: 0 });
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      engine.pause();

      // Act
      engine.resume();

      // Assert
      expect(engine.status).toBe('finished');
      expect(events.at(-1)).toEqual({
        type: 'GameOver',
        outcome: 'victory',
        score: 4,
      });
    });

    it('should_reject_move_when_finished', () => {
      // Arrange
      const { engine, types } = numberGame({ radius: 0 });
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      engine.resolutionDone();

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 2 });

      // Assert
      expect(engine.status).toBe('finished');
      expect(types().at(-1)).toBe('MoveRejected');
    });

    // The "Ignored" cells of the CU-06 transition table: nothing changes and
    // no event is emitted.
    type Engine = ReturnType<typeof numberGame>['engine'];
    const toPaused = (engine: Engine) => engine.pause();
    const toResolving = (engine: Engine) =>
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
    const toFinished = (engine: Engine) => {
      toResolving(engine);
      engine.resolutionDone();
    };
    const stayPlaying = () => undefined;

    it.each([
      { action: 'pause', status: 'paused', reach: toPaused },
      { action: 'pause', status: 'finished', reach: toFinished },
      { action: 'resume', status: 'resolving', reach: toResolving },
      { action: 'resume', status: 'finished', reach: toFinished },
      { action: 'resolutionDone', status: 'playing', reach: stayPlaying },
      { action: 'resolutionDone', status: 'paused', reach: toPaused },
      { action: 'resolutionDone', status: 'finished', reach: toFinished },
    ] as const)(
      'should_change_nothing_when_$action_is_called_while_$status',
      ({ action, status, reach }) => {
        // Arrange
        const { engine, types } = numberGame({ radius: 0 });
        reach(engine);
        const eventsBefore = types().length;

        // Act
        engine[action]();

        // Assert
        expect(engine.status).toBe(status);
        expect(types()).toHaveLength(eventsBefore);
      },
    );

    it('should_report_null_outcome_until_finished_when_session_state_changes', () => {
      // Arrange
      const { engine } = numberGame({ radius: 0 });
      const whilePlaying = engine.outcome;

      // Act
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      const whileResolving = engine.outcome;
      engine.pause();
      const whilePaused = engine.outcome;
      engine.resume();
      const onceFinished = engine.outcome;

      // Assert
      expect(whilePlaying).toBeNull();
      expect(whileResolving).toBeNull();
      expect(whilePaused).toBeNull();
      expect(engine.status).toBe('finished');
      expect(onceFinished).toBe('victory');
    });
  });

  describe('undo and redo (T20)', () => {
    type RandomDealState = SourcedState<RandomPieceSource<string>> & {
      readonly dealt: readonly string[];
    };

    class RandomDealRules extends SourcedGameRules<
      string,
      HexCoord,
      HexCoord,
      RandomDealState,
      null,
      RandomPieceSource<string>
    > {
      constructor() {
        super({ pointsFor: () => 1 });
      }

      protected validate(
        board: Board<string, HexCoord>,
        _: RandomDealState,
        move: HexCoord,
      ): string | null {
        return board.isEmpty(move) ? null : 'cell is taken';
      }

      protected apply(
        board: Board<string, HexCoord>,
        _: RandomDealState,
        move: HexCoord,
      ): void {
        board.place(move, 'tile');
      }

      protected resolveWith(
        _: Board<string, HexCoord>,
        state: RandomDealState,
        __: HexCoord,
        source: RandomPieceSource<string>,
      ): Resolved<RandomDealState, null> {
        const [nextTile] = source.draw(1);
        return {
          state: {
            ...state,
            dealt:
              nextTile === undefined ? state.dealt : [...state.dealt, nextTile],
          },
          resolution: null,
        };
      }

      protected evaluateEnd(): GameOutcome | null {
        return null;
      }
    }

    it('should_restore_board_and_state_and_emit_move_undone_when_undo_is_called', () => {
      // Arrange
      const { engine, events, types } = numberGame({
        history: CommandHistory.unlimited(),
      });
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      engine.resolutionDone();
      engine.applyMove({ cell: hex(1, 0), value: 6 });
      engine.resolutionDone();

      // Act
      const undone = engine.undo();

      // Assert
      expect(undone).toBe(true);
      expect(engine.status).toBe('playing');
      expect(engine.board.cellAt(HexCoord.ORIGIN)).toBe(4);
      expect(engine.board.isEmpty(hex(1, 0))).toBe(true);
      expect(engine.state).toEqual({ score: 4, moveCount: 1, placed: 1 });
      expect(engine.canUndo).toBe(true);
      expect(engine.canRedo).toBe(true);
      expect(types().at(-1)).toBe('MoveUndone');
      expect(events.at(-1)).toEqual({
        type: 'MoveUndone',
        move: { cell: hex(1, 0), value: 6 },
      });
    });

    it('should_reapply_move_without_revalidating_and_emit_move_redone_when_redo_is_called', () => {
      // Arrange
      const { engine, events, types } = numberGame({
        history: CommandHistory.unlimited(),
      });
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      engine.resolutionDone();
      engine.applyMove({ cell: hex(1, 0), value: 6 });
      engine.resolutionDone();
      engine.undo();
      const eventCountBeforeRedo = types().length;

      // Act
      const redone = engine.redo();

      // Assert
      expect(redone).toBe(true);
      expect(engine.status).toBe('playing');
      expect(engine.board.cellAt(hex(1, 0))).toBe(6);
      expect(engine.state).toEqual({ score: 10, moveCount: 2, placed: 2 });
      expect(engine.canRedo).toBe(false);
      expect(types().slice(eventCountBeforeRedo)).toEqual(['MoveRedone']);
      expect(events.at(-1)).toEqual({
        type: 'MoveRedone',
        move: { cell: hex(1, 0), value: 6 },
      });
    });

    it('should_clear_redo_history_when_a_new_move_is_applied_after_undo', () => {
      // Arrange
      const { engine } = numberGame({ history: CommandHistory.unlimited() });
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      engine.resolutionDone();
      engine.applyMove({ cell: hex(1, 0), value: 6 });
      engine.resolutionDone();
      engine.undo();
      const canRedoBeforeNewMove = engine.canRedo;

      // Act
      engine.applyMove({ cell: hex(0, 1), value: 2 });
      engine.resolutionDone();

      // Assert
      expect(canRedoBeforeNewMove).toBe(true);
      expect(engine.canRedo).toBe(false);
      expect(engine.redo()).toBe(false);
      expect(engine.state).toEqual({ score: 6, moveCount: 2, placed: 2 });
    });

    it('should_not_record_command_or_clear_redo_when_move_is_rejected_or_throws', () => {
      // Arrange
      const { engine } = numberGame({ history: CommandHistory.unlimited() });
      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      engine.resolutionDone();
      engine.applyMove({ cell: hex(1, 0), value: 6 });
      engine.resolutionDone();
      engine.undo();

      // Act
      const rejected = engine.applyMove({ cell: HexCoord.ORIGIN, value: 9 });
      const throwing = () => engine.applyMove({ cell: hex(1, 0), value: -1 });

      // Assert
      expect(rejected).toEqual({ kind: 'rejected', reason: 'cell is taken' });
      expect(throwing).toThrow('broken rule');
      expect(engine.canRedo).toBe(true);
      expect(engine.board.isEmpty(hex(1, 0))).toBe(true);
      expect(engine.state).toEqual({ score: 4, moveCount: 1, placed: 1 });
      expect(engine.redo()).toBe(true);
      expect(engine.board.cellAt(hex(1, 0))).toBe(6);
    });

    it('should_restore_source_snapshot_so_repeated_move_deals_same_piece_when_undone', () => {
      // Arrange
      const pool = ['p1', 'p2', 'p3', 'p4', 'p5'];
      const source = RandomPieceSource.uniform(pool, new SeededRandom(99));
      const engine = GameEngine.start({
        board: new Board<string, HexCoord>(
          BoardShape.ofRadius(geometry, 1),
          geometry,
        ),
        state: {
          score: 0,
          moveCount: 0,
          dealt: [],
          source: Snapshot.of(source),
        },
        rules: new RandomDealRules(),
        seed: 99,
        history: CommandHistory.singleUndo(),
      });
      engine.applyMove(HexCoord.ORIGIN);
      engine.resolutionDone();
      engine.applyMove(hex(1, 0));
      engine.resolutionDone();
      const dealtAfterSecondMove = [...engine.state.dealt];

      // Act
      const undone = engine.undo();
      const dealtAfterUndo = [...engine.state.dealt];
      engine.applyMove(hex(1, 0));
      engine.resolutionDone();

      // Assert
      expect(undone).toBe(true);
      expect(dealtAfterUndo).toHaveLength(1);
      expect(engine.state.dealt).toEqual(dealtAfterSecondMove);
    });

    it('should_unlock_extra_undo_mid_game_when_grant_undo_is_called_on_disabled_or_single_undo_game', () => {
      // Arrange
      const { engine: disabledGame } = numberGame();
      disabledGame.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      disabledGame.resolutionDone();
      disabledGame.applyMove({ cell: hex(1, 0), value: 6 });
      disabledGame.resolutionDone();

      const { engine: singleUndoGame } = numberGame({
        history: CommandHistory.singleUndo(),
      });
      singleUndoGame.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      singleUndoGame.resolutionDone();
      singleUndoGame.applyMove({ cell: hex(1, 0), value: 6 });
      singleUndoGame.resolutionDone();

      // Act
      const canUndoBeforeGrant = disabledGame.canUndo;
      disabledGame.grantUndo(1);
      const disabledUnlocked = disabledGame.undo();
      singleUndoGame.grantUndo(1);
      const firstSingle = singleUndoGame.undo();
      const secondSingle = singleUndoGame.undo();
      const thirdSingle = singleUndoGame.undo();

      // Assert
      expect(canUndoBeforeGrant).toBe(false);
      expect(disabledUnlocked).toBe(true);
      expect(disabledGame.board.isEmpty(hex(1, 0))).toBe(true);
      expect(disabledGame.canUndo).toBe(false);
      expect(firstSingle).toBe(true);
      expect(secondSingle).toBe(true);
      expect(thirdSingle).toBe(false);
      expect(singleUndoGame.state).toEqual({
        score: 0,
        moveCount: 0,
        placed: 0,
      });
    });

    it('should_ignore_undo_and_redo_when_not_playing_or_nothing_to_undo', () => {
      // Arrange
      const { engine, types } = numberGame({
        radius: 0,
        history: CommandHistory.unlimited(),
      });
      const beforeEmpty = types().length;
      const emptyUndo = engine.undo();
      const emptyRedo = engine.redo();
      const afterEmpty = types().length;

      engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
      const beforeResolving = types().length;
      const canUndoWhileResolving = engine.canUndo;
      const undoWhileResolving = engine.undo();
      const redoWhileResolving = engine.redo();
      const afterResolving = types().length;

      engine.pause();
      const beforePaused = types().length;
      const canUndoWhilePaused = engine.canUndo;
      const undoWhilePaused = engine.undo();
      const redoWhilePaused = engine.redo();
      const afterPaused = types().length;

      engine.resume();
      const beforeFinished = types().length;
      const canUndoWhenFinished = engine.canUndo;
      const undoWhenFinished = engine.undo();
      const redoWhenFinished = engine.redo();
      const afterFinished = types().length;

      // Assert
      expect(emptyUndo).toBe(false);
      expect(emptyRedo).toBe(false);
      expect(afterEmpty).toBe(beforeEmpty);
      expect(canUndoWhileResolving).toBe(false);
      expect(undoWhileResolving).toBe(false);
      expect(redoWhileResolving).toBe(false);
      expect(afterResolving).toBe(beforeResolving);
      expect(canUndoWhilePaused).toBe(false);
      expect(undoWhilePaused).toBe(false);
      expect(redoWhilePaused).toBe(false);
      expect(afterPaused).toBe(beforePaused);
      expect(canUndoWhenFinished).toBe(false);
      expect(undoWhenFinished).toBe(false);
      expect(redoWhenFinished).toBe(false);
      expect(afterFinished).toBe(beforeFinished);
      expect(engine.status).toBe('finished');
    });
  });
});
