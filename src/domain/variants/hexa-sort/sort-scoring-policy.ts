import type { IScoringPolicy } from '../../engine/scoring/scoring-policy';
import type { SortResolution } from './resolve-cascade';

/**
 * Strategy: Hexa Sort points (RN-40). Each cleared chip is worth
 * `chipPoints`, and a cascade that completes k goals multiplies its points
 * by k. Chips are only cleared by goals, so no goal means no points.
 */
export class SortScoringPolicy implements IScoringPolicy<SortResolution> {
  constructor(private readonly chipPoints = 1) {}

  pointsFor({ chipsCleared, goals }: SortResolution): number {
    return this.chipPoints * chipsCleared * goals;
  }
}
