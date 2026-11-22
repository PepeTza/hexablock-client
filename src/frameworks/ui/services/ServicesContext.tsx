import { createContext, type ReactNode, useContext } from 'react';

import type { AppServices } from '../../composition-root';

const ServicesContext = createContext<AppServices | null>(null);

/** Props for `ServicesProvider`. */
export interface ServicesProviderProps {
  readonly services: AppServices;
  readonly children: ReactNode;
}

/**
 * Dependency injection through React context: supplies pre-wired application
 * services from the composition root to screens without coupling views to
 * concrete adapters.
 */
export function ServicesProvider({
  services,
  children,
}: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

/** Reads the injected `AppServices`; throws if called outside `ServicesProvider`. */
export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (services === null) {
    throw new Error('useServices must be used inside ServicesProvider');
  }
  return services;
}
