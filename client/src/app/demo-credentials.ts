import { InjectionToken } from '@angular/core';

export interface DemoCredentials {
  username: string;
  password: string;
}

export const DEMO_CREDENTIALS = new InjectionToken<DemoCredentials | null>('DEMO_CREDENTIALS');
