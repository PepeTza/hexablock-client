# Phase Log

One row per completed task, newest at the bottom. Keep each cell short; the
details live in the PR.

| Date | Task | Issue / PR | Owner | Tests (passed / total) | Notes |
|---|---|---|---|---|---|
| 2026-11-10 | Repository skeleton (docs, harness, templates) | — | PepeTza | — | No code yet |
| 2026-11-11 | Implementation plan, work split and I0 issues | #13 | PepeTza | — | Docs only; I0 issues: client #3–#12, backend #3–#7 |
| 2026-11-10 | Expo app setup with strict TypeScript, ESLint, Prettier, Jest and commit hooks | #5 | Jesus Obando | 1 / 1 | Branch `chore/t03-app-setup`. Opened with Expo Go on an Android emulator and on a real phone |
| 2026-11-11 | Review of the plan and the documents; corrections of inconsistencies | — (branch `claude/tender-babbage-cx0n60`) | PepeTza | — | Docs only; findings in `docs/plan-review-2026-11-11.md`; twin PR in the backend |
| 2026-11-11 | Relax the PR review rule | — | PepeTza | — | Docs only; no approval required on `main`; the author merges on green CI; review requested and allowed after the merge; twin PR in the backend |
| 2026-11-11 | Record stack decisions D-06, D-07, D-10, D-17–D-20 | #4 | PepeTza | — | Docs only; D-06 provisional (question for the professor); CONTRIBUTING twin change in backend #8 |
| 2026-11-11 | Shared agent skills | #12 | PepeTza | — | Docs only; 5 skills; shared ones copied to backend #7 |
| 2026-11-11 | Layer and variant boundaries with lint rules; path aliases | #8 | PepeTza | 14 / 14 | Variants read from folders; `admin/` rule left to #7 (decision 19 still open) |
| 2026-11-11 | Hex coordinates and geometry | #9 | PepeTza | 44 / 44 | Pointy-top (D-21); directions and axes declared by each geometry |
| 2026-11-12 | Generic board with injected geometry | #10 | PepeTza | 67 / 67 | `cellAt` / `place` / `remove`; mutable with `clone()` (Prototype); 4 test cell types |
| 2026-11-17 | Decouple coordinates with ICoord and HexCoord (RNF-14) | #25 | PepeTza | 71 / 71 | `TCoord extends ICoord = HexCoord`; `origin` and `rotationSteps`; 3D test coord |
| 2026-11-18 | Admin panel setup importing the domain | #7 | KeneFu | 7 / 7 panel, 71 / 71 app | Vite + React in `admin/` (D-18); `@domain` alias and lint boundary as D-19 stands today (decision 19 still open); jsdom 29 for Node 22.13; panel CI job left to #6 |
| 2026-11-18 | Remove DDD references in favour of Clean Architecture | #43 | PepeTza | — | Docs only; dropped `RNF-15`, bounded contexts and aggregates; twin backend #24 |
| 2026-11-18 | Record pending decisions 19 and 20 (D-19 extended, D-22) | #45 | PepeTza | — | Docs only; session states with transition table in CU-06; panel imports `src/application`; lint change left to #46; decision 8 (Lines) to Track B, 21 to Track C |
| 2026-11-19 | Record error security as decision 22 | #48 | PepeTza | — | Docs only; generic errors outside, detail only in logs; criteria added to backend #18 (T17); client part in HU30 |
| 2026-11-19 | Segregate planar rotation from board geometry; keep Direction and Axis apart | #51 | PepeTza | 73 / 73 | `IPlanarRotation` (ISP); `Board.rotate` removed, its tests moved; type test checked only by `npm run typecheck` until CI (#6) |
| 2026-11-20 | Remove hexagonal defaults from the generic engine | #53 | PepeTza | 78 / 78 | DIP: no `= HexCoord`; hex files moved to `engine/hex/` with `HexBoard<TCell>`; lint rule forbids the generic engine importing `engine/hex/` (tests exempt) |
| 2026-11-20 | Cite external sources and keep a references list | #50 | PepeTza | — | Red Blob Games cited in `hex-coord.ts`; README References; gate 4 and `log-ai-usage` check sources; backend twin of the skill pending |
| 2026-11-20 | Piece catalog as data | #29 | PepeTza | 98 / 98 | `PieceShape`, `Piece`, `PieceCatalog` in `engine/pieces/`; `translate` added to `IBoardGeometry`; 21 shapes in `hex-pieces.json`; `docs/piece-catalog.md` draws them and the 27 alternatives; `equals` kept (#56 for `key()`) |
| 2026-11-20 | Create every remaining issue with its dependencies | #101 | PepeTza | — | Docs only; I2 to buffer: client #58–#100, backend #26–#36, each with `Blocked by`; plan §3 and CONTRIBUTING §7 updated; backend twin |
| 2026-11-21 | Game engine, rules template and domain events | #27 | PepeTza | 116 / 116 | `GameEngine` (atomic moves on a board copy, D-22 session states, Observer, `preview`), `BaseGameRules` (Template Method), `IScoringPolicy<TResolution>`; built without the planned mob, walkthrough for the team instead |
| 2026-11-21 | Interchangeable piece sources and seeded random | #28 | PepeTza | 140 / 140 | `IRandomSource` + `SeededRandom` (`mulberry32`, Prototype `clone()`), `IPieceSource<TPiece>` + `FixedPieceSource` and `RandomPieceSource` (uniform and weighted); swapping source or scoring does not touch `GameEngine` |
| 2026-11-21 | Allow admin panel to import application layer | #46 | PepeTza | 9 / 9 panel, 141 / 141 app | `@application` alias in `admin/` (tsconfig, Vite, ESLint); relative `src/` paths stay forbidden; `src/application` forbids external packages (D-19); fixed stale `HexGeometry` import in `admin/src/App.tsx` from #53 |
| 2026-11-21 | Generic game use cases and logging aspect | #30 | PepeTza | 161 / 161 | `IVariantFactory` + `VariantFactoryRegistry`, `PlayerProgress` + `IProgressModel`, `SeedConfig`, layer-2 ports, `StartGameUseCase`, `ApplyMoveUseCase`, `FinishGameUseCase` and `LoggingUseCaseDecorator` (AOP, 100 % line coverage in `src/application`) |
