import type { FinishGameOutput } from '@application/use-cases/finish-game';
import { useFocusEffect } from '@react-navigation/native';
import type {
  BoardPoint,
  BoardProjectionFactory,
} from '@adapters/presentation/board/board-projection';
import type { FitGamePresenter } from '@adapters/presentation/hexa-fit/fit-game-presenter';
import type { ICoord } from '@domain/engine/geometry/coord';
import type { PieceId } from '@domain/variants/hexa-fit/fit-state';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { FitPieceTarget } from '../components/FitPieceTarget';
import { HexCell } from '../components/HexCell';
import type { RootStackParamList } from '../navigation/routes';
import { useServices } from '../services/ServicesContext';

type PiecePalette = readonly [string, ...string[]];
type Props = NativeStackScreenProps<RootStackParamList, 'Variant'> & {
  readonly piecePalette?: PiecePalette;
};
type Drag<TCoord extends ICoord> = {
  readonly id: PieceId;
  readonly anchor: TCoord;
  readonly preview: ReturnType<FitGamePresenter<TCoord>['preview']>;
};
const DEFAULT_PIECE_PALETTE: PiecePalette = [
  '#2859aa',
  '#9c4e2a',
  '#6b489b',
  '#117c75',
  '#963c65',
  '#647134',
];
const INSTRUCTIONS = 'Drag a piece or tap it, then choose a cell.';

interface FitGameViewProps<TCoord extends ICoord> {
  readonly navigation: Props['navigation'];
  readonly piecePalette: PiecePalette;
  readonly game: FitGamePresenter<TCoord>;
  readonly createProjection: BoardProjectionFactory<TCoord>;
}

export function FitGameScreen({
  navigation,
  piecePalette = DEFAULT_PIECE_PALETTE,
}: Props) {
  const { startFit, createBoardProjection } = useServices();
  const [game] = useState(startFit);
  return (
    <FitGameView
      navigation={navigation}
      piecePalette={piecePalette}
      game={game}
      createProjection={createBoardProjection}
    />
  );
}

function FitGameView<TCoord extends ICoord>({
  navigation,
  piecePalette,
  game,
  createProjection,
}: FitGameViewProps<TCoord>) {
  const pieceColor = (id: PieceId) =>
    piecePalette[id % piecePalette.length] ?? piecePalette[0];
  const [view, setView] = useState(() => game.view);
  const [result, setResult] = useState<FinishGameOutput | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (result !== null) {
        navigation.replace('GameResult', {
          gameId: 'hexa-fit',
          variantName: 'Hexa Fit demo',
          levelId: game.levelId,
          result,
        });
      }
    }, [game.levelId, navigation, result]),
  );
  const [selected, setSelected] = useState<PieceId | null>(null);
  const [drag, setDrag] = useState<Drag<TCoord> | null>(null);
  const [message, setMessage] = useState(INSTRUCTIONS);
  const { width, height } = useWindowDimensions();
  const size = Math.max(16, Math.min(38, (width - 24) / 7, (height - 240) / 7));
  const edge = Math.min(width - 24, 440);
  const trayTop = size * 3;
  const projection = createProjection({ x: edge / 2, y: size * 1.35 }, size);
  const selectedPlacement = view.placed.find(({ id }) => id === selected);

  function run(action: () => string | null | void, keepSelection = false) {
    const error = action();
    setDrag(null);
    if (error) {
      setMessage(error);
      return;
    }
    setView(game.view);
    if (!keepSelection) setSelected(null);
    setMessage(keepSelection ? 'Choose a cell on the board.' : INSTRUCTIONS);
    const finish = game.finishIfOver();
    if (finish !== null) {
      void finish
        .then((result) => {
          if (result.kind === 'left') {
            setMessage('Figure complete. The result could not be loaded.');
            return;
          }
          setResult(result.value);
        })
        .catch(() =>
          setMessage('Figure complete. The result could not be loaded.'),
        );
    }
  }

  function select(id: PieceId | null) {
    setSelected(id);
    setMessage(id === null ? INSTRUCTIONS : 'Choose a cell on the board.');
  }

  function pointFrom(origin: BoardPoint, delta: BoardPoint): BoardPoint {
    return { x: origin.x + delta.x, y: origin.y + delta.y };
  }

  function dragTo(id: PieceId, origin: BoardPoint, delta: BoardPoint) {
    const point = pointFrom(origin, delta);
    if (point.y >= trayTop) {
      setDrag(null);
      return;
    }
    const anchor = projection.coordAt(point);
    setDrag((previous) =>
      previous?.id === id && previous.anchor.key() === anchor.key()
        ? previous
        : { id, anchor, preview: game.preview(id, anchor) },
    );
  }

  function drop(
    id: PieceId,
    origin: BoardPoint,
    delta: BoardPoint,
    fromBoard: boolean,
  ) {
    const point = pointFrom(origin, delta);
    if (point.y >= trayTop) {
      if (
        fromBoard &&
        point.y <= size * 6.8 &&
        point.x >= 0 &&
        point.x <= edge
      ) {
        run(() => game.remove(id));
      } else {
        setDrag(null);
      }
      return;
    }
    run(() => game.place(id, projection.coordAt(point)));
  }

  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        Fit demo
      </Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>Moves: {view.moveCount}</Text>
        <FitClock game={game} />
      </View>
      <View style={{ width: edge, height: size * 6.8 }}>
        {view.board.map(({ coord, pieceId }) => {
          const center = projection.centerOf(coord);
          const placement = view.placed.find(({ id }) => id === pieceId);
          const origin = placement
            ? projection.centerOf(placement.anchor)
            : center;
          const highlighted = drag?.preview.cells.some(
            (cell) => cell.key() === coord.key(),
          );
          const color = highlighted
            ? drag?.preview.valid
              ? '#66b693'
              : '#d56b6b'
            : pieceId === undefined
              ? '#cfd9e8'
              : pieceColor(pieceId);
          return (
            <Fragment key={coord.key()}>
              <HexCell point={center} size={size * 0.94} color={color} />
              <FitPieceTarget
                label={`Cell ${coord.key()}`}
                hint={pieceId === undefined ? 'Empty' : `Piece ${pieceId + 1}`}
                selected={pieceId !== undefined && pieceId === selected}
                style={{
                  position: 'absolute',
                  left: center.x - size * 0.82,
                  top: center.y - size * 0.85,
                  width: size * 1.64,
                  height: size * 1.7,
                }}
                onPress={() => {
                  if (selected !== null) run(() => game.place(selected, coord));
                  else if (pieceId !== undefined) select(pieceId);
                }}
                onDrag={
                  pieceId === undefined
                    ? undefined
                    : (delta) => dragTo(pieceId, origin, delta)
                }
                onDrop={
                  pieceId === undefined
                    ? undefined
                    : (delta) => drop(pieceId, origin, delta, true)
                }
                onCancel={() => setDrag(null)}
              >
                {placement?.anchor.key() === coord.key() && (
                  <View pointerEvents="none" style={styles.boardNumber}>
                    <Text accessible={false} style={styles.cellNumber}>
                      {placement.id + 1}
                    </Text>
                  </View>
                )}
              </FitPieceTarget>
            </Fragment>
          );
        })}
        <View pointerEvents="none" style={[styles.tray, { top: trayTop }]}>
          <Text style={styles.trayLabel}>Tray</Text>
        </View>
        {view.tray.map(({ id, cells }) => {
          const slotWidth = edge / game.pieceCount;
          const center = { x: slotWidth * (id + 0.5), y: size * 5 };
          const pieceSize = size * 0.69;
          const trayProjection = createProjection(center, pieceSize);
          return (
            <Fragment key={id}>
              {cells.map((cell) => (
                <HexCell
                  key={cell.key()}
                  point={trayProjection.centerOf(cell)}
                  size={pieceSize * 0.94}
                  color={pieceColor(id)}
                />
              ))}
              <FitPieceTarget
                label={`Piece ${id + 1}`}
                selected={selected === id}
                style={[
                  styles.slot,
                  {
                    left: id * slotWidth + 4,
                    top: trayTop + size * 0.8,
                    width: slotWidth - 8,
                    height: size * 2.8,
                    borderColor: selected === id ? '#2859aa' : 'transparent',
                  },
                ]}
                onPress={() => select(id)}
                onDrag={(delta) => dragTo(id, center, delta)}
                onDrop={(delta) => drop(id, center, delta, false)}
                onCancel={() => setDrag(null)}
              >
                <View pointerEvents="none" style={styles.trayNumber}>
                  <Text accessible={false} style={styles.cellNumber}>
                    {id + 1}
                  </Text>
                </View>
              </FitPieceTarget>
            </Fragment>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Action
          label="Rotate"
          disabled={selected === null}
          onPress={() => {
            if (selected !== null) run(() => game.rotate(selected), true);
          }}
        />
        <Action
          label="Remove"
          disabled={selectedPlacement === undefined}
          onPress={() => {
            if (selectedPlacement !== undefined)
              run(() => game.remove(selectedPlacement.id));
          }}
        />
        <Action
          label="Cancel"
          disabled={selected === null}
          onPress={() => select(null)}
        />
        <Action
          label="Undo"
          disabled={!view.canUndo}
          onPress={() => run(() => game.undo())}
        />
        <Action
          label="Redo"
          disabled={!view.canRedo}
          onPress={() => run(() => game.redo())}
        />
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {message}
      </Text>
    </View>
  );
}

function FitClock<TCoord extends ICoord>({
  game,
}: {
  readonly game: FitGamePresenter<TCoord>;
}) {
  const [seconds, setSeconds] = useState(() =>
    Math.floor(game.durationMs / 1000),
  );
  useEffect(() => {
    const interval = setInterval(
      () => setSeconds(Math.floor(game.durationMs / 1000)),
      250,
    );
    return () => clearInterval(interval);
  }, [game]);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, '0');
  return (
    <Text style={styles.stat}>
      Time: {minutes}:{remainder}
    </Text>
  );
}

function Action({
  label,
  disabled,
  onPress,
}: {
  readonly label: string;
  readonly disabled: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, disabled && styles.disabled]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 14,
    backgroundColor: '#f4f7fb',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#17243c' },
  stats: { flexDirection: 'row', gap: 24, marginVertical: 8 },
  stat: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17243c',
    fontVariant: ['tabular-nums'],
  },
  tray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e4ebf5',
    borderRadius: 12,
  },
  trayLabel: { marginTop: 6, textAlign: 'center', color: '#465671' },
  slot: { position: 'absolute', borderWidth: 2, borderRadius: 10 },
  cellNumber: { color: '#fff', fontWeight: '700' },
  boardNumber: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  trayNumber: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    margin: 12,
  },
  action: {
    minHeight: 44,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#2859aa',
    borderRadius: 8,
  },
  disabled: { opacity: 0.43 },
  actionLabel: { color: '#fff', fontWeight: '600' },
  status: {
    fontSize: 15,
    color: '#465671',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
