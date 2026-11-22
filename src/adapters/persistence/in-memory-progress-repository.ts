import type { IProgressRepository } from '@application/ports/progress-repository';
import type { GameId, PlayerProgress } from '@domain/progress/player-progress';

/**
 * Temporary in-memory `IProgressRepository` adapter used until HU29 (#40,
 * SQLite) replaces it in the composition root.
 */
export class InMemoryProgressRepository implements IProgressRepository {
  private readonly entries = new Map<GameId, PlayerProgress>();

  findByGame(gameId: GameId): Promise<PlayerProgress | null> {
    return Promise.resolve(this.entries.get(gameId) ?? null);
  }

  save(progress: PlayerProgress): Promise<void> {
    this.entries.set(progress.gameId, progress);
    return Promise.resolve();
  }
}
