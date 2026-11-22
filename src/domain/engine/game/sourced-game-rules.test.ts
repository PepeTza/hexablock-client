import { Board } from '../board/board';
import { BoardShape } from '../board/board-shape';
import type { GameOutcome } from '../events/domain-event';
import { HexCoord } from '../hex/hex-coord';
import { HexGeometry } from '../hex/hex-geometry';
import { FixedPieceSource } from '../pieces/fixed-piece-source';
import type { IPieceSource } from '../pieces/piece-source';
import { RandomPieceSource } from '../pieces/random-piece-source';
import { SeededRandom } from '../random/seeded-random';
import { Snapshot } from '../state/snapshot';
import type { Resolved } from './base-game-rules';
import { GameEngine } from './game-engine';
import { SourcedGameRules, type SourcedState } from './sourced-game-rules';

// A variant that places a mark on an empty cell and deals one piece to its
// tray per move. `resolveWith` spreads the old state, so it also carries the
// old snapshot: `SourcedGameRules` must replace it.
type Move = { cell: HexCoord };
type Source = IPieceSource<string>;
interface DealState extends SourcedState<Source> {
  readonly tray: readonly string[];
}

class DealRules extends SourcedGameRules<
  string,
  HexCoord,
  Move,
  DealState,
  null,
  Source
> {
  resolveCalls = 0;

  constructor(private readonly failAfterDrawing = false) {
    super({ pointsFor: () => 0 });
  }

  protected validate(
    board: Board<string, HexCoord>,
    _: DealState,
    move: Move,
  ): string | null {
    return board.isEmpty(move.cell) ? null : 'taken';
  }

  protected apply(board: Board<string, HexCoord>, _: DealState, move: Move) {
    board.place(move.cell, 'mark');
  }

  protected resolveWith(
    _: Board<string, HexCoord>,
    state: DealState,
    __: Move,
    source: Source,
  ): Resolved<DealState, null> {
    this.resolveCalls += 1;
    const dealt = source.draw(1);
    if (this.failAfterDrawing) {
      throw new Error('resolution failed');
    }
    return {
      state: { ...state, tray: [...state.tray, ...dealt] },
      resolution: null,
    };
  }

  protected evaluateEnd(): GameOutcome | null {
    return null;
  }
}

/** A piece source that counts how many copies of it are made. */
class CountingSource implements Source {
  constructor(
    private readonly inner: Source,
    readonly counter: { clones: number },
  ) {}

  next(): string | null {
    return this.inner.next();
  }

  draw(count: number): string[] {
    return this.inner.draw(count);
  }

  hasNext(): boolean {
    return this.inner.hasNext();
  }

  clone(): CountingSource {
    this.counter.clones += 1;
    return new CountingSource(this.inner.clone(), this.counter);
  }
}

const geometry = new HexGeometry();
const A = HexCoord.ORIGIN;
const B = new HexCoord(1, 0);
const C = new HexCoord(0, 1);
const D = new HexCoord(-1, 0);

function newBoard(): Board<string, HexCoord> {
  return new Board<string, HexCoord>(
    BoardShape.ofRadius(geometry, 2),
    geometry,
  );
}

function startState(source: Source): DealState {
  return { score: 0, moveCount: 0, tray: [], source: Snapshot.of(source) };
}

function playOrThrow(
  rules: DealRules,
  state: DealState,
  cell: HexCoord,
  board = newBoard(),
): DealState {
  const outcome = rules.play(board, state, { cell });
  if (outcome.kind !== 'applied') {
    throw new Error(`expected the move to be applied: ${outcome.reason}`);
  }
  return outcome.state;
}

describe('SourcedGameRules', () => {
  it('should_leave_the_given_state_untouched_when_playing', () => {
    // Arrange
    const rules = new DealRules();
    const initial = startState(new FixedPieceSource(['a', 'b', 'c']));

    // Act
    playOrThrow(rules, initial, A);

    // Assert
    expect(initial.tray).toEqual([]);
    expect(initial.source.fork().draw(3)).toEqual(['a', 'b', 'c']);
  });

  it('should_save_the_advanced_snapshot_when_resolve_with_spreads_the_old_one', () => {
    // Arrange
    const rules = new DealRules();
    const board = newBoard();
    const initial = startState(new FixedPieceSource(['a', 'b', 'c']));

    // Act
    const afterFirst = playOrThrow(rules, initial, A, board);
    const afterSecond = playOrThrow(rules, afterFirst, B, board);

    // Assert
    expect(afterSecond.tray).toEqual(['a', 'b']);
  });

  it('should_deal_the_same_pieces_when_replaying_from_a_saved_state', () => {
    // Arrange
    const rules = new DealRules();
    const saved = playOrThrow(
      rules,
      startState(new FixedPieceSource(['a', 'b', 'c'])),
      A,
    );

    // Act
    const firstReplay = playOrThrow(rules, saved, B);
    const secondReplay = playOrThrow(rules, saved, C);

    // Assert
    expect(firstReplay.tray).toEqual(['a', 'b']);
    expect(secondReplay.tray).toEqual(firstReplay.tray);
  });

  it('should_keep_the_state_unchanged_when_resolve_with_throws', () => {
    // Arrange
    const rules = new DealRules(true);
    const initial = startState(new FixedPieceSource(['a', 'b', 'c']));

    // Act
    const play = () => rules.play(newBoard(), initial, { cell: A });

    // Assert
    expect(play).toThrow('resolution failed');
    expect(initial.source.fork().next()).toBe('a');
  });

  it('should_not_fork_the_source_when_the_move_is_rejected', () => {
    // Arrange
    const rules = new DealRules();
    const counter = { clones: 0 };
    const initial = startState(
      new CountingSource(new FixedPieceSource(['a', 'b']), counter),
    );
    const board = newBoard();
    board.place(A, 'mark');
    const clonesBefore = counter.clones;

    // Act
    const outcome = rules.play(board, initial, { cell: A });

    // Assert
    expect(outcome.kind).toBe('rejected');
    expect(rules.resolveCalls).toBe(0);
    expect(counter.clones).toBe(clonesBefore);
  });

  it('should_keep_the_source_of_the_game_when_previewing_an_accepted_move', () => {
    // Arrange
    const engine = GameEngine.start({
      board: newBoard(),
      state: startState(new FixedPieceSource(['a', 'b', 'c'])),
      rules: new DealRules(),
      seed: null,
    });

    // Act
    const preview = engine.preview({ cell: A });
    engine.applyMove({ cell: B });

    // Assert
    expect(preview.kind).toBe('applied');
    expect(engine.state.tray).toEqual(['a']);
  });

  it('should_deal_the_same_pieces_when_two_games_share_a_seed_with_and_without_previews', () => {
    // Arrange
    const pool = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const start = () =>
      GameEngine.start({
        board: newBoard(),
        state: startState(
          RandomPieceSource.uniform(pool, new SeededRandom(42)),
        ),
        rules: new DealRules(),
        seed: 42,
      });
    const plain = start();
    const previewed = start();
    const moves = [A, B, C, D];

    // Act
    for (const cell of moves) {
      plain.applyMove({ cell });
      plain.resolutionDone();

      for (const other of moves) {
        previewed.preview({ cell: other });
      }
      previewed.applyMove({ cell });
      previewed.resolutionDone();
    }

    // Assert
    expect(plain.state.tray).toHaveLength(4);
    expect(previewed.state.tray).toEqual(plain.state.tray);
  });
});
