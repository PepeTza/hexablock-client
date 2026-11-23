import type { LevelDefinition, LevelSpec } from './level-definition';

/** Builder: checks common level data and takes an immutable snapshot (RN-37). */
export class LevelBuilder {
  /** Builds a published level from decoded JSON. Errors include the invalid field path. */
  static fromData(data: unknown): LevelDefinition {
    if (!isRecord(data)) {
      throw new TypeError('level must be a JSON object');
    }

    const id = readIdentifier(data.id, 'id');
    const gameId = readIdentifier(data.gameId, 'gameId');
    const order = readPositiveInteger(data.order, 'order');
    const schemaVersion = readPositiveInteger(
      data.schemaVersion,
      'schemaVersion',
    );
    const publishedAt = readPublishedAt(data.publishedAt);
    if (!isRecord(data.spec)) {
      throw new TypeError('spec must be a JSON object');
    }

    const spec = copyObject(data.spec, 'spec', new Set());
    return Object.freeze({
      id,
      gameId,
      order,
      schemaVersion,
      publishedAt,
      spec,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function readIdentifier(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}

function readPositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive safe integer`);
  }
  return value;
}

function readPublishedAt(value: unknown): string {
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(?:Z|\+00:00)$/u.test(value)
  ) {
    const instant = new Date(value);
    if (
      Number.isFinite(instant.getTime()) &&
      instant.toISOString().slice(0, 19) === value.slice(0, 19)
    ) {
      return value;
    }
  }
  throw new TypeError('publishedAt must be an ISO 8601 timestamp in UTC');
}

function copyObject(
  value: Record<string, unknown>,
  path: string,
  ancestors: Set<object>,
): LevelSpec {
  ancestors.add(value);
  const entries = Object.entries(value).map(
    ([key, entry]) =>
      [key, copyValue(entry, `${path}.${key}`, ancestors)] as const,
  );
  ancestors.delete(value);
  return Object.freeze(Object.fromEntries(entries));
}

function copyValue(
  value: unknown,
  path: string,
  ancestors: Set<object>,
): LevelSpec[string] {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'object' && ancestors.has(value)) {
    throw new TypeError(`${path} must not contain a circular reference`);
  }
  if (Array.isArray(value)) {
    ancestors.add(value);
    const items = Array.from(value, (item: unknown, index) =>
      copyValue(item, `${path}[${index}]`, ancestors),
    );
    ancestors.delete(value);
    return Object.freeze(items);
  }
  if (isRecord(value)) {
    return copyObject(value, path, ancestors);
  }
  throw new TypeError(`${path} must be a JSON value`);
}
