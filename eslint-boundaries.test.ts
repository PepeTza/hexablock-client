import { Linter } from 'eslint';

import { layerBoundaries } from './eslint-boundaries.config';

// Fixture: the boundary rules are run on small snippets with a fake file
// name, so no file with a forbidden import exists in the repository. The
// variant names are passed in, because src/domain/variants does not exist yet.
const VARIANTS = ['hexa-fit', 'hexa-sort'];

const config: Linter.Config[] = [
  { files: ['**/*.{ts,tsx}'] },
  ...layerBoundaries(VARIANTS),
];

function lint(filename: string, code: string): string[] {
  const linter = new Linter();
  return linter
    .verify(code, config, { filename })
    .map((message) => message.ruleId ?? message.message);
}

const RESTRICTED = 'no-restricted-imports';

describe('layer boundaries', () => {
  it('should_report_error_when_domain_imports_external_package', () => {
    // Arrange
    const code = "import { useState } from 'react';";

    // Act
    const errors = lint('src/domain/engine/board.ts', code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_report_error_when_domain_imports_application_by_relative_path', () => {
    // Arrange
    const code =
      "import { StartGame } from '../../application/use-cases/start-game';";

    // Act
    const errors = lint('src/domain/engine/board.ts', code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_report_error_when_domain_imports_frameworks_by_alias', () => {
    // Arrange
    const code =
      "import { HomeScreen } from '@frameworks/ui/screens/HomeScreen';";

    // Act
    const errors = lint('src/domain/engine/board.ts', code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_pass_when_domain_imports_relative_file_or_domain_alias', () => {
    // Arrange
    const code = [
      "import { Coord } from './geometry/coord';",
      "import { GameState } from '../engine/state/game-state';",
      "import { Board } from '@domain/engine/board/board';",
    ].join('\n');

    // Act
    const errors = lint('src/domain/engine/board.ts', code);

    // Assert
    expect(errors).toEqual([]);
  });

  it('should_report_error_when_application_imports_adapters', () => {
    // Arrange
    const code =
      "import { SqliteProgressRepository } from '../../adapters/persistence/sqlite-progress-repository';";

    // Act
    const errors = lint('src/application/use-cases/finish-game.ts', code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_report_error_when_application_imports_frameworks', () => {
    // Arrange
    const code = "import { db } from '@frameworks/storage/sqlite-database';";

    // Act
    const errors = lint('src/application/use-cases/finish-game.ts', code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_pass_when_application_imports_domain', () => {
    // Arrange
    const code = [
      "import { PlayerProgress } from '@domain/progress/player-progress';",
      "import { IProgressRepository } from '../ports/progress-repository';",
    ].join('\n');

    // Act
    const errors = lint('src/application/use-cases/finish-game.ts', code);

    // Assert
    expect(errors).toEqual([]);
  });

  it('should_report_error_when_adapters_import_frameworks', () => {
    // Arrange
    const code =
      "import { db } from '../../frameworks/storage/sqlite-database';";

    // Act
    const errors = lint(
      'src/adapters/persistence/sqlite-progress-repository.ts',
      code,
    );

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_pass_when_adapters_import_application_and_domain', () => {
    // Arrange
    const code = [
      "import { IProgressRepository } from '@application/ports/progress-repository';",
      "import { PlayerProgress } from '../../domain/progress/player-progress';",
    ].join('\n');

    // Act
    const errors = lint(
      'src/adapters/persistence/sqlite-progress-repository.ts',
      code,
    );

    // Assert
    expect(errors).toEqual([]);
  });

  it('should_report_error_when_variant_imports_another_variant', () => {
    // Arrange
    const code = [
      "import { SortRules } from '../hexa-sort/sort-rules';",
      "import { ColorStack } from '@domain/variants/hexa-sort/color-stack';",
    ].join('\n');

    // Act
    const errors = lint('src/domain/variants/hexa-fit/fit-rules.ts', code);

    // Assert
    expect(errors).toEqual([RESTRICTED, RESTRICTED]);
  });

  it('should_pass_when_variant_imports_engine_or_own_files', () => {
    // Arrange
    const code = [
      "import { Board } from '../../engine/board/board';",
      "import { Coord } from '@domain/engine/geometry/coord';",
      "import { FitLevel } from './fit-level';",
    ].join('\n');

    // Act
    const errors = lint('src/domain/variants/hexa-fit/fit-rules.ts', code);

    // Assert
    expect(errors).toEqual([]);
  });

  it('should_report_error_when_variant_imports_external_package', () => {
    // Arrange
    const code = "import { Canvas } from '@shopify/react-native-skia';";

    // Act
    const errors = lint('src/domain/variants/hexa-fit/fit-rules.ts', code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_pass_when_frameworks_import_any_layer_or_package', () => {
    // Arrange
    const code = [
      "import { View } from 'react-native';",
      "import { SqliteProgressRepository } from '@adapters/persistence/sqlite-progress-repository';",
      "import { FinishGame } from '../application/use-cases/finish-game';",
      "import { Board } from '@domain/engine/board/board';",
    ].join('\n');

    // Act
    const errors = lint('src/frameworks/composition-root.ts', code);

    // Assert
    expect(errors).toEqual([]);
  });
});
