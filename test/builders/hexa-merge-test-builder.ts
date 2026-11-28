import type { DomainEvent } from '@domain/engine/events/domain-event';
import type { GameEngine } from '@domain/engine/game/game-engine';
import type { Direction } from '@domain/engine/geometry/direction';
import type { MoveResult } from '@domain/engine/game/session-states';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import type { WeightedEntry } from '@domain/engine/random/random-source';
import {
  startMergeGame,
  type InitialMergeTile,
  type MergeGameOptions,
} from '@domain/variants/hexa-merge/merge-game';
import type {
  MergeEvent,
  MergeState,
} from '@domain/variants/hexa-merge/merge-rules';
import type { SlideMove } from '@domain/variants/hexa-merge/slide-tiles';
import { Tile } from '@domain/variants/hexa-merge/tile';

export type HexaMergeEngine = GameEngine<
  Tile,
  HexCoord,
  SlideMove,
  MergeState,
  MergeEvent<HexCoord>
>;

/**
 * Testing API handle for a running Hexa Merge session (Clean Architecture
 * Ch. 28). Tests interact with observable game behavior instead of internal
 * value objects or constructors.
 */
export class HexaMergeScenario {
  private readonly recordedEvents: DomainEvent[];

  constructor(
    readonly session: HexaMergeEngine,
    recordedEvents: DomainEvent[],
  ) {
    this.recordedEvents = recordedEvents;
  }

  whenSliding(direction: Direction): MoveResult {
    const result = this.session.applyMove({ direction });
    if (result.kind === 'applied') {
      this.session.resolutionDone();
    }
    return result;
  }

  whenUndoing(): boolean {
    return this.session.undo();
  }

  whenRedoing(): boolean {
    return this.session.redo();
  }

  tileAt(q: number, r: number): number | null {
    return this.session.board.cellAt(new HexCoord(q, r))?.value ?? null;
  }

  occupiedCells(): readonly {
    readonly q: number;
    readonly r: number;
    readonly value: number;
  }[] {
    const cells: { q: number; r: number; value: number }[] = [];
    for (const coord of this.session.board.shape.coords) {
      const tile = this.session.board.cellAt(coord);
      if (tile !== undefined) {
        cells.push({ q: coord.q, r: coord.r, value: tile.value });
      }
    }
    return cells;
  }

  occupiedCount(): number {
    return this.occupiedCells().length;
  }

  boardSize(): number {
    return this.session.board.shape.coords.length;
  }

  score(): number {
    return this.session.state.score;
  }

  moveCount(): number {
    return this.session.state.moveCount;
  }

  targetReached(): boolean {
    return this.session.state.targetReached;
  }

  events(): readonly DomainEvent[] {
    return [...this.recordedEvents];
  }

  clearEvents(): void {
    this.recordedEvents.length = 0;
  }
}

/**
 * Builder (Testing API, Clean Architecture Ch. 28 & Khorikov Ch. 3):
 * constructs deterministic Hexa Merge sessions in ubiquitous language without
 * coupling tests to internal constructors or value objects.
 */
export class HexaMergeTestBuilder {
  private seed = 42;
  private boardRadius?: number;
  private initialTileCount?: number;
  private targetTile?: number;
  private undoAllowance?: number;
  private spawnWeights?: readonly WeightedEntry<Tile>[];
  private initialTiles?: InitialMergeTile[];

  givenSeed(seed: number): this {
    this.seed = seed;
    return this;
  }

  givenBoardRadius(radius: number): this {
    this.boardRadius = radius;
    return this;
  }

  givenEmptyBoard(): this {
    this.initialTiles = [];
    return this;
  }

  givenTile(q: number, r: number, value: number): this {
    this.initialTiles ??= [];
    this.initialTiles.push([new HexCoord(q, r), new Tile(value)]);
    return this;
  }

  givenTiles(entries: readonly (readonly [number, number, number])[]): this {
    for (const [q, r, value] of entries) {
      this.givenTile(q, r, value);
    }
    return this;
  }

  givenInitialTileCount(count: number): this {
    this.initialTileCount = count;
    return this;
  }

  givenTargetTile(value: number): this {
    this.targetTile = value;
    return this;
  }

  givenGuaranteedSpawn(value: number): this {
    this.spawnWeights = [{ item: new Tile(value), weight: 1 }];
    return this;
  }

  givenSpawnPool(entries: readonly (readonly [number, number])[]): this {
    this.spawnWeights = entries.map(([value, weight]) => ({
      item: new Tile(value),
      weight,
    }));
    return this;
  }

  givenUndoAllowance(allowance: number): this {
    this.undoAllowance = allowance;
    return this;
  }

  /**
   * Builds a radius-1 board with only `(1, 0)` empty where sliding EAST shifts
   * two tiles and spawns `512` at `(-1, 0)`, leaving zero valid moves.
   */
  givenOneMoveFromDefeat(): this {
    return this.givenBoardRadius(1)
      .givenTiles([
        [-1, 0, 128],
        [0, 0, 256],
        [0, -1, 4],
        [1, -1, 8],
        [-1, 1, 16],
        [0, 1, 32],
      ])
      .givenGuaranteedSpawn(512);
  }

  build(): HexaMergeScenario {
    const recordedEvents: DomainEvent[] = [];
    const options: MergeGameOptions = {
      boardRadius: this.boardRadius,
      initialTileCount: this.initialTileCount,
      targetTile: this.targetTile,
      undoAllowance: this.undoAllowance,
      spawnWeights: this.spawnWeights,
      initialTiles: this.initialTiles,
      listeners: [(event) => recordedEvents.push(event)],
    };
    const session = startMergeGame(this.seed, options);
    return new HexaMergeScenario(session, recordedEvents);
  }
}
