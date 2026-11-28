import { loadHexPieceCatalog } from '@domain/engine/hex/hex-piece-catalog';

// The catalog has no two shapes that are the same turned (PieceCatalog
// rejects them). There are exactly 1, 1, 3 and 10 shapes of 1 to 4 cells when
// mirror images count apart (OEIS A006534, https://oeis.org/A006534), so having those counts proves
// that every one of them is in the catalog.
describe('hex piece catalog', () => {
  const sizes = (size: number): number =>
    loadHexPieceCatalog().shapes.filter((shape) => shape.size === size).length;

  it('should_have_1_1_3_10_shapes_when_sizes_are_1_to_4', () => {
    // Arrange
    const expected = [1, 1, 3, 10];

    // Act
    const counts = [1, 2, 3, 4].map(sizes);

    // Assert
    expect(counts).toEqual(expected);
  });

  it('should_have_6_shapes_when_size_is_5', () => {
    // Arrange
    const expected = 6;

    // Act
    const count = sizes(5);

    // Assert
    expect(count).toBe(expected);
  });

  it('should_load_bundled_catalog_without_errors', () => {
    // Arrange
    const load = () => loadHexPieceCatalog();

    // Act
    const catalog = load();

    // Assert
    expect(catalog.shapes).toHaveLength(21);
    expect(catalog.has('p5-22')).toBe(true);
  });
});
