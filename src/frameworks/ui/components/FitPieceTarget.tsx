import type { BoardPoint } from '@adapters/presentation/board/board-projection';
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  PanResponder,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface FitPieceTargetProps {
  readonly label: string;
  readonly hint?: string;
  readonly selected: boolean;
  readonly style: StyleProp<ViewStyle>;
  readonly onPress: () => void;
  readonly onDrag?: (delta: BoardPoint) => void;
  readonly onDrop?: (delta: BoardPoint) => void;
  readonly onCancel: () => void;
  readonly children?: ReactNode;
}

export function FitPieceTarget({
  label,
  hint,
  selected,
  style,
  onPress,
  onDrag,
  onDrop,
  onCancel,
  children,
}: FitPieceTargetProps) {
  const callbacks = useRef({ onDrag, onDrop, onCancel });
  useLayoutEffect(() => {
    callbacks.current = { onDrag, onDrop, onCancel };
  }, [onDrag, onDrop, onCancel]);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
          callbacks.current.onDrag !== undefined && Math.hypot(dx, dy) > 6,
        onPanResponderMove: (_, { dx, dy }) =>
          callbacks.current.onDrag?.({ x: dx, y: dy }),
        onPanResponderRelease: (_, { dx, dy }) =>
          callbacks.current.onDrop?.({ x: dx, y: dy }),
        onPanResponderTerminate: () => callbacks.current.onCancel(),
      }),
    [],
  );
  return (
    <View style={style} {...pan.panHandlers}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={FILL}
      >
        {children}
      </Pressable>
    </View>
  );
}

const FILL = { flex: 1 };
