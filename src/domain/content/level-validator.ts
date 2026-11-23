import type { LevelDefinition } from './level-definition';

export interface ILevelValidationError {
  readonly field: string;
  readonly message: string;
}

export type LevelValidationResult<TSolution = unknown> =
  | { readonly valid: true; readonly solution?: TSolution }
  | {
      readonly valid: false;
      readonly errors: readonly ILevelValidationError[];
    };

/** Variant validator port for supported schemas and playability checks (RN-13, CU-17). */
export interface ILevelValidator<TSolution = unknown> {
  readonly validate: (
    level: LevelDefinition,
  ) => LevelValidationResult<TSolution>;
}
