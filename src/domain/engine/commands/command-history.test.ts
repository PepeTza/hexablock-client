import { Board } from '../board/board';
import { BoardShape } from '../board/board-shape';
import type { GameState } from '../game/game-state';
import { HexCoord } from '../hex/hex-coord';
import { HexGeometry } from '../hex/hex-geometry';
import { ApplyMoveCommand, type ICommand } from './command';
import { CommandHistory } from './command-history';

function createCounterCommand(
  move: string,
  log: string[],
  counter: { value: number },
  delta: number,
): ICommand<string> {
  return {
    move,
    execute: () => {
      counter.value += delta;
      log.push(`exec:${move}`);
    },
    undo: () => {
      counter.value -= delta;
      log.push(`undo:${move}`);
    },
  };
}

describe('CommandHistory', () => {
  it('should_revert_and_reapply_command_when_undo_and_redo_are_called', () => {
    // Arrange
    const history = CommandHistory.unlimited<string>();
    const log: string[] = [];
    const counter = { value: 0 };
    const first = createCounterCommand('m1', log, counter, 3);
    const second = createCounterCommand('m2', log, counter, 5);
    first.execute();
    history.record(first);
    second.execute();
    history.record(second);

    // Act
    const undoneSecond = history.undo();
    const undoneFirst = history.undo();
    const undoneEmpty = history.undo();
    const redoneFirst = history.redo();
    const redoneSecond = history.redo();
    const redoneEmpty = history.redo();

    // Assert
    expect(undoneSecond?.move).toBe('m2');
    expect(undoneFirst?.move).toBe('m1');
    expect(undoneEmpty).toBeNull();
    expect(redoneFirst?.move).toBe('m1');
    expect(redoneSecond?.move).toBe('m2');
    expect(redoneEmpty).toBeNull();
    expect(counter.value).toBe(8);
    expect(log).toEqual([
      'exec:m1',
      'exec:m2',
      'undo:m2',
      'undo:m1',
      'exec:m1',
      'exec:m2',
    ]);
  });

  it('should_clear_redo_stack_when_a_new_command_is_recorded', () => {
    // Arrange
    const history = CommandHistory.unlimited<string>();
    const counter = { value: 0 };
    const log: string[] = [];
    const first = createCounterCommand('m1', log, counter, 1);
    const second = createCounterCommand('m2', log, counter, 2);
    const third = createCounterCommand('m3', log, counter, 4);
    history.record(first);
    history.record(second);
    history.undo();

    // Act
    const redoBeforeNew = history.canRedo;
    history.record(third);

    // Assert
    expect(redoBeforeNew).toBe(true);
    expect(history.canRedo).toBe(false);
    expect(history.redo()).toBeNull();
  });

  it('should_allow_only_one_undo_per_move_without_redo_when_using_single_undo', () => {
    // Arrange
    const history = CommandHistory.singleUndo<string>();
    const counter = { value: 10 };
    const log: string[] = [];
    history.record(createCounterCommand('m1', log, counter, 3));
    history.record(createCounterCommand('m2', log, counter, 4));

    // Act
    const firstUndo = history.undo();
    const canUndoAfterOne = history.canUndo;
    const secondUndo = history.undo();
    const redoResult = history.redo();
    history.record(createCounterCommand('m3', log, counter, 5));

    // Assert
    expect(firstUndo?.move).toBe('m2');
    expect(canUndoAfterOne).toBe(false);
    expect(secondUndo).toBeNull();
    expect(history.canRedo).toBe(false);
    expect(redoResult).toBeNull();
    expect(history.canUndo).toBe(true);
  });

  it('should_enable_undo_from_zero_or_add_extra_undo_when_grant_undo_is_called', () => {
    // Arrange
    const disabled = CommandHistory.disabled<string>();
    const single = CommandHistory.singleUndo<string>();
    const counter = { value: 10 };
    const log: string[] = [];
    disabled.record(createCounterCommand('d1', log, counter, 2));
    single.record(createCounterCommand('s1', log, counter, 2));
    single.record(createCounterCommand('s2', log, counter, 3));

    // Act
    const disabledBeforeGrant = disabled.canUndo;
    disabled.grantUndo(1);
    const disabledUndone = disabled.undo();
    single.grantUndo(1);
    const singleFirst = single.undo();
    const singleSecond = single.undo();
    const singleThird = single.undo();

    // Assert
    expect(disabledBeforeGrant).toBe(false);
    expect(disabledUndone?.move).toBe('d1');
    expect(disabled.canUndo).toBe(false);
    expect(singleFirst?.move).toBe('s2');
    expect(singleSecond?.move).toBe('s1');
    expect(singleThird).toBeNull();
    expect(single.remainingUndos).toBe(0);
  });

  it('should_drop_oldest_commands_when_max_depth_is_exceeded', () => {
    // Arrange
    const bounded = new CommandHistory<string>({
      allowancePerMove: Number.POSITIVE_INFINITY,
      allowRedo: false,
      maxDepth: 2,
    });
    const zeroDepth = new CommandHistory<string>({
      allowancePerMove: 1,
      allowRedo: false,
      maxDepth: 0,
    });
    const counter = { value: 0 };
    const log: string[] = [];
    bounded.record(createCounterCommand('m1', log, counter, 1));
    bounded.record(createCounterCommand('m2', log, counter, 1));
    bounded.record(createCounterCommand('m3', log, counter, 1));
    zeroDepth.record(createCounterCommand('z1', log, counter, 1));

    // Act
    const first = bounded.undo();
    const second = bounded.undo();
    const third = bounded.undo();

    // Assert
    expect(first?.move).toBe('m3');
    expect(second?.move).toBe('m2');
    expect(third).toBeNull();
    expect(zeroDepth.canUndo).toBe(false);
  });

  it('should_reject_invalid_configuration_or_non_positive_grant_when_called', () => {
    // Arrange
    const history = CommandHistory.disabled<string>();

    // Act & Assert
    expect(
      () =>
        new CommandHistory({
          allowancePerMove: -1,
          allowRedo: false,
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new CommandHistory({
          allowancePerMove: Number.NaN,
          allowRedo: false,
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new CommandHistory({
          allowancePerMove: 0,
          allowRedo: false,
          maxDepth: -2,
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new CommandHistory({
          allowancePerMove: 0,
          allowRedo: false,
          maxDepth: Number.NaN,
        }),
    ).toThrow(RangeError);
    expect(() => history.grantUndo(0)).toThrow(RangeError);
    expect(() => history.grantUndo(-1)).toThrow(RangeError);
    expect(() => history.grantUndo(1.5)).toThrow(RangeError);
  });

  it('should_isolate_saved_snapshots_when_restored_board_is_mutated', () => {
    // Arrange
    const geometry = new HexGeometry();
    const shape = BoardShape.ofRadius(geometry, 1);
    const beforeBoard = new Board<string, HexCoord>(shape, geometry);
    const afterBoard = beforeBoard.clone();
    afterBoard.place(HexCoord.ORIGIN, 'tile-2');
    const beforeState: GameState = { score: 0, moveCount: 0 };
    const afterState: GameState = { score: 2, moveCount: 1 };
    let currentBoard = afterBoard;
    let currentState = afterState;

    const command = new ApplyMoveCommand(
      'place-origin',
      { board: beforeBoard, state: beforeState },
      { board: afterBoard, state: afterState },
      (board, state) => {
        currentBoard = board;
        currentState = state;
      },
    );

    // Act
    afterBoard.place(new HexCoord(1, 0), 'tampered-after');
    command.undo();
    currentBoard.place(HexCoord.ORIGIN, 'tampered-restored');
    command.execute();
    const afterRedoBoard = currentBoard;
    const afterRedoState = currentState;
    command.undo();

    // Assert
    expect(afterRedoBoard.cellAt(HexCoord.ORIGIN)).toBe('tile-2');
    expect(afterRedoBoard.isEmpty(new HexCoord(1, 0))).toBe(true);
    expect(afterRedoState).toEqual({ score: 2, moveCount: 1 });
    expect(currentBoard.isEmpty(HexCoord.ORIGIN)).toBe(true);
    expect(currentState).toEqual({ score: 0, moveCount: 0 });
  });
});
