import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { ServerStatusService } from '../services/server-status';

export const SLOW_REQUEST_MS = 3000;

export const slowRequestInterceptor: HttpInterceptorFn = (req, next) => {
  const serverStatus = inject(ServerStatusService);
  let slow = false;

  const timer = setTimeout(() => {
    slow = true;
    serverStatus.slowRequestStarted();
  }, SLOW_REQUEST_MS);

  return next(req).pipe(
    finalize(() => {
      clearTimeout(timer);
      if (slow) {
        serverStatus.slowRequestFinished();
      }
    }),
  );
};
