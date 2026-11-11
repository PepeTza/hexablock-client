---
name: add-variant
description: Add a game variant to HexaBlock Suite without modifying the generic engine, following docs/EXTENSIBILITY.md. Use when building any of the four variants, Hexa Quest, or rehearsing "add a fifth variant" for the defence.
---

# Add a variant

The rule of [`docs/EXTENSIBILITY.md`](../../../docs/EXTENSIBILITY.md) §1:

> A new variant = **new classes + one line in the factory registry**.
> The engine, the use cases and the other variants are not modified.

## 1. Plan it (gate 1)

Fill the mapping table of `EXTENSIBILITY.md` §3 for the new variant: for each
extension point, say whether it is **new** or **reused** and which class.
List the files you will create and confirm the list of files you will **not**
touch.

## 2. Domain — `src/domain/variants/<variant>/`

| Extension point | Required |
|---|---|
| Cell type `TCell` | Yes (or reuse `Color`, `ColorStack`, `Tile`, `PieceId`) |
| Move `TMove` | Yes (or reuse an existing move) |
| State `TState extends GameState` | Yes |
| Rules `extends BaseGameRules<TCell, TMove, TState>` | Yes |
| Scoring `IScoringPolicy<TState>` | Only if no existing policy fits |
| Progress `IProgressModel` | Only if no existing model fits |
| Piece source `IPieceSource<TPiece>` | Only if no existing source fits |
| Undo (`IUndoable` on the state) | Optional |
| Levels (`LevelSpec` + `ILevelValidator`) | Only if level-based (see `design-level`) |
| Factory `VariantFactory<TCell, TMove, TState>` | Yes |

The rules implement the Template Method steps: `validate`, `apply`, `resolve`,
`evaluateEnd`. Name every pattern in the class doc comment
(`/** Strategy: ... */`).

## 3. Presentation — `src/adapters/presentation/variants/<variant>/`

- `ICellRenderer<TCell>`: how a cell is drawn.
- `IInputMapper<TMove>`: how a gesture becomes a move (drag or swipe mapper
  may be reused).
- `VariantPresentationFactory` for the variant.

## 4. Register — the only lines outside the variant's folders

In `src/frameworks/composition-root.ts`:

```ts
registry.register('<game-id>', new <Variant>Factory());
presentation.register('<game-id>', new <Variant>PresentationFactory());
```

Plus the variant in the menu configuration.

## 5. Check

- [ ] `git diff --stat main` shows changes only in the variant's folders, the
      composition root and the menu configuration.
- [ ] The lint boundaries pass: the variant imports only `engine/`, never
      another variant.
- [ ] One test file per new class (`aaa-test` skill), coverage ≥ 80 %.
- [ ] No `if` or `switch` on `gameId` anywhere in the engine or the screens.
- [ ] `EXTENSIBILITY.md` still describes the steps accurately; update it in
      the same PR if not.
