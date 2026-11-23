import type { BoardPoint } from '@adapters/presentation/board/board-projection';
import { HexBoardProjection } from '@adapters/presentation/board/hex-board-projection';
import type { LinesPlacementPreview } from '@adapters/presentation/hexa-lines/lines-placement-preview';
import type { HexCoord } from '@domain/engine/hex/hex-coord';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { RootStackParamList } from '../navigation/routes';
import { useServices } from '../services/ServicesContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Variant'>;
const ORIGIN = { x: 0, y: 0 };
const ROTATIONS = ['0deg', '60deg', '120deg'];

function Cell({
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

interface TrayPieceProps {
  readonly slot: number;
  readonly cells: readonly HexCoord[];
  readonly center: BoardPoint;
  readonly size: number;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onDrag: (point: BoardPoint) => void;
  readonly onDrop: (point: BoardPoint) => void;
  readonly onCancel: () => void;
}

function TrayPiece({
  slot,
  cells,
  center,
  size,
  selected,
  onSelect,
  onDrag,
  onDrop,
  onCancel,
}: TrayPieceProps) {
  const callbacks = useRef({ onDrag, onDrop, onCancel });
  useLayoutEffect(() => {
    callbacks.current = { onDrag, onDrop, onCancel };
  }, [onDrag, onDrop, onCancel]);
  const pan = useMemo(() => {
    const point = (dx: number, dy: number) => ({
      x: center.x + dx,
      y: center.y + dy,
    });
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.hypot(gesture.dx, gesture.dy) > 6,
      onPanResponderMove: (_, gesture) =>
        callbacks.current.onDrag(point(gesture.dx, gesture.dy)),
      onPanResponderRelease: (_, gesture) =>
        callbacks.current.onDrop(point(gesture.dx, gesture.dy)),
      onPanResponderTerminate: () => callbacks.current.onCancel(),
    });
  }, [center.x, center.y]);
  const projection = new HexBoardProjection(center, size * 0.63);
  return (
    <>
      {cells.map((coord) => (
        <Cell
          key={coord.key()}
          point={projection.centerOf(coord)}
          size={size * 0.55}
          color={selected ? '#2e826d' : '#2859aa'}
        />
      ))}
      <View
        {...pan.panHandlers}
        style={{
          position: 'absolute',
          left: center.x - size * 2.25,
          top: center.y - 2 * size,
          width: size * 4.5,
          height: size * 4,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Piece ${slot + 1}`}
          accessibilityState={{ selected }}
          onPress={onSelect}
          style={styles.trayTouch}
        />
      </View>
    </>
  );
}

interface DragState {
  readonly point: BoardPoint;
  readonly slot: number;
  readonly anchor: HexCoord;
  readonly preview: LinesPlacementPreview;
}

export function LinesGameScreen({ navigation }: Props) {
  const { startLines } = useServices();
  const [game] = useState(startLines);
  const [view, setView] = useState(() => game.view);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [message, setMessage] = useState(
    'Choose a piece or drag it onto the board.',
  );
  const { width, height } = useWindowDimensions();
  const edge = Math.max(64, Math.min(width - 20, (height - 220) * 0.85, 480));
  const size = edge / 16.5;
  const projection = new HexBoardProjection(
    { x: edge / 2, y: size * 7.2 },
    size,
  );
  const ghostProjection = new HexBoardProjection(drag?.point ?? ORIGIN, size);
  const ghostCells = drag ? view.tray[drag.slot] : null;

  function place(slot: number, anchor: HexCoord) {
    setDrag(null);
    if (!game.place(slot, anchor)) {
      setMessage('That piece does not fit there.');
      return;
    }
    setSelected(null);
    setView(game.view);
    setMessage('Choose a piece or drag it onto the board.');
    const finish = game.finishIfOver();
    if (finish !== null) {
      void finish
        .then((result) => {
          navigation.replace('GameResult', {
            gameId: 'hexa-lines',
            variantName: 'Hexa Lines',
            levelId: null,
            result,
          });
        })
        .catch(() => setMessage('Game over. The result could not be saved.'));
    }
  }

  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.score}>
        Score: {view.score}
      </Text>
      <View style={{ width: edge, height: size * 20 }}>
        {view.board.map(({ coord, occupied }) => {
          const center = projection.centerOf(coord);
          const clearing = drag?.preview.clearing.some((cell) =>
            cell.equals(coord),
          );
          const preview = drag?.preview.cells.some((cell) =>
            cell.equals(coord),
          );
          const color = clearing
            ? '#e3a745'
            : preview
              ? drag?.preview.valid
                ? '#66b693'
                : '#d56b6b'
              : occupied
                ? '#2859aa'
                : '#cfd9e8';
          return (
            <Fragment key={coord.key()}>
              <Cell point={center} size={size * 0.91} color={color} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Cell ${coord.key()}`}
                onPress={() => {
                  if (selected !== null) place(selected, coord);
                }}
                style={{
                  position: 'absolute',
                  left: center.x - size * 0.73,
                  top: center.y - size * 0.72,
                  width: size * 1.46,
                  height: size * 1.44,
                }}
              />
            </Fragment>
          );
        })}
        {view.tray.map(
          (cells, slot) =>
            cells && (
              <TrayPiece
                key={slot}
                slot={slot}
                cells={cells}
                center={{ x: (edge * (slot + 0.5)) / 3, y: size * 16.6 }}
                size={size}
                selected={selected === slot}
                onSelect={() => {
                  setSelected(slot);
                  setMessage('Choose a cell on the board.');
                }}
                onDrag={(point) => {
                  const anchor = projection.coordAt(point);
                  setDrag((previous) => ({
                    point,
                    slot,
                    anchor,
                    preview:
                      previous?.slot === slot && previous.anchor.equals(anchor)
                        ? previous.preview
                        : game.preview(slot, anchor),
                  }));
                }}
                onDrop={(point) => place(slot, projection.coordAt(point))}
                onCancel={() => setDrag(null)}
              />
            ),
        )}
        {ghostCells?.map((coord) => (
          <Cell
            key={coord.key()}
            point={ghostProjection.centerOf(coord)}
            size={size * 0.87}
            color={drag?.preview.valid ? '#4eaa84b0' : '#db6b6ba8'}
          />
        ))}
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  trayTouch: { flex: 1 },
  screen: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    backgroundColor: '#f4f7fb',
  },
  score: { fontSize: 24, color: '#17243c', fontWeight: '700' },
  status: {
    fontSize: 15,
    color: '#465671',
    paddingHorizontal: 16,
    textAlign: 'center',
  },
});
