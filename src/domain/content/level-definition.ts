import type { GameId } from '../progress/player-progress';

type JsonValue =
  string | number | boolean | null | LevelSpec | readonly JsonValue[];

/** Variant-specific JSON. Its fields are defined by the game and schema version. */
export type LevelSpec = Readonly<{ [key: string]: JsonValue }>;

/** Entity: the immutable definition of a published level, identified by id (RN-37). */
export interface LevelDefinition {
  readonly id: string;
  readonly gameId: GameId;
  readonly order: number;
  readonly schemaVersion: number;
  readonly publishedAt: string;
  readonly spec: LevelSpec;
}
