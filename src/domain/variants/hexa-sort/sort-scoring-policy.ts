import type { IScoringPolicy } from '../../engine/scoring/scoring-policy';
import type { SortResolution } from './resolve-cascade';

/**
 * Strategy: Hexa Sort points (RN-40). One point per cleared chip; chips are
 * only cleared when a stack of ten is removed, which arrives in HU21 (#73)
 * together with the multiplier for several goals in one cascade.
 */
export class SortScoringPolicy implements IScoringPolicy<SortResolution> {
  constructor(private readonly chipPoints = 1) {}

  pointsFor({ chipsCleared }: SortResolution): number {
    return this.chipPoints * chipsCleared;
  }
}
