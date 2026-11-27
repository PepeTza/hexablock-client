import type { ICoord } from '../../engine/geometry/coord';
import type { IScoringPolicy } from '../../engine/scoring/scoring-policy';
import type { MergeResolution } from './merge-tiles';

/**
 * Strategy: Hexa Merge points (RN-29). A move is worth the sum of the values
 * its merges produced, so a slide without merges gives no points. The final
 * values of RN-29 are still open (D-08); changing them changes only this
 * class.
 */
export class MergeScoringPolicy<
  TCoord extends ICoord,
> implements IScoringPolicy<MergeResolution<TCoord>> {
  pointsFor({ merges }: MergeResolution<TCoord>): number {
    return merges.reduce((sum, merge) => sum + merge.value, 0);
  }
}
