# Hexa Sort: the cascade

How a placement is resolved in Hexa Sort (RN-20, RN-21, RN-22), with worked
examples. The code is in
[`src/domain/variants/hexa-sort/`](../../src/domain/variants/hexa-sort/).

## 1. Terms

- **Stack:** the coloured chips on one cell, listed bottom to top. Colours are
  integer indexes (`0..colors-1`), as in the level spec (API contract §6).
- **Top run:** the contiguous chips of the same colour on top of a stack.
  In `[B, R, R]` the top colour is `R` and the top run is 2.
- **Transfer:** a stack moves its whole top run onto another stack whose top
  has the same colour. A stack left with no chips disappears.

## 2. The algorithm

After the tray stack is placed on an empty cell (RN-20), a queue starts with
that cell:

1. Take a cell from the queue. If it is empty, skip it. If its top run
   already reaches the goal size, remove it as in step 6 and skip it: a
   source can expose such a run when the goal size is lower than a stack.
2. **Group:** the cell itself, then its neighbours in the order the board
   geometry lists them, keeping only those whose top has the same colour.
3. If the group has only the cell, continue with the next cell.
4. **Target:** the stack of the group with the longest top run. On a tie,
   the first one in the group wins: the resolving cell, then its neighbours
   in the geometry's order (RN-22).
5. Every other stack of the group moves its top run onto the target. Each
   source goes back to the queue, because its top changed.
6. **Goal (RN-23):** once the whole group has moved, if the target's top run
   is 10 or more (`DEFAULT_CLEAR_AT`), the whole target stack is removed,
   chips under the run included, and counts as a goal. Otherwise the target
   goes back to the queue.
7. Repeat until the queue is empty: the board is stable.

Each transfer emits a `StackMerged` event (`from`, `to`, `color`, `count`)
and each goal a `GoalCompleted` event (`at`, `color`, `chips`) for the
screen.

**Points (RN-40):** every chip of a removed stack is worth 1 point, and a
cascade that completes k goals multiplies its points by k. The game state
keeps the goals completed so far (`goals`) for the screen's counter.

**Why it always ends:** a transfer joins the source's top run with the
target's top run, so the total number of runs on the board drops by one with
every transfer, and a removal takes the removed stack's runs off the board.
The number of runs is finite, so the steps are too.

## 3. Worked examples

On hexagons the geometry lists the neighbours clockwise from the east:
E, SE, SW, W, NW, NE. `R`, `B` and `G` are three colours.

### Example 1: one transfer

| Cell | Before | After |
|---|---|---|
| centre (placed) | `[R, R]` | empty |
| east | `[B, R, R, R]` | `[B, R, R, R, R, R]` |

The group is centre and east. East has the longer top run (3 against 2), so
the centre's two reds move onto it and the centre disappears.

### Example 2: a chain

| Cell | Before | After the 1st transfer | After the 2nd |
|---|---|---|---|
| centre (placed) | `[B, B]` | `[B, B, B]` | `[B, B, B]` |
| east | `[G, B]` | `[G]` | empty |
| far east | `[G, G]` | `[G, G]` | `[G, G, G]` |

1. Centre and east share blue on top. The centre's run is longer (2 against
   1), so east's blue moves to the centre. East now shows green.
2. East goes back to the queue; its group is east and far east, both green.
   Far east is longer (2 against 1), so east's green moves there and east
   disappears.

### Example 3: a tie

| Cell | Before | After |
|---|---|---|
| centre (placed) | `[R]` | empty |
| south-east | `[G, R, R, R]` | `[G, R, R, R, R, R, R, R]` |
| west | `[B, R, R, R]` | `[B]` |

South-east and west both have a top run of 3. South-east comes first in the
geometry's order (E, **SE**, SW, **W**, ...), so it is the target and
receives the centre's red and west's three reds. If the centre had tied too,
the centre would have won, because the resolving cell always comes first.

### Example 4: a goal

| Cell | Before | After |
|---|---|---|
| centre (placed) | `[R, R]` | empty |
| east | `[B, B, B, R×8]` | empty (goal) |

East has the longer top run (8 against 2), so the centre's two reds move
onto it. East's top run is now 10, so the whole stack is removed, with its
three blues: one goal and 13 cleared chips, worth 13 points.

Only the top run counts: `[R×6, B, B, R×4]` holds ten reds, but its top run
is four, so it stays.

### Example 5: two goals in one cascade

| Cell | Before | After the 1st step | After the 2nd |
|---|---|---|---|
| centre (placed) | `[B×9]` | empty (goal) | empty |
| east | `[G×5, B]` | `[G×5]` | empty (goal) |
| far east | `[G×5]` | `[G×5]` | empty |

1. East's blue joins the centre's nine: ten blues, so the centre is removed.
   East now shows five greens.
2. East and far east tie at five; east is the resolving cell, so it wins and
   reaches ten greens: removed too.

Two goals and 20 cleared chips in one cascade score 20 × 2 = 40 points.

## 4. Other cell shapes (OCP)

The rules and the cascade use only `neighbours()` and `key()` of the board
geometry. They never read hexagonal coordinates, so the same code runs on
squares or triangles:

- `createSortGame` receives the geometry (`IBoardGeometry<TCoord>`) and the
  board figure (`BoardShape<TCoord>`) from outside (DIP).
- `createHexSortGame` is the only place that builds hexagons, from the
  level's radius (default 2, as the level spec v1 requires).
- Another shape adds its geometry and a function like `createHexSortGame`;
  nothing in Hexa Sort or the engine changes. `sort-game.test.ts` proves it
  by playing on a square board with four neighbours per cell.

With squares the tie-break follows the square geometry's own neighbour order,
so RN-22 holds without change.

## 5. Not yet implemented

- Victory and defeat (RN-24): #82.
- A goal size per level: the level spec v1 (API contract §6) has no field
  for it, so every level uses `DEFAULT_CLEAR_AT`. Adding one changes the
  contract.

The goal decisions of #73 (top run only, every chip of the stack scores,
checked after each step) are in RN-23 and RN-40.

## 6. Known duplication

`SortStackSource` checks the tray limits of the level spec (2 to 8 colours,
heights 1 to 9) with its own constants, as the backend does in
`plausibility-limits.ts`. If the spec changes those limits, both places must
change; the API contract (§6) is the source of truth.

The backend's score plausibility check (`plausibility-limits.ts`) assumes
RN-40's 1 point per chip. `SortScoringPolicy` takes the chip value as
configuration, so raising it means raising that limit too, or honest scores
are rejected.
