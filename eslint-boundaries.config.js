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

// `no-restricted-imports` has no "any external package" option, so the
// domain forbids every specifier that is not relative (`./`, `../`) and not a
// layer alias. The alias of an outer layer (`@frameworks/...`) is left to
// the layer pattern below, so it is reported once, with its own message.
const EXTERNAL_PACKAGE_PATTERN = {
  regex: '^(?!\\.{1,2}/|@(domain|application|adapters|frameworks)/)',
  message:
    'The domain cannot import external packages or outer layers: it is plain TypeScript (ADR-03).',
};

const DOMAIN_PATTERNS = [
  EXTERNAL_PACKAGE_PATTERN,
  outerLayersPattern(['application', 'adapters', 'frameworks'], 'domain'),
];

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
    ...variantBlocks,
    {
      files: [`src/application/${FILES}`],
      rules: restrict([
        outerLayersPattern(['adapters', 'frameworks'], 'application'),
      ]),
    },
    {
      files: [`src/adapters/${FILES}`],
      rules: restrict([outerLayersPattern(['frameworks'], 'adapters')]),
    },
    // src/frameworks has no restriction: it is the outermost layer.
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
