import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/routes';
import { useServices } from '../services/ServicesContext';
import { GameResultView } from './GameResultView';

type GameResultScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'GameResult'
>;

/**
 * Container screen for victory and defeat results: maps `FinishGameOutput`
 * via `GameResultPresenter` and translates player choices into navigation
 * actions (RF-16, CU-07).
 */
export function GameResultScreen({ navigation, route }: GameResultScreenProps) {
  const { gameResult } = useServices();
  const viewModel = gameResult.present(route.params);
  const { gameId, variantName, levelId } = route.params;

  return (
    <GameResultView
      viewModel={viewModel}
      onRetry={() =>
        navigation.replace('Variant', {
          gameId,
          name: variantName,
          levelId,
        })
      }
      onNextLevel={(nextLevelId) =>
        navigation.replace('Variant', {
          gameId,
          name: variantName,
          levelId: nextLevelId,
        })
      }
      onNewGame={() =>
        navigation.replace('Variant', {
          gameId,
          name: variantName,
          levelId: null,
        })
      }
      onBackToMenu={() => navigation.navigate('Home')}
    />
  );
}
