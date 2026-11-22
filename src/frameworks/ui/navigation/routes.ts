import type { GameId } from '@domain/progress/player-progress';

/** Route parameter map for the main React Navigation native stack (D-20). */
export type RootStackParamList = {
  Home: undefined;
  Variant: { gameId: GameId; name: string };
  Settings: undefined;
};
