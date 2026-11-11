---
name: design-level
description: Design and validate a Hexa Fit or Hexa Sort level as a JSON file of HexaBlock Suite. Use when creating the bundled levels (15 Fit, 10 Sort) or checking a level before it is published from the admin panel.
---

# Design a level

Levels are data (ADR-07): one JSON file per level, bundled with the app in
`levels/hexa-fit/` or `levels/hexa-sort/`, and validated by the game's own
validators. Published levels are **immutable** and only appended at the end
of the order (RN-37), so a level must be right before it ships.

## 1. Before you start

- The level `spec` format is defined in the backend
  [`docs/api-contracts.md`](https://github.com/PepeTza/hexablock-backend/blob/main/docs/api-contracts.md)
  §6. **If it is still marked TBD, stop**: the schema is decided in its own
  task (T24 of [`docs/implementation-plan.md`](../../../docs/implementation-plan.md)).
- How a bundled level gets its `levelId` is decision 9 of the plan (proposal:
  a fixed UUID in the file, reused by the server's seed script). Until it is
  decided, ask instead of choosing.

## 2. Difficulty curve

- **Hexa Fit (RN-19):** difficulty grows with the size and shape of the
  figure, always with catalog pieces (D-07). The pieces' total area equals the
  figure's area (RN-13). Star thresholds for 2 and 3 stars go in the file
  (RN-18).
- **Hexa Sort (RN-25):** difficulty grows with the number of colours, the
  height and mix of the stacks and the number of goals. The seed mode is
  **not** part of the level: it lives in the seed configuration (RN-05).
- Check the new level against its neighbours in the order: it must not be
  easier than the previous one.

## 3. Validate

- Run the validator of the variant through its test (`aaa-test` skill): Fit
  checks the area and searches for a solution (RN-13); Sort checks free cells,
  at least one colour and at least one goal.
- A level that fails validation is not added. Record the reason and fix the
  design.
- For Fit, look at the solution the validator found and check the level
  cannot be solved in an unintended trivial way.

## 4. Add it

- One file per level, in `levels/<game-id>/`, with a name that keeps the
  order obvious (the exact convention is set by the first level task).
- A test loads every file of the folder and validates it, so a broken level
  fails CI.
- The PR description says, for each new level, what makes it harder than the
  previous one.
