import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { adminBoundaries } from './eslint-boundaries.js';

// Fixture: the boundary rule runs on small snippets with a fake file name, so
// no file with a forbidden import exists in the repository.
const config: Linter.Config[] = [{ files: ['**/*.{ts,tsx}'] }, adminBoundaries];

function lint(code: string): string[] {
  const linter = new Linter();
  return linter
    .verify(code, config, { filename: 'src/editors/LevelEditor.tsx' })
    .map((message) => message.ruleId ?? message.message);
}

const RESTRICTED = 'no-restricted-imports';

describe('admin panel import boundary', () => {
  it('should_allow_an_import_from_the_domain_alias', () => {
    // Arrange
    const code =
      "import { BoardShape } from '@domain/engine/board/board-shape';";

    // Act
    const errors = lint(code);

    // Assert
    expect(errors).toEqual([]);
  });

  it('should_allow_an_external_package', () => {
    // Arrange
    const code = "import { useState } from 'react';";

    // Act
    const errors = lint(code);

    // Assert
    expect(errors).toEqual([]);
  });

  it('should_report_an_error_when_admin_imports_the_mobile_ui', () => {
    // Arrange
    const code =
      "import { HomeScreen } from '../../../src/frameworks/ui/screens/HomeScreen';";

    // Act
    const errors = lint(code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_report_an_error_when_admin_imports_a_react_native_package', () => {
    // Arrange
    const code = "import { View } from 'react-native';";

    // Act
    const errors = lint(code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_allow_an_import_from_the_application_alias', () => {
    // Arrange
    const code =
      "import { StartGameUseCase } from '@application/use-cases/start-game';";

    // Act
    const errors = lint(code);

    // Assert
    expect(errors).toEqual([]);
  });

  it('should_report_an_error_when_admin_imports_the_adapters_layer', () => {
    // Arrange
    const code =
      "import { SqliteProgressRepository } from '@adapters/persistence/sqlite-progress-repository';";

    // Act
    const errors = lint(code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_report_an_error_when_admin_reaches_the_domain_by_relative_path', () => {
    // Arrange
    const code =
      "import { BoardShape } from '../../../src/domain/engine/board/board-shape';";

    // Act
    const errors = lint(code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });

  it('should_report_an_error_when_admin_reaches_application_by_relative_path', () => {
    // Arrange
    const code =
      "import { StartGameUseCase } from '../../../src/application/use-cases/start-game';";

    // Act
    const errors = lint(code);

    // Assert
    expect(errors).toEqual([RESTRICTED]);
  });
});
