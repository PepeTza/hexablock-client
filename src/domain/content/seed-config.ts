/** How a game's seed is chosen when a session starts (RN-05, D-15). */
export type SeedMode = 'random' | 'fixed';

/**
 * Value object / Entity data: seed configuration for a variant or a Hexa Sort
 * level (RN-05, docs/domain-model.md). The discriminated union enforces the
 * invariant at compile time: when `mode` is `'fixed'`, a `value` is required.
 */
export type SeedConfig =
  | { readonly mode: 'random' }
  | { readonly mode: 'fixed'; readonly value: number };
