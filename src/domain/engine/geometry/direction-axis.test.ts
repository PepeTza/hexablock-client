import { HexCoord } from './hex-coord';
import { HexAxis, HexDirection, HexGeometry } from './hex-geometry';

// These tests check two things. The `@ts-expect-error` lines are checked by
// `npm run typecheck`: if a Direction were accepted where an Axis is expected
// (or the reverse), the directive would be unused and the type check would
// fail. The assertions check that the runtime guard of `HexGeometry` still
// rejects the mix-up when the compiler is bypassed.
describe('Direction and Axis', () => {
  const geometry = new HexGeometry();
  const onlyOrigin = (cell: HexCoord): boolean => cell.equals(HexCoord.ORIGIN);

  it('should_reject_direction_when_axis_is_expected', () => {
    // Arrange
    const direction = HexDirection.EAST;

    // Act
    const act = () =>
      // @ts-expect-error a Direction is not an Axis
      geometry.line(HexCoord.ORIGIN, direction, onlyOrigin);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it('should_reject_axis_when_direction_is_expected', () => {
    // Arrange
    const axis = HexAxis.R;

    // Act
    // @ts-expect-error an Axis is not a Direction
    const act = () => geometry.neighbour(HexCoord.ORIGIN, axis);

    // Assert
    expect(act).toThrow(RangeError);
  });
});
