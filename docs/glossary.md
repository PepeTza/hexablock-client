# Glossary (ubiquitous language)

The shared vocabulary of the project (DDD *ubiquitous language*). The
**Code** column is the name used in code, diagrams and English docs; the
**Spanish** column is the word the team uses when talking. Use these names and
no synonyms: if a concept is missing, add it here first.

## Variants and board

| Code | Spanish | Meaning in the project |
|---|---|---|
| Variant (`gameId`) | Variante | Each of the four games: `hexa-lines`, `hexa-fit`, `hexa-sort`, `hexa-merge` |
| Board | Tablero | The grid where the game is played; its cell shape comes from the geometry (hexagonal today) |
| Board shape | Forma del tablero | Hexagon of radius 4 or 2, or a free-form figure (Fit) |
| Figure | Figura | In Hexa Fit, the set of cells that must be covered |
| Cell | Celda | One hexagonal slot of the board |
| Coord | Coordenada | The position of a cell: two integers interpreted by the geometry (axial coordinates `q, r` on the hex board) |
| Board geometry | Geometría del tablero | Defines neighbourhood, axes and rotation of cells; hexagonal today |
| Neighbor | Vecina | An adjacent cell (up to six) |
| Direction | Dirección | One of the six neighbourhood directions |
| Axis | Eje | One of the three line orientations |
| Line | Línea | A full row of cells along an axis |

## Pieces and tray

| Code | Spanish | Meaning in the project |
|---|---|---|
| Piece | Pieza | A group of 1 to 5 connected cells (Lines and Fit) |
| Piece catalog | Catálogo de piezas | The configurable list of piece shapes |
| Tray | Bandeja | The pieces or stacks offered to the player |
| Stack | Pila | In Hexa Sort, the coloured chips stacked on a cell |
| Chip | Ficha (Sort) | Each coloured chip of a stack |
| Tile | Ficha (Merge) | Each numbered tile of Hexa Merge |

## Moves and resolution

| Code | Spanish | Meaning in the project |
|---|---|---|
| Move | Movimiento | Any player action that changes the game |
| Placement | Colocación | Putting a piece or stack on the board |
| Removal | Retiro | Returning a placed piece to the tray (Fit) |
| Relocation | Reubicación | Moving a placed piece to another position (Fit) |
| Rotation | Rotación | Turning a piece 60° (Fit) |
| Slide | Deslizamiento | Moving all tiles in one direction (Merge) |
| Resolution | Resolución | What happens after a move |
| Line clear | Eliminación de línea | Removing a full line (Lines) |
| Combo | Combo | Several lines cleared in the same move |
| Streak | Racha | Consecutive moves that clear lines |
| Cascade | Cascada | A chain of transfers between stacks (Sort) |
| Transfer | Transferencia | Moving chips from one stack to another (Sort) |
| Merge | Fusión | Two equal tiles joining into one of double value (Merge) |
| Goal | Meta | A cleared stack of 10 chips (Sort) |
| Undo / Redo | Deshacer / Rehacer | Reverting or repeating moves |

## Game and progress

| Code | Spanish | Meaning in the project |
|---|---|---|
| Game session | Partida | One game from start to end |
| Game over | Fin de partida | The game ends, with victory or defeat |
| Victory / Defeat | Victoria / Derrota | The two ways a game ends |
| Score | Puntaje | The points of a game or level |
| High score | Puntaje máximo | The best score in Lines and Merge |
| Level | Nivel | A pre-designed challenge (Fit and Sort) |
| Star threshold | Umbral de estrellas | The score needed for 2 or 3 stars (Fit) |
| Unlock | Desbloqueo | Enabling the next level |
| Seed | Semilla | The number that fixes the "random" sequence of a game |
| Seed mode | Modo de semilla | Fixed or random |

## Users and platform

| Code | Spanish | Meaning in the project |
|---|---|---|
| Guest / Player | Invitado / Jugador | Plays without an account / with an account |
| Administrator | Administrador | Manages levels and seeds |
| Admin panel | Panel de administración | The web app for the administrator, in the client repo (`admin/`) |
| Level editor | Editor de niveles | The part of the panel where levels are created |
| Leaderboard | Ranking | The score ranking |
| Sync | Sincronización | Sending local progress to the server |
