# HexaBlock Suite

<!-- Badges: added when CI is set up (build status, tests, coverage). -->
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

> **Status:** pre-implementation. The repository currently holds the
> documentation, contribution rules and agent harness. Code starts in the next
> iteration.

## Description

HexaBlock Suite is a mobile app (React Native + TypeScript) with four casual
puzzle games on hexagonal boards — **Hexa Lines**, **Hexa Fit**,
**Hexa Sort** and **Hexa Merge** — built on **a single generic engine**. Each
game is a variant that plugs its own rules into the engine instead of
duplicating the board, rendering, persistence or game flow.

The repository also contains the **admin web panel** (`admin/`), where levels
are designed and validated with the same domain code as the game.

Accounts, progress sync, leaderboards and level content are served by the
[backend](https://github.com/PepeTza/hexablock-backend) (NestJS + PostgreSQL).

## Demo / Screenshots

_Coming soon: screenshots or GIFs of the four variants._

## Architecture

_Coming soon._ Clean Architecture with four layers (entities, use cases,
interface adapters, frameworks & drivers) and DDD bounded contexts. The layer
diagram will be embedded here; sources in [`docs/`](./docs).

## Generic Engine

_Coming soon._ Generic types of the engine (`Board<TCell>`,
`GameEngine<TCell, TMove, TState>`, bounded generics such as
`TTile extends IMergeable<TTile>`), their constraints and how each variant
instantiates them. See [`docs/EXTENSIBILITY.md`](./docs/EXTENSIBILITY.md).

## Design Patterns

_Coming soon:_ table of the patterns implemented, with a short description and
a link to the code.

## SOLID Principles

_Coming soon:_ how each principle is applied, with code examples.

## AOP

_Coming soon:_ aspects implemented (logging, security, error handling with
retries, caching) and the decorator-based strategy used.

## Getting Started

Prerequisites: Node.js 22.13 or newer, and an Android phone with the Expo Go
app or an Android emulator.

```bash
npm install     # installs dependencies and activates the git hooks
npm start       # starts Expo; scan the QR code with Expo Go
npm run android # starts Expo and opens an Android emulator or device
```

## Running Tests

```bash
npm test               # unit and UI tests
npm run test:coverage  # same, with the 80 % coverage threshold
npm run lint           # ESLint
npm run format:check   # Prettier
npm run typecheck      # TypeScript strict mode
```

## AI Usage Documentation

See [`AI_USAGE.md`](./AI_USAGE.md). AI agents follow [`AGENTS.md`](./AGENTS.md)
and the [`harness/`](./harness/README.md).

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md): Conventional Commits, branch
workflow (GitHub Flow, protected `main`) and pull request process.

## License

[MIT](./LICENSE)
