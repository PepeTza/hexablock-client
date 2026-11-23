import { BoardShape } from '@domain/engine/board/board-shape';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { cellCenter, findDropCenter, pointToCell } from './hex-projection';
import type { Axial, Point } from './hex-projection';

const BOARD_RADIUS = 4;
const BOARD = BoardShape.ofRadius(new HexGeometry(), BOARD_RADIUS).coords.map(
  ({ q, r }) => ({ q, r }),
);
const PIECE = [
  { q: 0, r: 0 },
  { q: 1, r: 0 },
  { q: 0, r: 1 },
];
const ZERO = { x: 0, y: 0 };
const SNAP_DURATION_MS = 150;

function makePath(cells: readonly Axial[], origin: Point, size: number) {
  const builder = Skia.PathBuilder.Make();

  for (const cell of cells) {
    const center = cellCenter(cell, origin, size);
    for (let side = 0; side < 6; side++) {
      const angle = (Math.PI / 180) * (60 * side - 30);
      const x = center.x + (size - 2) * Math.cos(angle);
      const y = center.y + (size - 2) * Math.sin(angle);
      if (side === 0) {
        builder.moveTo(x, y);
      } else {
        builder.lineTo(x, y);
      }
    }
    builder.close();
  }

  return builder.build();
}

/** SPIKE: disposable device benchmark for Skia and drag gestures (#11). */
export default function SkiaSpikeScreen() {
  const { width, height } = useWindowDimensions();
  const edge = Math.min(width - 32, height * 0.6, 480);
  const size = edge / 16.5;
  const origin = { x: edge / 2, y: edge * 0.43 };
  const tray = { x: edge * 0.4, y: edge * 0.93 };
  const [lastDrop, setLastDrop] = useState('Ready');
  const [measurement, setMeasurement] = useState<string | null>(null);

  const x = useSharedValue(tray.x);
  const y = useSharedValue(tray.y);
  const startX = useSharedValue(tray.x);
  const startY = useSharedValue(tray.y);
  const eligible = useSharedValue(false);
  const dragging = useSharedValue(false);
  const elapsed = useSharedValue(0);
  const frameCount = useSharedValue(0);

  const boardPath = useMemo(
    () => makePath(BOARD, { x: edge / 2, y: edge * 0.43 }, size),
    [edge, size],
  );
  const piecePath = useMemo(() => makePath(PIECE, ZERO, size), [size]);
  const transform = useDerivedValue(() => [
    { translateX: x.value },
    { translateY: y.value },
  ]);

  useFrameCallback(({ timeSincePreviousFrame }) => {
    if (dragging.value && timeSincePreviousFrame !== null) {
      elapsed.value += timeSincePreviousFrame;
      frameCount.value += 1;
    }
  });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onBegin((event) => {
      const touched = pointToCell(
        { x: event.x, y: event.y },
        { x: x.value, y: y.value },
        size,
      );
      eligible.value = PIECE.some(
        (cell) => cell.q === touched.q && cell.r === touched.r,
      );
    })
    .onStart(() => {
      if (!eligible.value) return;
      startX.value = x.value;
      startY.value = y.value;
      elapsed.value = 0;
      frameCount.value = 0;
      dragging.value = true;
    })
    .onUpdate((event) => {
      if (!dragging.value) return;
      x.value = startX.value + event.translationX;
      y.value = startY.value + event.translationY;
    })
    .onFinalize((_event, success) => {
      if (!dragging.value) return;
      dragging.value = false;
      const target = success
        ? findDropCenter({ x: x.value, y: y.value }, origin, size, BOARD, PIECE)
        : null;
      x.value = withTiming(target?.x ?? tray.x, { duration: SNAP_DURATION_MS });
      y.value = withTiming(target?.y ?? tray.y, { duration: SNAP_DURATION_MS });
      scheduleOnRN(
        setLastDrop,
        target === null ? 'Returned to tray' : 'Snapped',
      );
      if (elapsed.value > 0) {
        const fps = ((frameCount.value * 1000) / elapsed.value).toFixed(1);
        scheduleOnRN(
          setMeasurement,
          `${fps} FPS · ${frameCount.value} frames · ${Math.round(elapsed.value)} ms`,
        );
      }
    });

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.screen}>
        <Text style={styles.title}>Skia board probe</Text>
        <Text style={styles.caption}>61 cells · Drag the blue piece</Text>
        <GestureDetector gesture={pan}>
          <View
            collapsable={false}
            style={{ width: edge, height: edge + size }}
          >
            <Canvas style={StyleSheet.absoluteFill}>
              <Path path={boardPath} color="#dce6ef" />
              <Group transform={transform}>
                <Path path={piecePath} color="#2458ad" />
              </Group>
            </Canvas>
          </View>
        </GestureDetector>
        <Text style={styles.caption}>{lastDrop}</Text>
        <Text style={styles.caption}>
          {measurement ?? 'Drag to measure FPS'}
        </Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
    backgroundColor: '#f8fafc',
  },
  title: { color: '#15243b', fontSize: 22, fontWeight: '700' },
  caption: { color: '#43556b', marginTop: 6, fontSize: 15 },
});
