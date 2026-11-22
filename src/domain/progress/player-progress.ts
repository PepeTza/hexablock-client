/**
 * Open identifier for a game variant (for example `'hexa-lines'`, `'hexa-fit'`,
 * `'hexa-sort'`, `'hexa-merge'`). Kept as `string` rather than a closed union
 * so adding a fifth variant never modifies the engine or use cases (OCP,
 * RNF-01, docs/EXTENSIBILITY.md).
 */
export type GameId = string;

/** Saved progress for one level of a level-based variant (Hexa Fit, Hexa Sort). */
export interface LevelProgressEntry {
  readonly completed: boolean;
  readonly bestScore: number;
  readonly stars: number;
}

/**
 * Entity: a player's (or guest's) local progress for one variant (RN-33,
 * docs/domain-model.md). Progress only improves: `mergeProgress` keeps the
 * highest score, maximum stars and union of completed levels (RN-36).
 */
export interface PlayerProgress {
  readonly gameId: GameId;
  readonly highScore: number;
  readonly levels: Readonly<Record<string, LevelProgressEntry>>;
}

/** Initial progress for a variant before any game has been played. */
export function emptyProgress(gameId: GameId): PlayerProgress {
  return { gameId, highScore: 0, levels: {} };
}

/**
 * Merges two progress snapshots for the same variant, keeping the best high
 * score, best level score, maximum stars and union of completed levels
 * (RN-36). Throws if they belong to different variants.
 */
export function mergeProgress(
  first: PlayerProgress,
  second: PlayerProgress,
): PlayerProgress {
  if (first.gameId !== second.gameId) {
    throw new RangeError(
      `Cannot merge progress from different variants: ${first.gameId} and ${second.gameId}`,
    );
  }
  const mergedLevels: Record<string, LevelProgressEntry> = {};
  const levelIds = new Set([
    ...Object.keys(first.levels),
    ...Object.keys(second.levels),
  ]);
  for (const levelId of levelIds) {
    const a = first.levels[levelId];
    const b = second.levels[levelId];
    if (a !== undefined && b !== undefined) {
      mergedLevels[levelId] = {
        completed: a.completed || b.completed,
        bestScore: Math.max(a.bestScore, b.bestScore),
        stars: Math.max(a.stars, b.stars),
      };
    } else if (a !== undefined) {
      mergedLevels[levelId] = { ...a };
    } else if (b !== undefined) {
      mergedLevels[levelId] = { ...b };
    }
  }
  return {
    gameId: first.gameId,
    highScore: Math.max(first.highScore, second.highScore),
    levels: mergedLevels,
  };
}
