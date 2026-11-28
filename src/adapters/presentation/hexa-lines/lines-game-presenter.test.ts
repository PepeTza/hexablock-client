import { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import type { AsyncCommandService } from '@application/use-cases/use-case';
import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import { GameEngine } from '@domain/engine/game/game-engine';
import { Axis } from '@domain/engine/geometry/axis';
import { FixedPieceSource } from '@domain/engine/pieces/fixed-piece-source';
import { Piece } from '@domain/engine/pieces/piece';
import {
  PieceShape,
  type PieceGeometry,
} from '@domain/engine/pieces/piece-shape';
import type { IPieceSource } from '@domain/engine/pieces/piece-source';
import { Snapshot } from '@domain/engine/state/snapshot';
import type { FinishedGameSummary } from '@domain/progress/progress-model';
import {
  LinesGameRules,
  type LinesGameState,
  type PlacePieceMove,
} from '@domain/variants/hexa-lines/lines-game';
import { LinesScoringPolicy } from '@domain/variants/hexa-lines/lines-scoring-policy';
import type { LineCleared } from '@domain/variants/hexa-lines/resolve-lines';

import { LinesGamePresenter } from './lines-game-presenter';

describe('LinesGamePresenter', () => {
  it('should_preview_and_place_pieces_when_driven_by_a_non_hexagonal_coordinate', () => {
    // Arrange
    const left = { column: 0, key: () => '0' };
    const right = { column: 1, key: () => '1' };
    const axis = new Axis('row');
    const geometry: PieceGeometry<typeof left> = {
      origin: left,
      directions: [],
      axes: [axis],
      rotationSteps: 1,
      neighbour: () => {
        throw new RangeError('No directions');
      },
      neighbours: () => [],
      line: (coord, _axis, isInside) =>
        isInside(coord) ? [left, right].filter(isInside) : [],
      ring: (centre, radius) => (radius === 0 ? [centre] : []),
      translate: (_coord, _from, to) => to,
      rotate: (coord) => coord,
    };
    const unit = Piece.of(PieceShape.of('unit', [left], geometry));
    const source: IPieceSource<Piece<typeof left>> = new FixedPieceSource([
      unit,
      unit,
      unit,
    ]);
    const board = new Board<string, typeof left>(
      BoardShape.of([left, right]),
      geometry,
    );
    const state: LinesGameState<typeof left> = {
      moveCount: 0,
      score: 0,
      streak: 0,
      tray: source.draw(2),
      source: Snapshot.of(source),
    };
    const game = GameEngine.start<
      string,
      typeof left,
      PlacePieceMove<typeof left>,
      LinesGameState<typeof left>,
      LineCleared<typeof left>
    >({
      board,
      state,
      rules: new LinesGameRules(new LinesScoringPolicy(), 2, 'teal'),
      seed: 7,
    });
    const finishGame: AsyncCommandService<
      FinishedGameSummary,
      FinishGameOutput
    > = {
      execute: () => Promise.resolve(Either.left(new Error('not finished'))),
    };
    const presenter = new LinesGamePresenter(game, finishGame, () => 100);

    // Act
    const preview = presenter.preview(0, left);
    const placed = presenter.place(0, left);

    // Assert
    expect(preview).toEqual({
      valid: true,
      cells: [left],
      clearing: [],
    });
    expect(placed).toBe(true);
    expect(presenter.view.board[0]?.occupied).toBe(true);
    expect(presenter.view.score).toBe(1);
  });
});
