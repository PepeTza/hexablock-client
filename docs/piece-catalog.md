# Piece catalog

The shapes of the pieces of Hexa Lines and Hexa Fit (RN-03, D-07). The data
the game loads is
[`src/domain/engine/hex/hex-pieces.json`](../src/domain/engine/hex/hex-pieces.json);
this page draws every shape so the team can see them and change the
selection.

## How to read a shape

- Hexagons are pointy-top (D-21); each row is shifted half a cell from the
  one above.
- `◉` is the centre of the piece, cell `[0, 0]`: the piece turns around it.
  `●` is any other cell.
- `cells` lists axial `[q, r]` pairs relative to the centre, as they appear
  in the JSON.
- The centre is the cell closest to all the others, so a piece turns almost
  in place under the player's finger.

## What is in the catalog

- **Every shape of 1 to 4 cells: 15.** Pieces turn but never flip (RN-03), so
  a shape and its mirror image are two different pieces. Counted that way
  there are exactly 1, 1, 3 and 10 shapes of 1, 2, 3 and 4 cells.
- **6 of the 33 shapes of 5 cells**, chosen for variety: a straight line, a
  long hook, a branched shape, a compact one, an arc and a Y.

The tests check both points: the catalog rejects two shapes that are the same
shape turned, so having the counts 1, 1, 3 and 10 proves that every shape of
up to 4 cells is there.

## How to change the 5-cell selection

The 27 shapes of 5 cells that are not in the catalog are listed at the end,
ready to copy. To replace one (for example after testing Hexa Lines):

1. In `hex-pieces.json`, replace the entry of the shape to remove with the
   `id` and `cells` of the new one, copied from this page.
2. Update the lists "In the catalog" and "Alternatives" of this page.
3. Run `npm test`. A mistyped shape (cells not joined, centre missing, a
   repeated cell, or a shape that duplicates another one turned) fails with a
   message that names the entry.
4. If the number of 5-cell shapes changes, update the test
   `should_have_6_shapes_when_size_is_5` and D-07 in `architecture.md`.

Keep the ids: Hexa Fit levels and the Hexa Lines spawn weights refer to
shapes by id. A shape that is removed should not have its id reused.

## Source

The 48 shapes (15 of up to 4 cells and 33 of 5 cells) were enumerated by
growing every shape one cell at a time and keeping one copy per shape up to
rotation. The counts match the one-sided polyhexes of the On-Line
Encyclopedia of Integer Sequences,
[A006534](https://oeis.org/A006534) (1, 1, 3, 10, 33, ...).

## In the catalog (21)

### 1 cell (1)

#### `p1-01`

```
◉
```

`"cells": [[0, 0]]`

### 2 cells (1)

#### `p2-01`

```
 ◉
●
```

`"cells": [[0, 0], [-1, 1]]`

### 3 cells (3)

#### `p3-01`

```
   ●
● ◉
```

`"cells": [[0, 0], [1, -1], [-1, 0]]`

#### `p3-02`

```
  ●
 ◉
●
```

`"cells": [[0, 0], [1, -1], [-1, 1]]`

#### `p3-03`

```
 ◉
● ●
```

`"cells": [[0, 0], [-1, 1], [0, 1]]`

### 4 cells (10)

#### `p4-01`

```
     ●
● ◉ ●
```

`"cells": [[0, 0], [2, -1], [-1, 0], [1, 0]]`

#### `p4-02`

```
    ●
 ◉ ●
●
```

`"cells": [[0, 0], [2, -1], [1, 0], [-1, 1]]`

#### `p4-03`

```
   ●
● ◉
 ●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [-1, 1]]`

#### `p4-04`

```
   ●
● ◉
   ●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [0, 1]]`

#### `p4-05`

```
   ●
● ◉ ●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [1, 0]]`

#### `p4-06`

```
    ●
   ◉
● ●
```

`"cells": [[0, 0], [1, -1], [-2, 1], [-1, 1]]`

#### `p4-07`

```
   ●
  ◉
 ●
●
```

`"cells": [[0, 0], [1, -1], [-1, 1], [-2, 2]]`

#### `p4-08`

```
 ●
◉
 ●
●
```

`"cells": [[0, 0], [1, -1], [0, 1], [-1, 2]]`

#### `p4-09`

```
 ●
◉
 ● ●
```

`"cells": [[0, 0], [1, -1], [0, 1], [1, 1]]`

#### `p4-10`

```
 ●
◉ ●
 ●
```

`"cells": [[0, 0], [1, -1], [1, 0], [0, 1]]`

### 5 cells (6)

#### `p5-01`

```
       ●
● ● ◉ ●
```

`"cells": [[0, 0], [2, -1], [-2, 0], [-1, 0], [1, 0]]`

#### `p5-07`

```
     ●
●   ◉
 ● ●
```

`"cells": [[0, 0], [1, -1], [-2, 0], [-2, 1], [-1, 1]]`

#### `p5-16`

```
   ●
● ◉ ●
 ●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [1, 0], [-1, 1]]`

#### `p5-22`

```
    ●
   ●
  ◉
 ●
●
```

`"cells": [[0, 0], [2, -2], [1, -1], [-1, 1], [-2, 2]]`

#### `p5-26`

```
  ●
 ◉
● ● ●
```

`"cells": [[0, 0], [1, -1], [-1, 1], [0, 1], [1, 1]]`

#### `p5-33`

```
  ●
 ◉ ●
● ●
```

`"cells": [[0, 0], [1, -1], [1, 0], [-1, 1], [0, 1]]`

## Alternatives: 5 cells not in the catalog (27)

#### `p5-02`

```
      ●
 ● ◉ ●
●
```

`"cells": [[0, 0], [2, -1], [-1, 0], [1, 0], [-2, 1]]`

#### `p5-03`

```
     ●
● ◉ ●
 ●
```

`"cells": [[0, 0], [2, -1], [-1, 0], [1, 0], [-1, 1]]`

#### `p5-04`

```
     ●
● ◉ ●
   ●
```

`"cells": [[0, 0], [2, -1], [-1, 0], [1, 0], [0, 1]]`

#### `p5-05`

```
     ●
● ● ◉
     ●
```

`"cells": [[0, 0], [1, -1], [-2, 0], [-1, 0], [0, 1]]`

#### `p5-06`

```
     ●
● ● ◉ ●
```

`"cells": [[0, 0], [1, -1], [-2, 0], [-1, 0], [1, 0]]`

#### `p5-08`

```
      ●
   ◉ ●
● ●
```

`"cells": [[0, 0], [2, -1], [1, 0], [-2, 1], [-1, 1]]`

#### `p5-09`

```
     ●
  ◉ ●
 ●
●
```

`"cells": [[0, 0], [2, -1], [1, 0], [-1, 1], [-2, 2]]`

#### `p5-10`

```
    ●
 ◉ ●
●
 ●
```

`"cells": [[0, 0], [2, -1], [1, 0], [-1, 1], [-1, 2]]`

#### `p5-11`

```
    ●
 ◉ ●
● ●
```

`"cells": [[0, 0], [2, -1], [1, 0], [-1, 1], [0, 1]]`

#### `p5-12`

```
    ●
 ● ◉
●   ●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [-2, 1], [0, 1]]`

#### `p5-13`

```
   ●
● ◉
 ●
●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [-1, 1], [-2, 2]]`

#### `p5-14`

```
   ●
● ◉
 ● ●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [-1, 1], [0, 1]]`

#### `p5-15`

```
   ●
● ◉
   ●
  ●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [0, 1], [-1, 2]]`

#### `p5-17`

```
   ●
● ◉ ●
     ●
```

`"cells": [[0, 0], [1, -1], [-1, 0], [1, 0], [1, 1]]`

#### `p5-18`

```
   ●
●   ◉
 ● ●
```

`"cells": [[0, 0], [0, -1], [-2, 0], [-2, 1], [-1, 1]]`

#### `p5-19`

```
      ●
     ●
● ● ◉
```

`"cells": [[0, 0], [2, -2], [1, -1], [-2, 0], [-1, 0]]`

#### `p5-20`

```
    ●
   ●
● ◉
 ●
```

`"cells": [[0, 0], [2, -2], [1, -1], [-1, 0], [-1, 1]]`

#### `p5-21`

```
     ●
    ●
   ◉
● ●
```

`"cells": [[0, 0], [2, -2], [1, -1], [-2, 1], [-1, 1]]`

#### `p5-23`

```
  ●
 ●
◉
 ●
●
```

`"cells": [[0, 0], [2, -2], [1, -1], [0, 1], [-1, 2]]`

#### `p5-24`

```
  ●
 ◉
●
 ● ●
```

`"cells": [[0, 0], [1, -1], [-1, 1], [-1, 2], [0, 2]]`

#### `p5-25`

```
  ●
 ◉
● ●
 ●
```

`"cells": [[0, 0], [1, -1], [-1, 1], [0, 1], [-1, 2]]`

#### `p5-27`

```
   ●
  ◉
   ●
● ●
```

`"cells": [[0, 0], [1, -1], [0, 1], [-2, 2], [-1, 2]]`

#### `p5-28`

```
 ●
●
 ◉
● ●
```

`"cells": [[0, 0], [1, -2], [0, -1], [-1, 1], [0, 1]]`

#### `p5-29`

```
 ●
●
 ◉
  ●
 ●
```

`"cells": [[0, 0], [1, -2], [0, -1], [0, 1], [-1, 2]]`

#### `p5-30`

```
 ●
●
 ◉
  ● ●
```

`"cells": [[0, 0], [1, -2], [0, -1], [0, 1], [1, 1]]`

#### `p5-31`

```
 ●
●
 ◉ ●
  ●
```

`"cells": [[0, 0], [1, -2], [0, -1], [1, 0], [0, 1]]`

#### `p5-32`

```
  ●
 ◉ ●
●
 ●
```

`"cells": [[0, 0], [1, -1], [1, 0], [-1, 1], [-1, 2]]`
