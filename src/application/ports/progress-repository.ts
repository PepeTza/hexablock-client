import type { GameId, PlayerProgress } from '@domain/progress/player-progress';

/**
 * Port (DIP): loads and persists a player's progress per variant (RN-33,
 * CU-01, CU-07, CU-08). Implemented locally (SQLite, D-06) and remotely in
 * layer 3.
 */
export interface IProgressRepository {
  findByGame(gameId: GameId): Promise<PlayerProgress | null>;
  save(progress: PlayerProgress): Promise<void>;
}
