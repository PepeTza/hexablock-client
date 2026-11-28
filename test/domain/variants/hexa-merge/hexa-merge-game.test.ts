import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import { CommandHistory } from '@domain/engine/commands/command-history';
import type { DomainEvent } from '@domain/engine/events/domain-event';
import { GameEngine } from '@domain/engine/game/game-engine';
import { Direction } from '@domain/engine/geometry/direction';
import { HexDirection } from '@domain/engine/hex/hex-geometry';
import { SeededRandom } from '@domain/engine/random/seeded-random';
import { Snapshot } from '@domain/engine/state/snapshot';
import { emptyProgress } from '@domain/progress/player-progress';
import { MergeRules } from '@domain/variants/hexa-merge/merge-rules';
import { MergeScoringPolicy } from '@domain/variants/hexa-merge/merge-scoring-policy';
import { MergeVariantFactory } from '@domain/variants/hexa-merge/merge-variant-factory';
import type { SlideMove } from '@domain/variants/hexa-merge/slide-tiles';
import { Tile } from '@domain/variants/hexa-merge/tile';
import { HexaMergeTestBuilder } from '@test/builders/hexa-merge-test-builder';
import {
  LineSquareGeometry,
  SQUARE_RIGHT,
  SquareCoord,
} from '@test/builders/square-geometry';

describe('Hexa Merge game session', () => {
  describe('starting a seeded game and board configuration', () => {
    it('should_start_a_nineteen_cell_board_with_two_interior_starting_tiles_and_reproducible_seed', () => {
      // Arrange & Act
      const first = new HexaMergeTestBuilder().givenSeed(42).build();
      const second = new HexaMergeTestBuilder().givenSeed(42).build();

      // Assert: RN-44 places starting tiles strictly on non-border cells (distance < 2).
      expect(first.boardSize()).toBe(19);
      expect(first.occupiedCount()).toBe(2);
      expect(first.session.seed).toBe(42);
      expect(first.occupiedCells()).toEqual(second.occupiedCells());
      for (const { q, r } of first.occupiedCells()) {
        const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
        expect(distance).toBeLessThan(2);
      }
    });

    it('should_support_configurable_board_radius_when_starting_a_session', () => {
      // Arrange
      const game = new HexaMergeTestBuilder()
        .givenBoardRadius(3)
        .givenTile(-3, 0, 2)
        .givenGuaranteedSpawn(4)
        .build();

      // Act
      const result = game.whenSliding(HexDirection.EAST);

      // Assert
      expect(game.boardSize()).toBe(37);
      expect(result.kind).toBe('applied');
      expect(game.tileAt(3, 0)).toBe(2);
    });

    it('should_reject_invalid_tile_values_initial_counts_and_empty_spawn_pools', () => {
      // Arrange & Act & Assert
      expect(() =>
        new HexaMergeTestBuilder().givenTargetTile(3).build(),
      ).toThrow(RangeError);
      expect(() =>
        new HexaMergeTestBuilder().givenSpawnPool([]).build(),
      ).toThrow(RangeError);
      expect(() =>
        new HexaMergeTestBuilder().givenSpawnPool([[2, 0]]).build(),
      ).toThrow(RangeError);
      expect(() =>
        new HexaMergeTestBuilder().givenInitialTileCount(-1).build(),
      ).toThrow(RangeError);
      expect(() =>
        new HexaMergeTestBuilder().givenInitialTileCount(8).build(),
      ).toThrow(RangeError);
    });
  });

  describe('sliding in all six hexagonal directions', () => {
    it.each([
      ['EAST', HexDirection.EAST, [2, 0] as const],
      ['WEST', HexDirection.WEST, [-2, 0] as const],
      ['SOUTH_EAST', HexDirection.SOUTH_EAST, [0, 2] as const],
      ['NORTH_WEST', HexDirection.NORTH_WEST, [0, -2] as const],
      ['SOUTH_WEST', HexDirection.SOUTH_WEST, [-2, 2] as const],
      ['NORTH_EAST', HexDirection.NORTH_EAST, [2, -2] as const],
    ])(
      'should_slide_a_centre_tile_to_the_far_border_when_sliding_%s',
      (_label, direction, [expectedQ, expectedR]) => {
        // Arrange
        const game = new HexaMergeTestBuilder()
          .givenTile(0, 0, 2)
          .givenGuaranteedSpawn(4)
          .build();

        // Act
        const result = game.whenSliding(direction);

        // Assert
        expect(result.kind).toBe('applied');
        expect(game.tileAt(expectedQ, expectedR)).toBe(2);
        expect(game.occupiedCount()).toBe(2);
      },
    );

    it('should_reject_a_slide_without_spawning_or_consuming_random_state_when_no_tile_can_move', () => {
      // Arrange
      const game = new HexaMergeTestBuilder()
        .givenSeed(10)
        .givenTile(2, 0, 2)
        .build();
      const control = new HexaMergeTestBuilder()
        .givenSeed(10)
        .givenTile(2, 0, 2)
        .build();

      // Act
      const rejected = game.whenSliding(HexDirection.EAST);
      const afterRejected = game.whenSliding(HexDirection.WEST);
      const controlMove = control.whenSliding(HexDirection.WEST);

      // Assert
      expect(rejected.kind).toBe('rejected');
      expect(afterRejected.kind).toBe('applied');
      expect(controlMove.kind).toBe('applied');
      expect(game.occupiedCells()).toEqual(control.occupiedCells());
    });

    it('should_reject_a_direction_that_does_not_belong_to_the_board_geometry', () => {
      // Arrange
      const game = new HexaMergeTestBuilder().givenTile(0, 0, 2).build();

      // Act
      const result = game.whenSliding(new Direction('UP'));

      // Assert
      expect(result.kind).toBe('rejected');
    });
  });

  describe('merging equal tiles and scoring', () => {
    it('should_merge_adjacent_equal_tiles_once_per_move_and_score_the_merged_values', () => {
      // Arrange
      const game = new HexaMergeTestBuilder()
        .givenTiles([
          [-2, 0, 2],
          [-1, 0, 2],
          [0, 0, 2],
          [1, 0, 2],
        ])
        .givenGuaranteedSpawn(8)
        .build();

      // Act
      const result = game.whenSliding(HexDirection.EAST);

      // Assert
      expect(result.kind).toBe('applied');
      expect(game.tileAt(2, 0)).toBe(4);
      expect(game.tileAt(1, 0)).toBe(4);
      expect(game.score()).toBe(8);
      expect(
        game.events().filter((event) => event.type === 'TileMerged'),
      ).toHaveLength(2);
      expect(
        game.events().filter((event) => event.type === 'TileSpawned'),
      ).toHaveLength(1);
    });

    it('should_merge_target_edge_pair_first_when_three_equal_tiles_collide', () => {
      // Arrange
      const game = new HexaMergeTestBuilder()
        .givenTiles([
          [-2, 0, 2],
          [-1, 0, 2],
          [0, 0, 2],
        ])
        .givenGuaranteedSpawn(8)
        .build();

      // Act
      const result = game.whenSliding(HexDirection.EAST);

      // Assert: the two tiles closest to the EAST border merge into 4 at (2,0),
      // leaving the trailing 2 at (1,0).
      expect(result.kind).toBe('applied');
      expect(game.tileAt(2, 0)).toBe(4);
      expect(game.tileAt(1, 0)).toBe(2);
      expect(game.score()).toBe(4);
    });

    it('should_allow_a_merge_only_move_when_tiles_are_already_against_the_border', () => {
      // Arrange
      const game = new HexaMergeTestBuilder()
        .givenTiles([
          [1, 0, 4],
          [2, 0, 4],
        ])
        .givenGuaranteedSpawn(2)
        .build();

      // Act
      const result = game.whenSliding(HexDirection.EAST);

      // Assert
      expect(result.kind).toBe('applied');
      expect(game.tileAt(2, 0)).toBe(8);
      expect(game.score()).toBe(8);
    });
  });

  describe('target tile and defeat detection', () => {
    it('should_emit_target_reached_once_and_keep_playing_when_the_target_tile_is_formed', () => {
      // Arrange
      const game = new HexaMergeTestBuilder()
        .givenTargetTile(8)
        .givenTiles([
          [-2, 0, 4],
          [0, 0, 4],
        ])
        .givenGuaranteedSpawn(2)
        .build();

      // Act
      game.whenSliding(HexDirection.EAST);
      const firstTargetEvents = game
        .events()
        .filter((event) => event.type === 'TargetReached');
      game.clearEvents();
      game.whenSliding(HexDirection.WEST);
      const secondTargetEvents = game
        .events()
        .filter((event) => event.type === 'TargetReached');

      // Assert
      expect(firstTargetEvents).toHaveLength(1);
      expect(secondTargetEvents).toHaveLength(0);
      expect(game.targetReached()).toBe(true);
      expect(game.session.status).toBe('playing');
      expect(game.session.outcome).toBeNull();
    });

    it('should_end_in_defeat_when_the_board_fills_with_no_valid_moves_remaining', () => {
      // Arrange
      const game = new HexaMergeTestBuilder().givenOneMoveFromDefeat().build();

      // Act
      const result = game.whenSliding(HexDirection.EAST);

      // Assert
      expect(result.kind).toBe('applied');
      expect(game.session.status).toBe('finished');
      expect(game.session.outcome).toBe('defeat');
    });

    it('should_keep_playing_when_the_board_is_full_but_an_adjacent_merge_remains', () => {
      // Arrange: radius-1 board where sliding EAST spawns 128 next to (0,0)=128.
      const game = new HexaMergeTestBuilder()
        .givenBoardRadius(1)
        .givenTiles([
          [-1, 0, 128],
          [0, 0, 256],
          [0, -1, 4],
          [1, -1, 8],
          [-1, 1, 16],
          [0, 1, 32],
        ])
        .givenGuaranteedSpawn(128)
        .build();

      // Act
      const result = game.whenSliding(HexDirection.EAST);

      // Assert
      expect(result.kind).toBe('applied');
      expect(game.occupiedCount()).toBe(7);
      expect(game.session.status).toBe('playing');
      expect(game.session.outcome).toBeNull();
    });
  });

  describe('single-step undo without redo', () => {
    it('should_restore_board_score_target_flag_and_random_seed_on_undo_and_forbid_second_undo_or_redo', () => {
      // Arrange
      const game = new HexaMergeTestBuilder()
        .givenSeed(77)
        .givenTargetTile(4)
        .givenTiles([
          [-2, 0, 2],
          [0, 0, 2],
        ])
        .build();
      game.whenSliding(HexDirection.EAST);
      const cellsAfterFirstSlide = game.occupiedCells();

      // Act
      const undone = game.whenUndoing();
      const secondUndo = game.whenUndoing();
      const redone = game.whenRedoing();
      game.whenSliding(HexDirection.EAST);
      const cellsAfterReplay = game.occupiedCells();

      // Assert
      expect(undone).toBe(true);
      expect(secondUndo).toBe(false);
      expect(redone).toBe(false);
      expect(cellsAfterReplay).toEqual(cellsAfterFirstSlide);
    });

    it('should_support_custom_undo_allowance_and_forbid_undo_after_defeat', () => {
      // Arrange
      const multiUndo = new HexaMergeTestBuilder()
        .givenUndoAllowance(2)
        .givenTile(0, 0, 2)
        .givenGuaranteedSpawn(4)
        .build();
      const defeatGame = new HexaMergeTestBuilder()
        .givenOneMoveFromDefeat()
        .build();

      // Act
      multiUndo.whenSliding(HexDirection.EAST);
      multiUndo.whenSliding(HexDirection.WEST);
      const firstUndo = multiUndo.whenUndoing();
      const secondUndo = multiUndo.whenUndoing();
      defeatGame.whenSliding(HexDirection.EAST);
      const undoAfterDefeat = defeatGame.whenUndoing();

      // Assert
      expect(firstUndo).toBe(true);
      expect(secondUndo).toBe(true);
      expect(undoAfterDefeat).toBe(false);
    });
  });

  describe('geometry independence and variant factory', () => {
    it('should_run_merge_rules_on_a_non_hexagonal_board_geometry', () => {
      // Arrange
      const geometry = new LineSquareGeometry();
      const board = new Board<Tile, SquareCoord>(
        BoardShape.of([
          new SquareCoord(0, 0),
          new SquareCoord(1, 0),
          new SquareCoord(2, 0),
        ]),
        geometry,
      );
      board.place(new SquareCoord(0, 0), new Tile(2));
      board.place(new SquareCoord(1, 0), new Tile(2));
      const engine = GameEngine.start({
        board,
        state: {
          score: 0,
          moveCount: 0,
          targetReached: false,
          source: Snapshot.of(new SeededRandom(7)),
        },
        rules: new MergeRules<SquareCoord>(
          new MergeScoringPolicy<SquareCoord>(),
          [{ item: new Tile(4), weight: 1 }],
        ),
        seed: 7,
        history: new CommandHistory<SlideMove>({
          allowancePerMove: 1,
          allowRedo: false,
        }),
      });

      // Act
      const result = engine.applyMove({ direction: SQUARE_RIGHT });
      engine.resolutionDone();

      // Assert
      expect(result.kind).toBe('applied');
      expect(engine.board.cellAt(new SquareCoord(2, 0))?.value).toBe(4);
      expect(engine.state.score).toBe(4);
    });

    it('should_create_a_seeded_session_and_evaluate_high_score_progress_through_the_variant_factory', () => {
      // Arrange
      const factory = new MergeVariantFactory();
      const events: DomainEvent[] = [];
      const current = { ...emptyProgress('hexa-merge'), highScore: 256 };

      // Act
      const session = factory.createEngine({
        seed: 42,
        listeners: [(event) => events.push(event)],
      });
      session.applyMove({ direction: HexDirection.EAST });
      const progressModel = factory.createProgressModel();
      const beaten = progressModel.evaluate(current, {
        gameId: 'hexa-merge',
        levelId: null,
        reason: 'defeat',
        score: 512,
        moveCount: 30,
        durationMs: 45_000,
        seed: 42,
      });
      const tied = progressModel.evaluate(current, {
        gameId: 'hexa-merge',
        levelId: null,
        reason: 'defeat',
        score: 256,
        moveCount: 20,
        durationMs: 30_000,
        seed: 42,
      });

      // Assert
      expect(factory.gameId).toBe('hexa-merge');
      expect(factory.usesSeed).toBe(true);
      expect(factory.usesLevels).toBe(false);
      expect(events.some((event) => event.type === 'TileSpawned')).toBe(true);
      expect(() => factory.createEngine({ seed: null })).toThrow(RangeError);
      expect(beaten.isNewRecord).toBe(true);
      expect(beaten.progress?.highScore).toBe(512);
      expect(tied.isNewRecord).toBe(false);
      expect(tied.progress).toBeNull();
    });
  });
});
