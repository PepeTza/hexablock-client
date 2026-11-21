/**
 * Strategy: how many points a move gives (RF-04). Each variant has its own
 * policy (RN-10, RN-29, RN-40 and D-08), and changing it changes neither the
 * rules nor the engine.
 *
 * `TResolution` is what happened in the move, as the rules of the variant
 * describe it: for example the cells placed, the lines cleared and the
 * streak in Hexa Lines, or the merged values in Hexa Merge. Only the rules
 * and their policy know its shape; the engine never sees it.
 */
export interface IScoringPolicy<TResolution> {
  pointsFor(resolution: TResolution): number;
}
