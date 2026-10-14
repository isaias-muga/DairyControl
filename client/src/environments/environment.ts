import type { DemoCredentials } from '../app/demo-credentials';

export const environment = {
  apiUrl: '/api',
  demoCredentials: { username: 'admin', password: 'demodemo123' } as DemoCredentials | null,
};
