import type { ComponentType } from 'react';

import type { GameResultInput } from '@adapters/presentation/game-result/game-result-view-model';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { GameResultScreen } from '../screens/GameResultScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LevelSelectionScreen } from '../screens/LevelSelectionScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VariantPlaceholderScreen } from '../screens/VariantPlaceholderScreen';
import type { RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Optional initial navigation settings used in tests and deep-entry flows. */
export interface RootNavigatorProps {
  readonly initialRouteName?: keyof RootStackParamList;
  readonly initialResultParams?: GameResultInput;
  readonly variantComponent?: ComponentType<
    NativeStackScreenProps<RootStackParamList, 'Variant'>
  >;
}

/** Application stack navigator declaring home, level selection, variant, settings and result routes (D-20). */
export function RootNavigator({
  initialRouteName = 'Home',
  initialResultParams,
  variantComponent = VariantPlaceholderScreen,
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
          name="LevelSelection"
          component={LevelSelectionScreen}
          options={({ route }) => ({ title: route.params.name })}
        />
        <Stack.Screen
          name="Variant"
          component={variantComponent}
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
