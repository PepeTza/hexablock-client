import type { GameResultInput } from '@adapters/presentation/game-result/game-result-view-model';
import type { GameId } from '@domain/progress/player-progress';

/** Route parameter map for the main React Navigation native stack (D-20). */
export type RootStackParamList = {
  Home: undefined;
  Variant: { gameId: GameId; name: string; levelId?: string | null };
  Settings: undefined;
  GameResult: GameResultInput;
};
