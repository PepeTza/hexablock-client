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

1. Take a cell from the queue. If it is empty, skip it.
2. **Group:** the cell itself, then its neighbours in the order the board
   geometry lists them, keeping only those whose top has the same colour.
3. If the group has only the cell, continue with the next cell.
4. **Target:** the stack of the group with the longest top run. On a tie,
   the first one in the group wins: the resolving cell, then its neighbours
   in the geometry's order (RN-22).
5. Every other stack of the group moves its top run onto the target. Each
   source and then the target go back to the queue, because their tops
   changed.
6. Repeat until the queue is empty: the board is stable.

Each transfer emits a `StackMerged` event (`from`, `to`, `color`, `count`)
for the screen.

**Why it always ends:** a transfer joins the source's top run with the
target's top run, so the total number of runs on the board drops by one with
every transfer. The number of runs is finite, so the transfers are too.

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

- Removing stacks of 10 or more chips of one colour and scoring them
  (RN-23, RN-40): #73. That issue also decides whether the trigger counts
  the top run or every chip of the colour in the stack, and which chips of a
  removed mixed stack score.
- Victory and defeat (RN-24): #82.

## 6. Known duplication

`SortStackSource` checks the tray limits of the level spec (2 to 8 colours,
heights 1 to 9) with its own constants, as the backend does in
`plausibility-limits.ts`. If the spec changes those limits, both places must
change; the API contract (§6) is the source of truth.
