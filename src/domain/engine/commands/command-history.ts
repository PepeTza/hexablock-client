import type { ICommand } from './command';

/** Policy describing undo/redo behaviour for a `CommandHistory` instance. */
export interface CommandHistoryConfig {
  /**
   * Base undos available after each applied move:
   * - `0` for variants without baseline undo (Hexa Lines, Hexa Sort),
   * - `1` for single-step undo per move (Hexa Merge, RN-31),
   * - `Number.POSITIVE_INFINITY` for unlimited undo (Hexa Fit, RN-16).
   */
  readonly allowancePerMove: number;
  /** Whether undone commands move to the redo stack (`true` in Hexa Fit). */
  readonly allowRedo: boolean;
  /**
   * Maximum number of past commands kept in memory (defaults to
   * `Number.POSITIVE_INFINITY`). Keeping past commands even when
   * `allowancePerMove` is `0` or `1` lets an in-game booster grant extra
   * undos (`grantUndo`) mid-game without coupling the engine to boosters.
   */
  readonly maxDepth?: number;
}

/**
 * Command history (Command pattern, RF-07, CU-04, CU-05): separates stack
 * memory (`maxDepth`) from the undo allowance (`allowancePerMove` + bonus
 * undos granted via `grantUndo`), enabling generic undo/redo and mid-game
 * booster upgrades with zero variant conditionals (OCP).
 */
export class CommandHistory<TMove = unknown> {
  private readonly undoStack: ICommand<TMove>[] = [];
  private readonly redoStack: ICommand<TMove>[] = [];
  private readonly allowancePerMove: number;
  private readonly allowRedo: boolean;
  private readonly maxDepth: number;
  private baseUndos = 0;
  private bonusUndos = 0;

  constructor(config: CommandHistoryConfig) {
    const maxDepth = config.maxDepth ?? Number.POSITIVE_INFINITY;
    if (config.allowancePerMove < 0 || Number.isNaN(config.allowancePerMove)) {
      throw new RangeError('allowancePerMove must be non-negative');
    }
    if (maxDepth < 0 || Number.isNaN(maxDepth)) {
      throw new RangeError('maxDepth must be non-negative');
    }
    this.allowancePerMove = config.allowancePerMove;
    this.allowRedo = config.allowRedo;
    this.maxDepth = maxDepth;
  }

  /**
   * No baseline undo (`allowancePerMove = 0`, `allowRedo = false`), while still
   * buffering history so an in-game booster can unlock undo via `grantUndo`.
   */
  static disabled<TMove = unknown>(): CommandHistory<TMove> {
    return new CommandHistory({ allowancePerMove: 0, allowRedo: false });
  }

  /** Single undo per applied move with no redo (Hexa Merge, RN-31). */
  static singleUndo<TMove = unknown>(): CommandHistory<TMove> {
    return new CommandHistory({ allowancePerMove: 1, allowRedo: false });
  }

  /** Unlimited undo and redo (Hexa Fit, RN-16). */
  static unlimited<TMove = unknown>(): CommandHistory<TMove> {
    return new CommandHistory({
      allowancePerMove: Number.POSITIVE_INFINITY,
      allowRedo: true,
    });
  }

  /** Total undo steps currently permitted (base allowance plus granted bonuses). */
  get remainingUndos(): number {
    return this.baseUndos + this.bonusUndos;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0 && this.remainingUndos > 0;
  }

  get canRedo(): boolean {
    return this.allowRedo && this.redoStack.length > 0;
  }

  /**
   * Records a newly applied move: clears the redo stack (HU17, RN-16),
   * refreshes the per-move base allowance, and appends the command to history.
   */
  record(command: ICommand<TMove>): void {
    this.redoStack.length = 0;
    this.baseUndos = this.allowancePerMove;
    if (this.maxDepth === 0) {
      return;
    }
    if (this.undoStack.length >= this.maxDepth) {
      this.undoStack.shift();
    }
    this.undoStack.push(command);
  }

  /** Grants extra undo steps usable immediately (e.g. from a booster Decorator). */
  grantUndo(extra = 1): void {
    if (!Number.isInteger(extra) || extra <= 0) {
      throw new RangeError('extra undos must be a positive integer');
    }
    this.bonusUndos += extra;
  }

  /** Reverts the most recent command if permitted and returns it, or `null`. */
  undo(): ICommand<TMove> | null {
    if (!this.canUndo) {
      return null;
    }
    const command = this.undoStack.pop();
    if (command === undefined) {
      return null;
    }
    if (this.baseUndos > 0) {
      this.baseUndos -= 1;
    } else {
      this.bonusUndos -= 1;
    }
    command.undo();
    if (this.allowRedo) {
      this.redoStack.push(command);
    }
    return command;
  }

  /** Reapplies the most recently undone command without revalidating, or `null`. */
  redo(): ICommand<TMove> | null {
    if (!this.canRedo) {
      return null;
    }
    const command = this.redoStack.pop();
    if (command === undefined) {
      return null;
    }
    command.execute();
    this.undoStack.push(command);
    this.baseUndos = this.allowancePerMove;
    return command;
  }
}
