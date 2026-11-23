import type { BoardPoint } from '@adapters/presentation/board/board-projection';
import { View } from 'react-native';

const ROTATIONS = ['0deg', '60deg', '120deg'];

export function HexCell({
  point,
  size,
  color,
}: {
  point: BoardPoint;
  size: number;
  color: string;
}) {
  const width = Math.sqrt(3) * size;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: point.x - width / 2,
        top: point.y - size,
        width,
        height: 2 * size,
      }}
    >
      {ROTATIONS.map((rotate) => (
        <View
          key={rotate}
          style={{
            position: 'absolute',
            top: size / 2,
            width,
            height: size,
            backgroundColor: color,
            transform: [{ rotate }],
          }}
        />
      ))}
    </View>
  );
}
