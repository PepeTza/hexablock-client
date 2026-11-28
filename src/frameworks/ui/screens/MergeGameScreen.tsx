import type { BoardProjectionFactory } from '@adapters/presentation/board/board-projection';
import { resolveHexSwipeDirection } from '@adapters/presentation/hexa-merge/hex-swipe-direction';
import type { MergeGamePresenter } from '@adapters/presentation/hexa-merge/merge-game-presenter';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import type { ICoord } from '@domain/engine/geometry/coord';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { HexCell } from '../components/HexCell';
import type { RootStackParamList } from '../navigation/routes';
import { useServices } from '../services/ServicesContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Variant'>;

interface TilePaletteEntry {
  readonly background: string;
  readonly text: string;
}

const EMPTY_CELL_COLOR = '#cfd9e8';
const DEFAULT_HIGH_TILE_STYLE: TilePaletteEntry = {
  background: '#1e293b',
  text: '#ffffff',
};
const TILE_PALETTE: Readonly<Record<number, TilePaletteEntry>> = {
  2: { background: '#e2e8f0', text: '#1e293b' },
  4: { background: '#cbd5e1', text: '#1e293b' },
  8: { background: '#f59e0b', text: '#ffffff' },
  16: { background: '#ea580c', text: '#ffffff' },
  32: { background: '#dc2626', text: '#ffffff' },
  64: { background: '#b91c1c', text: '#ffffff' },
  128: { background: '#ca8a04', text: '#ffffff' },
  256: { background: '#a16207', text: '#ffffff' },
  512: { background: '#0d9488', text: '#ffffff' },
  1024: { background: '#0284c7', text: '#ffffff' },
  2048: { background: '#4f46e5', text: '#ffffff' },
};
const SWIPE_INSTRUCTIONS =
  'Swipe in any of the 6 hex directions to slide tiles.';

function styleForTile(value: number): TilePaletteEntry {
  return TILE_PALETTE[value] ?? DEFAULT_HIGH_TILE_STYLE;
}

interface MergeGameViewProps<TCoord extends ICoord> {
  readonly navigation: Props['navigation'];
  readonly game: MergeGamePresenter<TCoord>;
  readonly createProjection: BoardProjectionFactory<TCoord>;
}

/** Passive screen for Hexa Merge: delegates seed loading to `AppServices` and renders `MergeGameView`. */
export function MergeGameScreen({ navigation }: Props) {
  const { startMerge, createBoardProjection, loadMergeSeed } = useServices();
  const [game, setGame] = useState(() => (loadMergeSeed ? null : startMerge()));

  useEffect(() => {
    if (!loadMergeSeed) return;
    let active = true;
    void loadMergeSeed()
      .catch(() => undefined)
      .then((seed) => {
        if (active) setGame(startMerge(seed));
      });
    return () => {
      active = false;
    };
  }, [loadMergeSeed, startMerge]);

  return game === null ? (
    <Text accessibilityLiveRegion="polite">Starting Hexa Merge…</Text>
  ) : (
    <MergeGameView
      navigation={navigation}
      game={game}
      createProjection={createBoardProjection}
    />
  );
}

function MergeGameView<TCoord extends ICoord>({
  navigation,
  game,
  createProjection,
}: MergeGameViewProps<TCoord>) {
  const [view, setView] = useState(() => game.view);
  const [result, setResult] = useState<FinishGameOutput | null>(null);
  const [message, setMessage] = useState(SWIPE_INSTRUCTIONS);

  useFocusEffect(
    useCallback(() => {
      if (result !== null) {
        navigation.replace('GameResult', {
          gameId: 'hexa-merge',
          variantName: 'Hexa Merge',
          levelId: null,
          result,
        });
      }
    }, [navigation, result]),
  );

  const handleSwipe = useCallback(
    (dx: number, dy: number) => {
      if (game.view.isOver) return;
      const direction = resolveHexSwipeDirection(dx, dy);
      if (direction === null) return;
      if (!game.slide(direction)) {
        setMessage('No tiles can move in that direction.');
        return;
      }
      setView(game.view);
      setMessage(SWIPE_INSTRUCTIONS);
      const finish = game.finishIfOver();
      if (finish !== null) {
        const showFinishError = () =>
          setMessage('Game over. The result could not be saved.');
        void finish
          .then((outcome) => outcome.fold(showFinishError, setResult))
          .catch(showFinishError);
      }
    },
    [game],
  );

  const handleUndo = useCallback(() => {
    if (!game.undo()) return;
    setView(game.view);
    setMessage('Last move undone.');
  }, [game]);

  const callbacks = useRef({ onSwipe: handleSwipe });
  useLayoutEffect(() => {
    callbacks.current = { onSwipe: handleSwipe };
  }, [handleSwipe]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.hypot(gesture.dx, gesture.dy) > 6,
        onPanResponderRelease: (_, gesture) =>
          callbacks.current.onSwipe(gesture.dx, gesture.dy),
      }),
    [],
  );

  const { width, height } = useWindowDimensions();
  const unitProjection = createProjection({ x: 0, y: 0 }, 1);
  const unitPoints = view.board.map(({ coord }) =>
    unitProjection.centerOf(coord),
  );
  const minX =
    unitPoints.length > 0 ? Math.min(...unitPoints.map((p) => p.x)) : 0;
  const maxX =
    unitPoints.length > 0 ? Math.max(...unitPoints.map((p) => p.x)) : 0;
  const minY =
    unitPoints.length > 0 ? Math.min(...unitPoints.map((p) => p.y)) : 0;
  const maxY =
    unitPoints.length > 0 ? Math.max(...unitPoints.map((p) => p.y)) : 0;
  const spanX = Math.max(2, maxX - minX + 2);
  const spanY = Math.max(2, maxY - minY + 2);
  const maxWidth = Math.max(120, Math.min(width - 24, 440));
  const maxHeight = Math.max(120, height - 260);
  const size = Math.min(maxWidth / spanX, maxHeight / spanY);
  const boardWidth = spanX * size;
  const boardHeight = spanY * size;
  const projection = createProjection(
    {
      x: boardWidth / 2 - ((minX + maxX) / 2) * size,
      y: boardHeight / 2 - ((minY + maxY) / 2) * size,
    },
    size,
  );

  return (
    <View style={styles.screen}>
      <View style={styles.stats}>
        <Text accessibilityRole="header" style={styles.score}>
          Score: {view.score}
        </Text>
        <Text style={styles.moves}>Moves: {view.moveCount}</Text>
      </View>
      {view.targetReached && (
        <Text accessibilityLiveRegion="polite" style={styles.targetNotice}>
          Target reached! Keep playing for a higher score.
        </Text>
      )}
      <View
        testID="merge-board"
        {...pan.panHandlers}
        style={{ width: boardWidth, height: boardHeight }}
      >
        {view.board.map(({ coord, value }) => {
          const center = projection.centerOf(coord);
          const tileStyle = value === null ? null : styleForTile(value);
          const cellSize = size * 0.92;
          return (
            <Fragment key={coord.key()}>
              <HexCell
                point={center}
                size={cellSize}
                color={tileStyle?.background ?? EMPTY_CELL_COLOR}
              />
              {value !== null && tileStyle !== null && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.tileLabelContainer,
                    {
                      left: center.x - cellSize * 0.85,
                      top: center.y - cellSize * 0.55,
                      width: cellSize * 1.7,
                      height: cellSize * 1.1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tileLabel,
                      {
                        color: tileStyle.text,
                        fontSize: Math.max(12, Math.round(size * 0.48)),
                      },
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              )}
            </Fragment>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Undo"
          disabled={!view.canUndo}
          onPress={handleUndo}
          style={[styles.action, !view.canUndo && styles.disabled]}
        >
          <Text style={styles.actionLabel}>Undo</Text>
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 18,
    backgroundColor: '#f4f7fb',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 20,
    marginBottom: 8,
  },
  score: { fontSize: 24, color: '#17243c', fontWeight: '700' },
  moves: {
    fontSize: 16,
    color: '#465671',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  targetNotice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  tileLabelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  action: {
    minHeight: 44,
    minWidth: 88,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#2859aa',
    borderRadius: 8,
  },
  disabled: { opacity: 0.43 },
  actionLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
  status: {
    fontSize: 15,
    color: '#465671',
    paddingHorizontal: 16,
    textAlign: 'center',
  },
});
