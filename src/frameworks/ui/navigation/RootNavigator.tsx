import type { GameResultInput } from '@adapters/presentation/game-result/game-result-view-model';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GameResultScreen } from '../screens/GameResultScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VariantPlaceholderScreen } from '../screens/VariantPlaceholderScreen';
import type { RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Optional initial navigation settings used in tests and deep-entry flows. */
export interface RootNavigatorProps {
  readonly initialRouteName?: keyof RootStackParamList;
  readonly initialResultParams?: GameResultInput;
}

/** Application stack navigator declaring home, variant, settings and result routes (D-20). */
export function RootNavigator({
  initialRouteName = 'Home',
  initialResultParams,
}: RootNavigatorProps = {}) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Variant"
          component={VariantPlaceholderScreen}
          options={({ route }) => ({ title: route.params.name })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="GameResult"
          component={GameResultScreen}
          options={{ headerShown: false }}
          initialParams={initialResultParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
