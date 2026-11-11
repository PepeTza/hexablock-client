# Implementation Plan

How HexaBlock Suite goes from documentation to the final delivery on
**2026-12-14**: iterations, who owns what, the issues, the folder structure,
the setup task, how we work with AI agents and the decisions still open.

- Approved by the team on 2026-11-11.
- Completed work is recorded in [`harness/phase-log.md`](../harness/phase-log.md);
  the work itself is tracked in GitHub issues.
- Related: [`architecture.md`](./architecture.md),
  [`EXTENSIBILITY.md`](./EXTENSIBILITY.md),
  [`user-stories.md`](./user-stories.md) and the backend
  [`api-contracts.md`](https://github.com/PepeTza/hexablock-backend/blob/main/docs/api-contracts.md).

## 1. Iterations

Five weekly iterations and a four-day buffer. Feature freeze on 2026-12-10,
release `v1.0.0` on 2026-12-13, defence on 2026-12-14.

| Iteration | Dates | Goal | Scope | Done when |
|---|---|---|---|---|
| I0 Foundations | 11-11 → 11-15 | Projects ready, blocking decisions taken, rendering risk cleared | Setup of the app, the admin panel and the API; CI; branch protection; layer lint; `Coord`, `HexGeometry`, `Board<TCell>`; Skia spike; `/health`; decisions of §7 due by 11-15 | CI green on a PR in both repos; the app opens on a real Android phone; radius-4 board with a draggable piece at ~60 FPS; `/api/v1/health` answers against a local PostgreSQL |
| I1 Engine + Hexa Lines | 11-16 → 11-22 | Generic engine proven with a real variant | `GameEngine`, `BaseGameRules`, domain events, piece sources, scoring, seeded random, piece catalog, use cases + logging aspect, Hexa Lines, menu, result screens, local persistence. Backend: Prisma schema, auth, error format and Swagger, deployment from CI. Diagrams v1 | Hexa Lines playable end to end in the `v0.1.0` APK; engine coverage ≥ 80 %; backend deployed with `/auth/*` |
| I2 Merge + Fit core + API | 11-23 → 11-29 | Second and third variants; complete API | Command history, Hexa Merge, `LevelBuilder` and validators, Hexa Fit domain and screen, level `spec` schema frozen on 11-25. Backend: progress, scores, leaderboard, levels, seed config. Sort cascade rules started | Merge and Fit playable in `v0.2.0`; every endpoint of the contract deployed with e2e tests |
| I3 Sort + levels + admin panel | 11-30 → 12-06 | The four variants and their content | Hexa Sort, level selection, stars, 15 Fit and 10 Sort levels, sync queue, score submission, leaderboard, content refresh, admin panel (login, Fit and Sort editors, seed config), seed script, Pact | The four variants with all their levels in `v0.3.0`; a level published from the panel reaches the phone |
| I4 Freeze + polish | 12-07 → 12-10 | Product quality | Pause and background, audio, two languages, settings, three screen sizes, UI navigation test, bug bash, panel hosting | Feature freeze on 12-10; release candidate `v0.9.0` with no blocking bugs |
| Buffer | 12-11 → 12-14 | Delivery and defence | Final diagrams, both READMEs, `EXTENSIBILITY.md`, `AI_USAGE.md` critical evaluation, release `v1.0.0` (12-13), rehearsal of "add a fifth variant" | Every deliverable complete; 12-14 free for the defence |

### Critical path

1. Decisions due in I0 (Expo, piece catalog D-07)
2. `Coord` and `HexGeometry` → `Board<TCell>` → `GameEngine` and `BaseGameRules`
3. Hexa Lines (proves the engine)
4. Hexa Fit domain and level validator → level `spec` schema (11-25)
5. Fit level editor in the panel and the 15 Fit levels → final Fit screen
6. Release candidate on 12-10 → `v1.0.0`

- The level `spec` schema (11-25) joins three tracks: backend levels, admin
  panel and level design. If it slips, all three slip.
- If the Skia spike fails, the fallback is drawing with SVG (decided by 11-15).
- The backend is off the critical path while the contract does not change:
  the client uses fakes of its ports until I3.
- The APK pipeline is built in I1, so the final release is not a new problem
  on 12-13.

### What gets cut first

1. Hexa Quest and HU34 (started only if all of I3 is done on 12-06).
2. Extra aspects (leaderboard cache, Sort cascade profiling). Logging, session
   check and retries stay.
3. The candidate generator of the panel (D-09). The validator stays.
4. Online hosting of the panel: it runs locally at the defence.
5. Offline leaderboard cache (CU-14 A2) and fine animations.
6. Music (sound effects and mute stay). Part of RF-18: needs the team's
   agreement.

Never cut: the four variants, 15 Fit and 10 Sort levels, the generic engine
and its patterns, at least one aspect, the deployed backend, ≥ 80 % coverage,
the APK release, the documentation and the diagrams. Pact (D-05) is cut only
if the team changes D-05.

## 2. Work split

Every participant owns at least one variant end to end: domain, tests, screen
and, for level-based variants, its editor in the admin panel. With four
variants and three people, one track takes two variants and less
infrastructure.

| Track | Owner | Variants | Cross-cutting area |
|---|---|---|---|
| A — Engine, Merge & connectivity | Ronald Gómez | Hexa Merge | Engine (geometry, `Board`, `GameEngine`, `BaseGameRules`, events, random, piece sources, scoring, catalog, command history), layer lint, use cases and logging aspect, menu and result screens; in the app: login, sync, score submission, leaderboard, content refresh; pause, screen sizes, languages; `EXTENSIBILITY.md` |
| B — Lines, Fit & presentation | Jesus Obando | Hexa Lines, Hexa Fit | App setup, client CI, Skia spike, board renderer, drag and preview; `LevelBuilder` and Fit validator; level selection; panel login, Fit editor, seed config page and hosting; settings and audio; release candidate and release |
| C — Sort & backend | Kenneth Fung | Hexa Sort | Whole backend (setup, CI, Prisma, auth, endpoints, Nest aspects, deployment, seed script), APK workflow, local persistence, Sort editor of the panel, Pact on both sides |

- **Track B takes two variants:** Hexa Lines is the smallest and comes first
  (I1); having it written by someone who did not write the engine tests the
  engine's API from the outside. Hexa Fit shares drag and the piece catalog
  with Lines.
- **Track A takes Hexa Merge:** it needs the engine's command history and a
  random generator whose state can be restored (RN-31), and it uses swipes
  instead of drag.
- **Track C takes Hexa Sort:** Sort is built in I3, once the backend is done in
  I1–I2. The cascade rules (HU20) start at the end of I2.
- **Levels:** the variant owner leads. Fit: Jesus 5, Ronald 5, Kenneth 5.
  Sort: Kenneth 4, Ronald 3, Jesus 3. So the three of us understand both
  level-based variants.
- **Level `spec` schema:** Jesus writes the Fit part, Kenneth the Sort part.
- **Risk — duplicated code across variants:** blocked by the lint rule that
  forbids variants importing each other, and by Ronald reviewing every
  `engine` change.
- **Risk — load:** Kenneth in I3. If it slips by 12-02, Ronald takes Pact.

The alternative considered was one variant each with Hexa Lines built by the
three of us together. It was dropped because nobody could present Lines as
their own work and it forces a shared schedule in I1.

### Everyone can explain the engine

- **Mob sessions on the engine (I0–I1):** three sessions of about 2 h for
  `Board`, `GameEngine` and `BaseGameRules`. The person at the keyboard
  rotates every 20 minutes and commits their own part.
- Every variant is written against the engine, so each owner learns its
  extension points.
- Pull requests labelled `engine` are reviewed by the two other members.
- **Weekly explain-back (30 min):** each member explains a file written by
  someone else, picked at random.
- **12-11 and 12-12:** each member rehearses "add a fifth variant" alone, in a
  throwaway branch, following `EXTENSIBILITY.md`.

### Reviews

Every pull request needs one approval from a teammate who is not the author.

| Author | Reviewer |
|---|---|
| Ronald Gómez | Jesus Obando |
| Jesus Obando | Kenneth Fung |
| Kenneth Fung | Ronald Gómez |
| Any PR labelled `engine` | The two other members |

## 3. Issues

One issue per user story (HU01–HU35) plus the technical tasks (T01–T43): 35
stories, 43 tasks, the five `-be` stories and one extra issue per repository
for the eight `cl+be` tasks (T01, T06, T11, T19, T34, T39, T40, T41), so 91
issues in total. Issues are created **at the start of each iteration**, so
GitHub only shows work that is decided. The issues of I0 already exist: client
[#3–#12](https://github.com/PepeTza/hexablock-client/issues) and backend
[#3–#8](https://github.com/PepeTza/hexablock-backend/issues); backend #8 is
the twin of the `CONTRIBUTING.md` change made in T02 (client #4). Tasks that
touch both repositories get one issue in each, naming its twin.

- **Labels** (`CONTRIBUTING.md` §7): variant `hexa-lines`, `hexa-fit`,
  `hexa-sort`, `hexa-merge`, `engine`; layer `domain`, `application`,
  `adapters`, `frameworks`; type `feature`, `bug`, `docs`, `test`, `chore`;
  plus `panel` (decision 17).
- **No milestones:** the iteration and its dates are written in each issue.
- The acceptance criteria of a user story always include those of
  `user-stories.md`; the table adds the concrete ones.

Repo: cl = client, be = backend. Track: A = Ronald Gómez, B = Jesus Obando,
C = Kenneth Fung.

| ID | Title | Repo | Refs | Acceptance criteria | Track | Iteration | Labels |
|---|---|---|---|---|---|---|---|
| T01 | chore: configure branch protection and labels | cl+be | CONTRIBUTING §1, §7 | `main` protected as in §1; labels created (by the repository owner, not an agent) | Repository owner | I0 | chore |
| T02 | docs: record stack decisions D-06, D-07 and D-10 | cl | §7 | `architecture.md` updated | A | I0 | docs |
| T03 | chore: set up Expo app with strict TypeScript, lint, tests and hooks | cl | RNF-11, D-05 | lint, typecheck and test pass; the hook rejects a bad message; the app opens on Android | B | I0 | chore, frameworks |
| T04 | ci: add client CI with lint, type-check, coverage and commitlint | cl | RNF-05 | Runs on every PR; fails below 80 % in domain and application | B | I0 | chore |
| T05 | chore: set up the admin panel project importing the domain | cl | D-13, D-16 | `admin/` builds and imports `src/domain`; its own CI job | C | I0 | chore, frameworks, panel |
| T06 | chore: enforce layer and variant boundaries with lint rules | cl+be | RNF-03, ADR-03 | A forbidden import fails; a fixture proves it | A | I0 | chore, domain |
| T07 | feat(engine): add hex coordinates and geometry | cl | RF-01, RN-01 | Neighbours, 3 axes, rings and 60° rotation tested | A | I0 | engine, domain, feature |
| T08 | chore(ui): spike Skia board rendering and piece drag | cl | RNF-07, RNF-08 | Radius-4 board and a draggable piece at ~60 FPS on a mid-range Android | B | I0 | frameworks, chore |
| T09 | chore: set up NestJS API with strict TypeScript, lint, tests, hooks and health | be | RF-26 | `GET /api/v1/health` against a local PostgreSQL; Swagger served at `/api/docs` (set up only; the decorators per endpoint come with T17) | C | I0 | chore, frameworks |
| T10 | ci: add backend CI with a PostgreSQL service | be | RNF-05 | Lint, types, unit and e2e on PRs; 80 % coverage | C | I0 | chore |
| T11 | docs: add shared agent skills | cl+be | §6 | Skills created and listed in `AGENTS.md` | A | I0 | docs |
| HU07 | feat(engine): add generic board with injected geometry | cl | RF-01 | Instantiated with at least two test cell types in I0 (the four real cell types arrive with their variants in I1–I3); radius 4, radius 2 and free-form shapes | A | I0 | engine, domain, feature |
| HU08 | feat(engine): game engine, rules template and domain events | cl | RF-02, RF-03, RF-06, RN-06 | Works with a test cell; no `if` per variant; emits events; an error leaves the state unchanged | A (mob) | I1 | engine, domain, feature |
| HU09 | feat(engine): interchangeable piece sources, scoring and seeded random | cl | RF-04, RF-05, RN-05 | Changing a policy does not touch the engine; same seed → same sequence | A | I1 | engine, domain, feature |
| T12 | feat(engine): piece catalog as data | cl | RN-03, D-07 | JSON catalog and loader; connected shapes of 1–5 cells | A | I1 | engine, domain, feature |
| HU11 | feat(usecases): start, apply and finish game use cases with logging aspect | cl | RNF-04, CU-01, CU-02, CU-07 | The `ApplyMoveUseCase` log appears for every variant | A | I1 | application, feature |
| HU12 | feat(hexa-lines): clear lines on three axes with combos | cl | RN-09, RN-10 | A shared cell is cleared once; score per D-08 | B | I1 | hexa-lines, domain, feature |
| HU13 | feat(hexa-lines): refill tray after three placements | cl | RN-08 | New tray only when all 3 are used; reproducible | B | I1 | hexa-lines, domain, feature |
| HU14 | feat(hexa-lines): detect game over and save high score | cl | RN-12, CU-07 | Automatic detection; high score saved | B | I1 | hexa-lines, domain, feature |
| HU03 | feat(ui): drag and drop pieces onto the board | cl | RF-17 | The piece follows the finger; dropping outside returns it | B | I1 | adapters, frameworks, feature |
| HU04 | feat(ui): preview placement validity while dragging | cl | CU-03 | Green or red in real time; lines to clear highlighted in Lines | B | I1 | application, adapters, feature |
| HU01 | feat(ui): main menu with variants and settings | cl | RF-14 | The 4 variants and settings; works offline | A | I1 | frameworks, feature |
| T13 | feat(ui): Hexa Lines game screen and cell renderer | cl | RF-08 | A full game is playable; no rules in the UI | B | I1 | hexa-lines, adapters, frameworks, feature |
| T14 | feat(ui): victory and defeat screens showing the seed | cl | RF-16, CU-07 | Score, seed, retry / next / new game | A | I1 | adapters, frameworks, feature |
| T15 | ci: build Android APK and attach it to releases | cl | S-02 | Tag `v*` → APK in the release; tested with `v0.1.0` | C | I1 | chore |
| HU29 | feat: save progress and records locally per variant | cl | RF-20, D-06 | Survives closing the app, offline | C | I1 | adapters, frameworks, feature |
| T16 | feat(db): Prisma schema and initial migration | be | data-model §2–6 | Migrates an empty database; partial indexes present | C | I1 | frameworks, feature |
| T17 | feat(api): error format, validation, logging interceptor and Swagger | be | RF-26 | Errors use the contract's body; one log line per request; Swagger decorators on every DTO and controller so `/api/docs` matches the contract | C | I1 | adapters, frameworks, feature |
| HU30-be | feat(api): register, login and refresh with JWT roles | be | RF-22, RN-42, RNF-10 | bcrypt; 90 days; generic 401; 409; 429 | C | I1 | application, adapters, feature |
| T18 | ci: deploy backend on merge to main | be | D-10 | `/health` answers on the public URL | C | I1 | chore |
| T19 | docs: diagrams v1 in Lucidchart | cl+be | RNF-12 | Ronald: client classes; Jesus: layers and extensibility; Kenneth: backend | All | I1 | docs |
| T20 | feat(engine): command history for undo and redo | cl | RF-07 | Generic undo and redo | A | I2 | engine, domain, feature |
| HU24 | feat(hexa-merge): slide tiles in six directions | cl | RN-26 | One test per direction | A | I2 | hexa-merge, domain, feature |
| HU25 | feat(hexa-merge): merge equal tiles | cl | RN-27, RN-29 | No double merge | A | I2 | hexa-merge, domain, feature |
| HU26 | feat(hexa-merge): spawn a tile after each valid move | cl | RN-28 | 90/10; nothing when the board does not change | A | I2 | hexa-merge, domain, feature |
| HU27 | feat(hexa-merge): undo the last move | cl | RN-31 | One level; restores the random generator | A | I2 | hexa-merge, domain, feature |
| HU28 | feat(hexa-merge): detect target tile and no-move defeat | cl | RN-30 | Victory with the option to keep playing | A | I2 | hexa-merge, domain, feature |
| T21 | feat(ui): Hexa Merge screen with swipe input | cl | RF-11 | Swipe in 6 directions; undo button | A | I2 | hexa-merge, adapters, frameworks, feature |
| T22 | feat(engine): level definition, builder and validator port | cl | RN-13, RN-37 | JSON → `LevelDefinition` with clear errors | B | I2 | engine, domain, feature |
| HU15 | feat(hexa-fit): cover the figure without gaps or overlaps | cl | RN-02, RN-15 | Exact victory; overlaps rejected | B | I2 | hexa-fit, domain, feature |
| HU16 | feat(hexa-fit): rotate pieces in 60° steps | cl | RN-14 | Preview; an invalid position goes back | B | I2 | hexa-fit, domain, feature |
| HU17 | feat(hexa-fit): unlimited undo and redo | cl | RN-16, RN-17 | Undo does not give back time | B | I2 | hexa-fit, domain, feature |
| T23 | feat(hexa-fit): level validator with solution search | cl | RN-13, D-09 | Rejects a different area or no solution | B | I2 | hexa-fit, domain, feature |
| T24 | docs(api): define level spec schema v1 for Fit and Sort | be | api-contracts §6, §9 | Contract change: needs approval. By 11-25 | B (Fit) + C (Sort) | I2 | docs |
| T25 | feat(ui): Hexa Fit game screen | cl | RF-09 | Place, remove, relocate, rotate, undo and redo, clock | B | I2 | hexa-fit, adapters, frameworks, feature |
| HU31-be | feat(api): get and merge player progress | be | RN-33, RN-36 | Idempotent; e2e | C | I2 | domain, application, adapters, feature |
| T26 | feat(api): submit scores with plausibility check and rate limit | be | RN-39, RN-43 | Rejection → 422 logged; duplicate → 200 | C | I2 | domain, application, adapters, feature |
| HU32-be | feat(api): leaderboard per game and per level | be | RN-34, RN-43, D-12 | Top 50 and `me` | C | I2 | application, adapters, feature |
| HU33-be | feat(api): list and publish levels with format check | be | RN-37 | No update or delete; 422 on schema errors | C | I2 | application, adapters, feature |
| HU35-be | feat(api): get and configure seed config | be | RN-05, D-15 | Per variant and per Sort level; audit of who and when | C | I2 | application, adapters, feature |
| HU20 | feat(hexa-sort): place stacks with cascading transfer | cl | RN-20, RN-21, RN-22 | Deterministic on ties | C | I2 | hexa-sort, domain, feature |
| HU30 | feat: register and log in from the app | cl | CU-10, CU-11, RN-32 | The game stays usable as a guest | A | I3 | application, adapters, frameworks, feature |
| HU21 | feat(hexa-sort): clear runs of ten chips as goals | cl | RN-23, RN-40 | Visible goal counter | C | I3 | hexa-sort, domain, feature |
| HU22 | feat(hexa-sort): win by goals and lose on a full board | cl | RN-24 | Correct result screens | C | I3 | hexa-sort, domain, feature |
| T27 | feat(ui): Hexa Sort game screen | cl | RF-10 | Visible cascade; input ignored while resolving | C | I3 | hexa-sort, adapters, frameworks, feature |
| HU18 | feat(hexa-fit): award stars by moves and time | cl | RN-18, D-08 | Stars saved | B | I3 | hexa-fit, domain, feature |
| HU19 | feat(hexa-fit): 15 progressive levels with unlocking | cl | RN-19 | 15 JSON files validated by tests | B (+A, C) | I3 | hexa-fit, feature |
| HU23 | feat(hexa-sort): 10 progressive levels | cl | RN-25 | 10 JSON files validated by tests | C (+A, B) | I3 | hexa-sort, feature |
| T28 | feat(ui): level selection with stars and locks | cl | RF-15, CU-08 | Stars and locks | B | I3 | application, frameworks, feature |
| HU31 | feat: sync progress with a retry queue | cl | RF-27, CU-12, RN-35 | Fails silently offline; backoff | A | I3 | application, adapters, feature |
| T29 | feat: submit finished game scores | cl | CU-13, RN-39 | Queued; idempotent by `sessionId` | A | I3 | application, adapters, feature |
| HU32 | feat(ui): leaderboard screen per variant and level | cl | CU-14 | Guests are invited to register | A | I3 | application, frameworks, feature |
| HU33 | feat: refresh levels and seed config from the server | cl | CU-15, RN-38 | Only `after`; an invalid level stops the series | A | I3 | application, adapters, feature |
| T30 | feat(panel): admin login and layout | cl | CU-11 A4 | Admin role only | B | I3 | frameworks, feature, panel |
| T31 | feat(panel): Hexa Fit level editor with validation and publish | cl | CU-17 | Shows the solution; local draft | B | I3 | adapters, frameworks, feature, panel |
| T32 | feat(panel): Hexa Sort level editor with seed mode | cl | CU-17 | Initial board, colours, goals, seed mode | C | I3 | adapters, frameworks, feature, panel |
| HU35 | feat(panel): configure seed mode per variant and level | cl | CU-18 | Fixed or random; 403 for non-admins | B | I3 | adapters, frameworks, feature, panel |
| T33 | feat(db): seed initial levels, seed configs and first admin | be | data-model §7 | Idempotent; same ids as the app | C | I3 | frameworks, feature |
| T34 | test: contract tests with Pact (consumer and provider) | cl+be | RNF-05, D-05 | Login, progress, scores and levels verified | C | I3 | test |
| HU10 | docs: guide to add a fifth variant | cl | RNF-01 | Checked with the rehearsal | A | I3 → buffer | docs |
| T35 | feat: pause, resume and background handling | cl | RF-21, CU-06, RN-07 | The Fit clock stops | A | I4 | application, frameworks, feature |
| HU02 | feat(ui): fit portrait layout to screen sizes | cl | RNF-07 | No clipping on 3 screen sizes | A | I4 | frameworks, feature |
| HU05 | feat(ui): settings with sound and music toggles and audio | cl | RF-18, RN-41 | Settings persist; effects and music | B | I4 | adapters, frameworks, feature |
| HU06 | feat(ui): switch between Spanish and English | cl | RF-19, RN-41 | Changes without restarting | A | I4 | adapters, frameworks, feature |
| T36 | test(ui): navigation flow test | cl | architecture §11 | Home → level → game → result | B | I4 | test |
| T37 | chore(panel): host the admin panel | cl | D-13 | Public URL allowed by CORS | B | I4 | chore, panel |
| T38 | chore: release candidate v0.9.0 | cl | — | Installable APK; no blocking bugs | B | I4 | chore |
| T39 | docs: final diagrams in Lucidchart | cl+be | RNF-12 | 5 diagrams with image and link | All | Buffer | docs |
| T40 | docs: complete README of both repositories | cl+be | RNF-12 | Every section the statement requires | All | Buffer | docs |
| T41 | docs: AI usage critical evaluation | cl+be | RNF-12 | `AI_USAGE.md` §3 complete | All | Buffer | docs |
| T42 | chore: release v1.0.0 with the four variants | cl | S-02 | Release with the APK on 12-13 | B | Buffer | chore |
| HU34 | feat: resume an interrupted game | cl | CU-16 | State restored | Free | Optional | application, adapters, feature |
| T43 | feat: Hexa Quest variant | cl | EXTENSIBILITY §3 | Only 2 lines outside its folders | A | Optional | feature |

## 4. Folder structure

Each repository has one folder per Clean Architecture layer, and a lint rule
stops an inner layer from importing an outer one.

### Client

```
hexablock-client/
├── src/
│   ├── domain/                    # layer 1 — plain TypeScript, no external imports
│   │   ├── engine/                # geometry/ board/ game/ rules/ commands/ events/ random/ pieces/ state/
│   │   ├── variants/              # hexa-lines/ hexa-fit/ hexa-sort/ hexa-merge/
│   │   ├── progress/              # PlayerProgress, progress models
│   │   └── content/               # LevelDefinition, LevelBuilder, ILevelValidator, SeedConfig
│   ├── application/               # layer 2
│   │   ├── ports/                 # IProgressRepository, ILevelRepository, IAuthService, ILogger...
│   │   ├── use-cases/             # start-game, apply-move, ... (generic, one per use case)
│   │   └── aspects/               # logging, retry, session-guard (Decorators)
│   ├── adapters/                  # layer 3
│   │   ├── presentation/          # view models, VariantPresentationFactory and registry
│   │   │   └── variants/<variant>/   # ICellRenderer, IInputMapper, presentation factory
│   │   ├── persistence/           # local repositories and mappers
│   │   └── http/                  # remote repositories and DTO mappers
│   └── frameworks/                # layer 4
│       ├── ui/                    # screens, components, Skia
│       ├── storage/ audio/ i18n/ http-client/
│       └── composition-root.ts    # factory registration (the only place with `register`)
├── levels/                        # hexa-fit/*.json, hexa-sort/*.json (copy bundled with the app)
├── assets/                        # sounds, fonts, images
├── admin/                         # admin panel (Vite + React): own package.json, imports @domain/*
├── docs/diagrams/
└── .claude/skills/
```

### Backend

```
hexablock-backend/
├── src/
│   ├── domain/                    # identity/ progress/ leaderboard/ content/ shared/ — no Nest, no Prisma
│   ├── application/
│   │   ├── ports/                 # IUserRepository, IPasswordHasher, ITokenService, IClock...
│   │   └── use-cases/             # register-user, login, merge-progress, submit-score, publish-level...
│   ├── adapters/
│   │   ├── http/                  # controllers, DTOs (class-validator), mappers
│   │   └── persistence/           # prisma-*-repository.ts
│   ├── frameworks/                # Nest modules, PrismaService, guards, interceptors, filters, config
│   └── main.ts
├── prisma/                        # schema.prisma, migrations/, seed.ts, seed-data/
├── test/                          # e2e (supertest) and pact/
└── .claude/skills/
```

In the backend, use cases are plain classes with no Nest decorators. The
modules in `frameworks/` register them with `useFactory`, so the domain never
knows about Nest.

### How the layers are enforced

ESLint's built-in `no-restricted-imports` rule, with one override per folder
(no new dependency):

| Folder | Cannot import |
|---|---|
| `domain/**` | `application`, `adapters`, `frameworks`, or external packages (`react*`, `expo*`, `@shopify/*`, `@nestjs/*`, `@prisma/*`...) |
| `application/**` | `adapters`, `frameworks` |
| `adapters/**` | `frameworks` |
| `domain/variants/<variant>/**` | the other variants (only `engine/`) |
| `admin/**` | anything outside `src/domain` (never the mobile UI) |

- `frameworks/composition-root.ts` is the only file in `frameworks/` that
  imports `adapters/`; `frameworks/` itself has no import restriction.
- `no-restricted-imports` has no "any external package" option: the
  `domain/**` override forbids every bare module specifier with a pattern
  group and re-allows relative paths and the `@domain/*` alias.
- Lint runs in the pre-commit hook and in CI, so a violation blocks the PR.
- A test fixture with a forbidden import proves the rule works, with one
  layer import and one external package import.
- `tsconfig` path aliases (`@domain/*`, `@application/*`) keep imports readable
  and easy to filter.

## 5. Setup task

Run in I0, one branch per repository and small commits per tool.

1. **App:** Expo TypeScript template (current stable SDK, pinned version) with
   an empty test board.
2. **Admin panel:** `admin/` with Vite React-TS, the `@domain` alias in
   `tsconfig` and in Vite, and a test that imports something from the domain.
3. **Backend:** `nest new` (strict), base path `/api/v1`, `ConfigModule`
   validating the environment, `GET /health` through Prisma, `.env.example`.
4. **Quality:**
    - `tsconfig` with `strict: true` and `noUncheckedIndexedAccess`.
    - ESLint flat config with typescript-eslint and the layer rules of §4;
      Prettier and `.editorconfig`.
    - Jest with an 80 % `coverageThreshold` on `src/domain` and
      `src/application`.
    - husky: `commit-msg` runs commitlint with the scopes of `CONTRIBUTING.md`;
      `pre-commit` runs lint-staged.
5. **CI** (`.github/workflows/ci.yml`):
    - Client: jobs `app` and `admin` with `npm ci`, lint, `tsc --noEmit` and
      tests with coverage (plus `vite build` for the panel); commitlint on the
      PR's commits.
    - Backend: a `postgres:16` service, `prisma migrate deploy`, lint, types,
      unit and e2e tests.
    - The APK (T15) and deployment (T18) workflows come in I1.
6. **`.vscode/extensions.json`:** in both `dbaeumer.vscode-eslint`,
   `esbenp.prettier-vscode`, `editorconfig.editorconfig`, `orta.vscode-jest`;
   client `expo.vscode-expo-tools`; backend `prisma.prisma`.
7. **Docs:** commands in `AGENTS.md` and in the README ("Getting Started"); a
   row in `harness/phase-log.md`.

### Dependencies

Each one needs the team's approval before it is added (`AGENTS.md`).

| Package | Repo | Purpose | When |
|---|---|---|---|
| `expo`, `react`, `react-native`, `typescript` | cl | App base (template) | Setup |
| `@shopify/react-native-skia` | cl | Draw the board (GPU) | Setup (spike) |
| `react-native-reanimated` | cl | Animations on the UI thread | Setup (spike) |
| `react-native-gesture-handler` | cl | Drag and swipe | Setup (spike) |
| `@react-navigation/native`, `native-stack` (+ `react-native-screens`, `react-native-safe-area-context`) | cl | Navigation between screens | I1 |
| `expo-sqlite` (or `@react-native-async-storage/async-storage` if D-06 becomes key-value) | cl | Local storage behind `IProgressRepository` (D-06, provisional: SQLite) | I1 |
| `expo-localization` | cl | Phone language (RN-41) | I4 |
| `expo-audio` | cl | Sound effects and music | I4 |
| `expo-crypto` | cl | `randomUUID` for `sessionId` | I3 |
| `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest` | cl | Unit and UI tests | Setup |
| `vite`, `@vitejs/plugin-react`, `react-dom`, `vitest`, `@testing-library/react` | cl (admin) | Admin panel and its tests | Setup |
| `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs`, `@nestjs/cli`, `@nestjs/testing` | be | NestJS base (template) | Setup |
| `@nestjs/config` | be | Read and validate environment variables | Setup |
| `@nestjs/swagger` | be | OpenAPI at `/api/docs` (RF-26) | Setup |
| `prisma`, `@prisma/client` | be | ORM and migrations (decided) | Setup |
| `class-validator`, `class-transformer` | be | DTO validation (400 with `details`) | I1 |
| `@nestjs/jwt` | be | Sign and verify JWTs (own guard, no Passport) | I1 |
| `bcrypt` | be | Password hashing (its 72-byte limit matches the 8–72 rule) | I1 |
| `@nestjs/throttler` | be | Rate limits → 429 | I2 |
| `jest`, `ts-jest`, `supertest` | be | Unit and e2e tests | Setup |
| `eslint`, `typescript-eslint`, `eslint-config-prettier`, `prettier` | both | Lint and formatting | Setup |
| `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional` | both | Git hooks (`CONTRIBUTING.md` §2) | Setup |
| `@pact-foundation/pact` | both | Contract tests (D-05) | I3 |

Written by us, with no dependency: the seeded random generator (mulberry32,
cited in a comment), axial hex geometry (Red Blob Games, "Hexagonal Grids",
cited), i18n with JSON dictionaries and a small `Translator`, and the panel's
hex grid in SVG.

## 6. AI agents and skills

At most **three implementation agents at a time, one per person**. With
approval per commit, every agent needs its human at each gate of the
[harness](../harness/README.md).

- **Optional review agent:** a read-only agent reviews the PR before the human
  review. It never commits.
- **One branch and one `git worktree` per issue:**
  `git worktree add ../hexablock-client-<issue> -b feat/<issue>-...`.
- **Folders per track:** Ronald touches `domain/engine`, `hexa-merge`,
  `application` and `adapters/http`. Jesus touches `hexa-lines`, `hexa-fit`,
  `frameworks/ui` and `admin/` except the Sort editor. Kenneth touches
  `hexa-sort`, `adapters/persistence`, the panel's Sort editor and the backend.
- **Shared files** (composition root, `package.json`, ESLint config, i18n
  dictionaries, menu configuration): changed only in small, dedicated PRs,
  merged the same day. Rebase on `main` daily.

### Shared skills

| Skill | Repo | What it does | When |
|---|---|---|---|
| `harness-task` | both | Turns an issue into the `task-template.md` prompt and fixes the gate 1 format | At the start of every task |
| `aaa-test` | both | `should_..._when_...` names, Arrange / Act / Assert, port fakes, fixed seed, file location | When writing any test |
| `add-variant` | cl | `EXTENSIBILITY.md` §2 checklist: files, interfaces, the two registration lines, tests, lint | For every variant and the defence rehearsal |
| `design-level` | cl | `spec` format, validator and solver, difficulty curve (RN-19, RN-25), ids, where the JSON goes | When designing the 25 levels |
| `api-endpoint` | be | From contract to code: DTO → controller → use case → port → Prisma adapter, errors, Swagger, tests and Pact | For every endpoint |
| `log-ai-usage` | both | `AI_USAGE.md` entry, `phase-log.md` row, footer check | At gate 4 |

- **Where:** `.claude/skills/<name>/SKILL.md` in each repository, versioned.
  Claude Code loads them automatically.
- Other tools (Codex, Copilot) read them as plain Markdown through a "Skills"
  section in `AGENTS.md`.
- Shared skills are copied identically into both repositories; whoever changes
  one updates the other the same day.

## 7. Pending decisions

Twenty-one decisions, each with a recommendation. The five due on 11-12 block
the setup. The **Status** column is updated when a decision is taken (the
record is `architecture.md` §10) or resolved by a pull request.

| # | Decision | Options | Recommendation | Due | Status |
|---|---|---|---|---|---|
| 1 | Expo or bare React Native | Expo (managed + prebuild) / bare | **Expo:** Skia, Reanimated and Gesture Handler work; Expo Go lets us test on phones from day one; APK with `expo prebuild` and Gradle in Actions, no EAS account | 11-12 | Taken: D-17 (client #16) |
| 2 | Admin panel framework | Vite + React / Next.js / React Native Web | **Vite + React + TypeScript** with an SVG grid: same React; Next.js is not needed (no SSR); React Native Web with Skia is complex | 11-12 | Taken: D-18 (client #16) |
| 3 | How the panel imports the domain | TypeScript + Vite alias / npm workspaces / package | **`@domain` alias:** simplest; no package to publish (D-16) | 11-12 | Taken: D-19 (client #16); see decision 19 for what else the panel may import |
| 4 | D-06 client local storage | SQLite / file or key-value JSON | **Key-value JSON (AsyncStorage)** behind `IProgressRepository`: little data, no migrations on the phone | 11-15 | Provisional: SQLite recorded in D-06 (client #16), question open with the professor. HU29 starts with SQLite; the dependency table of §5 follows D-06, not this recommendation |
| 5 | Navigation | React Navigation / Expo Router | **React Navigation:** screens stay in `frameworks/ui` | 11-15 | Taken: D-20 (client #16) |
| 6 | D-10 backend hosting | Render free / Railway / Fly.io / Koyeb | **Render free + Supabase free.** Risks: ~30–60 s cold start (warm it up before the defence) and Supabase pauses after 7 days without use | 11-15 | Taken: D-10 (client #16) |
| 7 | D-07 piece catalog | Every shape of 1–5 cells (1+1+3+10+33 without flips) / a selection | **The 15 shapes of 1–4 cells plus ~6 of 5 cells**, with spawn weights in Lines. Still open: whether Lines spawns pieces in a random orientation (RN-11 only forbids the player rotating them) | 11-17 | Taken: D-07 (client #16), including random orientation in Lines |
| 8 | D-08 scoring | — | Lines: `cells + 10·L·L·(1 + 0.5·(streak − 1))`, L = lines cleared by the move. Fit: `max(100, 1000 − 20·extra_moves − 2·seconds)`, thresholds in the level file. Merge and Sort already defined (RN-29, RN-40). Plausibility limits derived from these | Lines 11-18; Fit 11-25; plausibility 11-29 | Open |
| 9 | Level ids in the app vs the server | Fixed ids in the app's JSON / export from the server | **Fixed UUIDs in `levels/*.json`, inserted with that id and order by the seed script.** Progress and leaderboard use `levelId` (RN-37), so they must match | 11-25 | Open |
| 10 | `spec` schema for Fit and Sort | — | Fit: `{figure, pieces, starThresholds}`. Sort: `{radius, blocked, initialStacks, colors, tray: {size, minHeight, maxHeight, maxColorsPerStack}, goals}`. Changes the contract: PR to the backend with approval | 11-25 | Open |
| 11 | Gaps in the rules | Sort tray and stack generation; Merge starting tiles | Sort: a tray of 3 stacks, parameters per level. Merge: 2 starting tiles. New rules from RN-44 | Merge 11-22; Sort 11-25 | Open |
| 12 | "Statistics" in HU01 | Define a minimum / remove | **Minimum:** high score and completed levels per variant, from `PlayerProgress` | 11-20 | Open |
| 13 | Pact file exchange | Pactflow (external account) / file copied to the backend | **Versioned pact file** in the backend's `test/pact/`, copied from the client's CI; no broker | 11-29 | Open |
| 14 | First admin user | Seed with environment variables / CLI | **Seed script** reading `ADMIN_USERNAME` and `ADMIN_PASSWORD` (hosting secrets) | 11-29 | Open |
| 15 | Admin panel hosting | GitHub Pages / Netlify / local only | **GitHub Pages** (static, no extra account); CORS allows that origin | 12-01 | Open |
| 16 | i18n and audio libraries | Own vs i18next; `expo-audio` | Own + `expo-localization`; `expo-audio` | 12-01 | Open |
| 17 | Extra label | §7 labels only / add `panel` | **Add `panel`:** there is no label for the admin panel today | 11-12 | Taken: `CONTRIBUTING.md` §7 (client #16, backend #9) |
| 18 | Backend issue ids | — | Same user story id with a `-be` suffix | 11-12 | Taken: `CONTRIBUTING.md` §7 (client #16, backend #9) |
| 19 | Where the admin panel's use cases live | `admin/` may import `src/application` too / CU-17, CU-18 and the panel's login are panel-local classes in `admin/src` | **Allow `src/application`:** CU-17, CU-18 and CU-11 stay the generic classes of `use-cases.md`; the panel is a layer-4 app that brings its own adapters (HTTP, browser storage for drafts) for the ports; the lint rule of §4 and D-19 change from "only `src/domain`" to "only `src/domain` and `src/application`" | 11-15 | Open; blocks T05 (#7) and T06 (#8) |
| 20 | State pattern in the engine | Six state classes (`MenuState` … `VictoryState`) / a `GameStatus` value checked by the engine | **`GameStatus` value** plus the RN-06 lock in the engine; the six classes stay only if HU08 shows a real benefit. If dropped, the CU-06 design note and the `architecture.md` §4 row change in the same PR | 11-16 | Open; blocks HU08 (I1) |
| 21 | Proposed values of the API contract | Accept the *(proposed)* values (username 3–20, password 8–72, rate limits) / change them | **Accept them** and mark them decided in `api-contracts.md`: HU30-be, T26 and the `bcrypt` row already assume them | 11-16 | Open; blocks HU30-be (I1) |

### Possible over-engineering

Items of `architecture.md` to confirm or drop:

- **State** with six classes (`MenuState` … `VictoryState`): a `GameStatus` in
  the engine plus navigation may be enough.
- **Singleton** `AudioManager` and `SessionManager`: single-scope dependency
  injection is enough.
- **Prototype** and **Iterator**: name them only if there is a real `clone()`
  and traversal generators (`*ring()`).
- **`GameServiceFacade`:** not needed alongside the use cases.
- **Pact** with a single consumer and a single provider: the most expensive
  item for three people. D-05 decides it; we propose limiting it to four
  interactions.
- Rules decorators and the D-09 generator: document only, or cut.

## 8. Documentation inconsistencies

Points where the documents disagree or information is missing. None has been
resolved by guessing.

1. `CONTRIBUTING.md` (both repos) still says the backend contains the admin
   panel, and lists the `panel` scope under the backend (contradicts D-16).
   **Resolved** by client #16 and backend #9.
2. RF-13 says "JSON/YAML"; ADR-07 says JSON. We propose JSON only.
   **Resolved:** RF-13 and `architecture.md` §4 now say JSON, as ADR-07.
3. `architecture.md` §1 validates Skia "in iteration 2" (old plan); it is the
   I0 spike now. **Resolved** by client #16.
4. Backend `data-model.md` §7: the seed script reads "the level files of the
   client repo", a dependency between repositories. Proposal: a copy in the
   backend's `prisma/seed-data/` (decision 9).
5. There is no endpoint or procedure to create the first admin user
   (decision 14).
6. RF-21 (pause) and RF-15 (level selection) have no user story; T35 and T28
   cover them.
7. The rules do not define the Sort tray size, the Merge starting tiles or the
   orientation of Lines pieces (decisions 7 and 11).
8. HU01 mentions "statistics" with no use case or business rule (decision 12).
9. The commands section of `AGENTS.md` is still pending; the setup fills it.
   **Resolved** in the client (#5); pending in the backend until T09 (#4).
10. `api-contracts.md` §4 said `stars` is 1–3 for both level games, while
    `data-model.md` and RN-25 say Hexa Sort has no stars. **Resolved:** the
    contract now says `stars` is `null` for `hexa-sort`.
11. `architecture.md` said it was shared by both repositories with the client
    copy as reference, and the backend `docs/README.md` planned a copy.
    **Resolved:** the file lives only in the client; the backend links to it.
12. The panel may import only `src/domain` (plan §4, D-19), but CU-17, CU-18
    and the panel's login are use cases in `src/application` (decision 19).
13. The State pattern is listed as possible over-engineering, but CU-06 and
    `architecture.md` §4 depend on it (decision 20).
14. `api-contracts.md` marks username, password and rate-limit values as
    proposed, while HU30-be and T26 treat them as decided (decision 21).
15. Ports were named in five documents with no single list; `architecture.md`
    §2 now has one table. New ports are added there first.
