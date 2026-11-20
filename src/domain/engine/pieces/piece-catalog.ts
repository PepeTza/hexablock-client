import type { ICoord } from '../geometry/coord';
import { PieceShape, type PieceGeometry } from './piece-shape';

/**
 * Reads one cell of the catalog data into a coordinate of the geometry, or
 * throws an error that names `path` (for example `shapes[2].cells[1]`). Each
 * geometry provides its own, because only it knows the components of its
 * coordinates.
 */
export type CellParser<TCoord extends ICoord> = (
  raw: unknown,
  path: string,
) => TCoord;

/**
 * The configurable list of piece shapes (RN-03, D-07), kept as data so a new
 * shape is a new entry and no code changes.
 *
 * Built only through `of` or `fromData`, which check the whole catalog: ids
 * are unique, no shape is larger than `maxCells`, and no shape is another one
 * turned (it would be the same piece twice). Each shape is checked by
 * `PieceShape.of`.
 */
export class PieceCatalog<TCoord extends ICoord> {
  private constructor(
    private readonly byId: ReadonlyMap<string, PieceShape<TCoord>>,
  ) {}

  static of<TCoord extends ICoord>(
    shapes: Iterable<PieceShape<TCoord>>,
    maxCells: number,
  ): PieceCatalog<TCoord> {
    const byId = new Map<string, PieceShape<TCoord>>();
    for (const shape of shapes) {
      if (byId.has(shape.id)) {
        throw new RangeError(`The catalog repeats the id ${shape.id}`);
      }
      if (shape.size > maxCells) {
        throw new RangeError(
          `Piece shape ${shape.id} has ${shape.size} cells; the maximum is ${maxCells}`,
        );
      }
      for (const existing of byId.values()) {
        if (shape.isRotationOf(existing)) {
          throw new RangeError(
            `Piece shapes ${existing.id} and ${shape.id} are the same shape turned`,
          );
        }
      }
      byId.set(shape.id, shape);
    }
    if (byId.size === 0) {
      throw new RangeError('The catalog needs at least one shape');
    }
    return new PieceCatalog(byId);
  }

  /**
   * The catalog read from JSON data shaped as
   * `{ "shapes": [{ "id": "p3-01", "cells": [<cell>, ...] }, ...] }`, where
   * `parseCell` reads each cell. Errors name the place in the data.
   */
  static fromData<TCoord extends ICoord>(
    data: unknown,
    geometry: PieceGeometry<TCoord>,
    parseCell: CellParser<TCoord>,
    maxCells: number,
  ): PieceCatalog<TCoord> {
    if (!isRecord(data) || !Array.isArray(data.shapes)) {
      throw new TypeError(
        'The catalog data must be an object with a "shapes" array',
      );
    }
    const shapes = data.shapes.map((entry: unknown, index) => {
      const path = `shapes[${index}]`;
      if (!isRecord(entry) || typeof entry.id !== 'string') {
        throw new TypeError(`${path} must be an object with a string "id"`);
      }
      if (!Array.isArray(entry.cells)) {
        throw new TypeError(`${path}.cells must be an array`);
      }
      const cells = entry.cells.map((raw: unknown, cell) =>
        parseCell(raw, `${path}.cells[${cell}]`),
      );
      return PieceShape.of(entry.id, cells, geometry);
    });
    return PieceCatalog.of(shapes, maxCells);
  }

  /** Every shape, in the order of the data. */
  get shapes(): readonly PieceShape<TCoord>[] {
    return [...this.byId.values()];
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  /** The shape with `id`. Throws when the catalog has no such shape. */
  get(id: string): PieceShape<TCoord> {
    const shape = this.byId.get(id);
    if (shape === undefined) {
      throw new RangeError(`The catalog has no piece shape ${id}`);
    }
    return shape;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
