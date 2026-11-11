import { StatusBar } from 'expo-status-bar';

import { HomeScreen } from './src/frameworks/ui/screens/HomeScreen';

/** Application root. It only mounts the first screen; it holds no game logic. */
export default function App() {
  return (
    <>
      <HomeScreen />
      <StatusBar style="auto" />
    </>
  );
}
