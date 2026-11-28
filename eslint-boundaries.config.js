// Layer and variant boundaries of Clean Architecture (issue #8).
//
// Each block uses ESLint's built-in `no-restricted-imports` rule, so a
// forbidden import is a lint error in the editor, in the pre-commit hook and
// in CI. The table it enforces is in docs/implementation-plan.md §4; the
// layers are explained in docs/architecture.md §2.
//
// This file is CommonJS so that both eslint.config.mjs and the Jest test
// (eslint-boundaries.test.ts) can load it.
const fs = require('node:fs');
const path = require('node:path');

const FILES = '**/*.{ts,tsx}';

/**
 * Matches an import of one of `layers`, written with its alias
 * (`@frameworks/...`) or with a relative path that climbs up to it
 * (`../../frameworks/...`).
 *
 * @param {string[]} layers
 * @returns {string}
 */
function layerImportRegex(layers) {
  return `^(@|(\\.\\./)+)(${layers.join('|')})(/|$)`;
}

/**
 * Restriction for a layer: it cannot import the layers outside it.
 *
 * @param {string[]} outerLayers
 * @param {string} layer
 */
function outerLayersPattern(outerLayers, layer) {
  return {
    regex: layerImportRegex(outerLayers),
    message: `The ${layer} layer cannot import ${outerLayers.join(', ')}: dependencies only point inwards (docs/architecture.md §2).`,
  };
}

// `no-restricted-imports` has no "any external package" option, so inner
// layers forbid every specifier that is not relative (`./`, `../`) and not a
// layer alias. The alias of an outer layer (`@frameworks/...`) or `@test/...`
// is left to its dedicated pattern below, so it is reported once with its own
// message.
const EXTERNAL_PACKAGE_REGEX =
  '^(?!\\.{1,2}/|@(domain|application|adapters|frameworks|test)/)';

// Clean Architecture Ch. 28 (The Test Boundary): production code under src/
// never imports test suites or the Testing API under test/.
const TEST_BOUNDARY_PATTERN = {
  regex: '^(@test|(\\.\\./)+test)(/|$)',
  message:
    'Production code cannot import from test/ or @test/*: tests are an external component (The Test Boundary, Clean Architecture Ch. 28).',
};

const DOMAIN_EXTERNAL_PACKAGE_PATTERN = {
  regex: EXTERNAL_PACKAGE_REGEX,
  message:
    'The domain cannot import external packages or outer layers: it is plain TypeScript (ADR-03).',
};

const APPLICATION_EXTERNAL_PACKAGE_PATTERN = {
  regex: EXTERNAL_PACKAGE_REGEX,
  message:
    'The application layer cannot import external packages: it is plain TypeScript so the admin panel can import it in a browser (D-19).',
};

const DOMAIN_PATTERNS = [
  TEST_BOUNDARY_PATTERN,
  DOMAIN_EXTERNAL_PACKAGE_PATTERN,
  outerLayersPattern(['application', 'adapters', 'frameworks'], 'domain'),
];

// Dependency inversion inside the engine (issue #53): the generic engine
// (geometry/, board/ and the rest of engine/) never imports a concrete
// geometry; the hexagonal one in engine/hex/ imports the generic engine, never
// the reverse. Test files are exempt: they use the hexagonal geometry as a
// real example of the generic classes.
const CONCRETE_GEOMETRY_PATTERN = {
  regex: '^(@domain/engine/|(\\.{1,2}/)+)hex(/|$)',
  message:
    'The generic engine cannot import the hexagonal geometry: concrete geometries depend on the engine, not the reverse (DIP, docs/architecture.md §3).',
};

/**
 * Restriction for one variant: it cannot import any other variant, by alias
 * (`@domain/variants/hexa-sort/...`) or by relative path
 * (`../hexa-sort/...`). It can still import `engine/` and its own files.
 *
 * @param {string} variant
 * @param {string[]} variants
 */
function otherVariantsPattern(variant, variants) {
  const others = variants.filter((name) => name !== variant).join('|');
  return {
    regex: `^(@domain/variants/|(\\.\\./)+(variants/)?)(${others})(/|$)`,
    message: `The ${variant} variant cannot import another variant; shared code belongs in the engine (docs/EXTENSIBILITY.md).`,
  };
}

/**
 * Builds the boundary blocks of the ESLint flat config.
 *
 * In a flat config, the last block that matches a file replaces the options
 * of a rule set by an earlier block instead of adding to them. That is why
 * each variant block repeats the domain patterns.
 *
 * @param {string[]} variants names of the folders in src/domain/variants
 * @returns {import('eslint').Linter.Config[]}
 */
function layerBoundaries(variants) {
  const restrict = (patterns) => ({
    'no-restricted-imports': ['error', { patterns }],
  });

  const variantBlocks =
    variants.length < 2
      ? []
      : variants.map((variant) => ({
          files: [`src/domain/variants/${variant}/${FILES}`],
          rules: restrict([
            ...DOMAIN_PATTERNS,
            otherVariantsPattern(variant, variants),
          ]),
        }));

  return [
    { files: [`src/domain/${FILES}`], rules: restrict(DOMAIN_PATTERNS) },
    {
      files: [`src/domain/engine/${FILES}`],
      ignores: [`src/domain/engine/hex/${FILES}`],
      rules: restrict([...DOMAIN_PATTERNS, CONCRETE_GEOMETRY_PATTERN]),
    },
    ...variantBlocks,
    {
      files: [`src/application/${FILES}`],
      rules: restrict([
        TEST_BOUNDARY_PATTERN,
        APPLICATION_EXTERNAL_PACKAGE_PATTERN,
        outerLayersPattern(['adapters', 'frameworks'], 'application'),
      ]),
    },
    {
      files: [`src/adapters/${FILES}`],
      rules: restrict([
        TEST_BOUNDARY_PATTERN,
        outerLayersPattern(['frameworks'], 'adapters'),
      ]),
    },
    {
      files: [`src/frameworks/${FILES}`],
      rules: restrict([TEST_BOUNDARY_PATTERN]),
    },
  ];
}

/**
 * Reads the variant names from the folders of `variantsDir`, so a new
 * variant is protected without editing this file. Returns an empty list
 * while the folder does not exist.
 *
 * @param {string} variantsDir
 * @returns {string[]}
 */
function discoverVariants(variantsDir) {
  if (!fs.existsSync(variantsDir)) {
    return [];
  }
  return fs
    .readdirSync(variantsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const VARIANTS_DIR = path.join(__dirname, 'src', 'domain', 'variants');

module.exports = { layerBoundaries, discoverVariants, VARIANTS_DIR };
