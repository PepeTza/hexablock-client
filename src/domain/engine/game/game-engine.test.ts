import { Board } from '../board/board';
import { BoardShape } from '../board/board-shape';
import type { DomainEvent, GameOutcome } from '../events/domain-event';
import { HexCoord } from '../hex/hex-coord';
import { HexGeometry } from '../hex/hex-geometry';
import type { IScoringPolicy } from '../scoring/scoring-policy';
import { BaseGameRules, type Resolved } from './base-game-rules';
import { GameEngine } from './game-engine';
import type { GameState } from './game-state';

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
  options: { radius?: number; scoring?: IScoringPolicy<Placed> } = {},
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
    listeners: [(event) => events.push(event)],
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
  });
});
