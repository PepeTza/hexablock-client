import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { createAppServices } from './src/frameworks/composition-root';
import { RootNavigator } from './src/frameworks/ui/navigation/RootNavigator';
import { ServicesProvider } from './src/frameworks/ui/services/ServicesContext';

/** Application root. It wires dependencies and mounts navigation; it holds no game logic. */
export default function App() {
  const [services] = useState(createAppServices);

  return (
    <ServicesProvider services={services}>
      <RootNavigator />
      <StatusBar style="auto" />
    </ServicesProvider>
  );
}
