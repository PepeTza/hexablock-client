import {
  LoadSeedConfigsUseCase,
  SaveSeedConfigUseCase,
} from '@application/use-cases/seed-settings';
import { LoginUseCase } from '@application/use-cases/login';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { HttpSeedConfigRepository } from './http-seed-config-repository';
import { HttpAuthService } from './http-auth-service';
import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('index.html has no #root element');
}

const apiUrl = String(import.meta.env.VITE_API_URL ?? '/api/v1');
const login = new LoginUseCase(new HttpAuthService(apiUrl), 'admin');

createRoot(root).render(
  <StrictMode>
    <App
      login={login}
      seedSettingsFor={({ accessToken }) => {
        const repository = new HttpSeedConfigRepository(apiUrl, accessToken);
        return {
          load: new LoadSeedConfigsUseCase(repository),
          save: new SaveSeedConfigUseCase(repository),
        };
      }}
    />
  </StrictMode>,
);
