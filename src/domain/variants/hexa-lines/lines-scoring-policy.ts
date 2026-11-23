import type { IScoringPolicy } from '../../engine/scoring/scoring-policy';

export interface LinesResolution {
  readonly cellsPlaced: number;
  readonly linesCleared: number;
  readonly streak: number;
}

/** Strategy: award placement points and the D-08 combo and streak bonus. */
export class LinesScoringPolicy implements IScoringPolicy<LinesResolution> {
  constructor(
    private readonly cellPoints = 1,
    private readonly linePoints = 10,
  ) {}

  pointsFor({ cellsPlaced, linesCleared, streak }: LinesResolution): number {
    const placementPoints = this.cellPoints * cellsPlaced;
    if (linesCleared === 0) {
      return placementPoints;
    }

    // D-08 proposal: https://github.com/PepeTza/hexablock-client/issues/31#issuecomment-6998461493
    const streakMultiplier = 1 + 0.5 * (streak - 1);
    return (
      placementPoints + this.linePoints * linesCleared ** 2 * streakMultiplier
    );
  }
}
