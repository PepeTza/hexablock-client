import { LoginUseCase } from '@application/use-cases/login';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { HttpAuthService } from './http-auth-service';

const root = document.getElementById('root');
if (!root) {
  throw new Error('index.html has no #root element');
}

const apiUrl = String(import.meta.env.VITE_API_URL ?? '/api/v1');
const login = new LoginUseCase(new HttpAuthService(apiUrl), 'admin');

createRoot(root).render(
  <StrictMode>
    <App login={login} />
  </StrictMode>,
);
