# Extensibility

How to add a fifth variant (and other extensions) to HexaBlock Suite
**without modifying the engine**. This is the guide behind requirement RNF-01
and user story HU10.

Related: [`architecture.md`](./architecture.md) (layers, patterns),
[`domain-model.md`](./domain-model.md) (aggregates) and the class diagram in
[`diagrams/`](./diagrams).

## 1. The rule

> A new variant = **new classes + one line in the factory registry**.
> The engine (`GameEngine`, `BaseGameRules`, `IGameRules`), the use cases and
> the other variants are not modified.

This works because the engine only knows abstractions (subtype polymorphism)
and every variant plugs in the same way (OCP, DIP).

## 2. Extension points

What a new variant **must** provide, and what it **can reuse**.

### Domain (layer 1)

| Extension point | Required | Can reuse |
|---|---|---|
| Cell type (`TCell`) | Yes | `Color`, `ColorStack`, `Tile`, `PieceId` if they fit |
| Move (`TMove`) | Yes | `PlacePieceMove`, `PlaceStackMove`, `SlideMove`, `FitMove` |
| State (`TState extends GameState`) | Yes | — |
| Rules (`extends BaseGameRules<TCell, TMove, TState>`) | Yes | — |
| Scoring (`IScoringPolicy<TState>`) | No | Any existing policy |
| Progress (`IProgressModel`) | No | `HighScoreProgress`, `LevelStarsProgress`, `LevelProgress` |
| Piece source (`IPieceSource<TPiece>`) | No | `RandomPieceSource`, `FixedPieceSource` |
| Undo (`IUndoable` on the state) | Optional | `CommandHistory`, `ApplyMoveCommand` |
| Levels (`LevelSpec` + `ILevelValidator`) | Only if level-based | `LevelBuilder`, `LevelDefinition` |
| Factory (`VariantFactory<TCell, TMove, TState>`) | Yes | — |

### Interface adapters (layer 3)

| Extension point | Required | Can reuse |
|---|---|---|
| `ICellRenderer<TCell>`: how a cell is drawn | Yes | A renderer of an existing cell type |
| `IInputMapper<TMove>`: how a gesture becomes a move (drag, tap, swipe) | Yes | Drag mapper (Lines, Fit, Sort) or swipe mapper (Merge) |

The variant's factory also provides its renderer and input mapper, so screens
never contain a `switch` on `gameId`. Their detailed design belongs to the
layer 3 class diagram.

### Registration (layer 4, composition root)

```ts
registry.register('hexa-lines', new HexaLinesFactory());
registry.register('hexa-fit',   new HexaFitFactory());
registry.register('hexa-sort',  new HexaSortFactory());
registry.register('hexa-merge', new HexaMergeFactory());
registry.register('hexa-quest', new HexaQuestFactory()); // the only line added outside the new folder
```

## 3. Worked example: Hexa Quest

A small turn-based RPG on a hex map, designed to show that the engine
supports a game unlike the four required variants. It is a **design example**
and an **optional extra**: it is implemented only if the four required
variants are finished and polished.

### The game

- The board is a map (a free-form figure, as in Hexa Fit).
- The player controls a hero, one hex. Other hexes are enemies, items and
  walls.
- The player moves the hero one step in one of the 6 directions.
- Moving onto another entity triggers an **interaction**, modelled as a merge:
  hero + potion = healed hero; hero + enemy = combat, the winner remains.
- After the hero moves, enemies take their turn.
- **Victory:** the hero reaches the exit. **Defeat:** the hero's health
  reaches 0.
- Levels (maps) are data, like Fit and Sort levels, with stars by score.

### Mapping to the engine

| Piece | Hexa Quest | New or reused |
|---|---|---|
| Board | Map as a free-form `BoardShape` | Reused |
| `TCell` | `Entity` (hero, enemy, item, wall) | **New** |
| `TMove` | `SlideMove` (one direction) | **Reused** from Merge |
| Interaction | `Entity implements IMergeable<Entity>` | Reuses the **bounded generic** of Merge |
| `TState` | `QuestState extends GameState`: hero health, turn, `levelId` | **New** |
| Rules | `HexaQuestRules<TEntity extends IMergeable<TEntity>> extends BaseGameRules<TEntity, SlideMove, QuestState>` | **New** |
| Enemy spawns | `RandomPieceSource<Entity>` with the seed | Reused |
| Scoring | `QuestScoringPolicy` (e.g. turns, health left, enemies defeated) | **New** |
| Progress | `LevelStarsProgress` | Reused from Fit |
| Levels | `QuestLevelSpec` + `QuestLevelValidator` (the exit is reachable) | **New**, built with the existing `LevelBuilder` |
| Undo | Not supported (the state does not implement `IUndoable`) | — |
| Cell renderer | `EntityRenderer implements ICellRenderer<Entity>` | **New** |
| Input | Swipe mapper | Reused from Merge |
| Factory | `HexaQuestFactory implements VariantFactory<Entity, SlideMove, QuestState>` | **New** |

### How the Template Method steps fit

| Step | Hexa Quest |
|---|---|
| `validate` | The target cell is inside the map and is not a wall |
| `apply` | Move the hero one step |
| `resolve` | Resolve the interaction (`mergeWith`), then the enemies' turn |
| `evaluateEnd` | Victory at the exit; defeat at 0 health |

### Files

**New** (all inside `src/domain/variants/hexa-quest/` and its adapter folder,
except the registry line):

| File | Content |
|---|---|
| `entity.ts` | `Entity` and its kinds, implementing `IMergeable<Entity>` |
| `quest-state.ts` | `QuestState extends GameState` |
| `hexa-quest-rules.ts` | `HexaQuestRules` |
| `quest-scoring-policy.ts` | `QuestScoringPolicy` |
| `quest-level-spec.ts` | `QuestLevelSpec` |
| `quest-level-validator.ts` | `QuestLevelValidator` |
| `hexa-quest-factory.ts` | `HexaQuestFactory` |
| `EntityRenderer.tsx` | `ICellRenderer<Entity>` |
| Tests | One test file per class above |
| Level files | The maps, as JSON |

**Modified:** one line in the composition root (`registry.register(...)`) and
the list of games in the menu configuration.

**Not touched:** `Board`, `HexGeometry`, `GameEngine`, `BaseGameRules`,
`IGameRules`, `CommandHistory`, every use case (`StartGameUseCase`,
`ApplyMoveUseCase`, ...), the aspects, the repositories, the API and the four
existing variants.

### Ideas to explore

- **No backtracking:** forbid moves that go back towards where the hero came
  from. It can be a rule inside `validate`, or a reusable rules decorator
  (see §4) applicable to any variant with directional moves.
- **Escalating difficulty:** challenges get harder as the hero advances, e.g.
  stronger enemies by distance or by turn, generated from the seed so runs
  stay reproducible.

## 4. Other planned extensions

| Extension | How | What is not touched |
|---|---|---|
| Time-limit mode, boosters or score multipliers for any variant | A **rules decorator**: a class that implements `IGameRules`, wraps another rules object and adds behaviour (e.g. `TimeLimitRulesDecorator`, `BonusMultiplierDecorator`). Decorators can be stacked | The engine and the decorated variant |
| A new piece shape | A new entry in the piece catalog (data) | All code |
| Another cell shape (e.g. squares) | A new `IBoardGeometry` implementation | `Board`, rules that use the geometry abstraction |
| Another scoring or progress model | A new `IScoringPolicy` / `IProgressModel`, selected by the factory | The engine and the use cases |
| Another database | See the backend [`data-model.md` §8](https://github.com/PepeTza/hexablock-backend/blob/main/docs/data-model.md) | Domain and use cases |

## 5. Extensibility diagram

To be drawn: the generic engine in the centre, the four variants (and Hexa
Quest, dashed) around it, with the extension points of §2 highlighted as the
interfaces a fifth variant implements. Image and editable source in
[`diagrams/`](./diagrams).
