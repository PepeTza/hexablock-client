import type { GameId } from '@domain/progress/player-progress';
import type { FinishedGameSummary } from '@domain/progress/progress-model';

/**
 * Port (DIP): queues deferred server operations (CU-07, CU-12, CU-13, RF-27)
 * so finishing a game never waits on the network.
 */
export interface ISyncQueue {
  enqueueProgressSync(gameId: GameId): Promise<void>;
  enqueueScoreSubmission(summary: FinishedGameSummary): Promise<void>;
}
