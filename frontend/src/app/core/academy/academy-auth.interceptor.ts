import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { SiteConfigService } from '../services/site-config.service';
import { isAcademyRequest } from './academy-http-policy';
import { AcademySessionStore } from './academy-session.store';

export const academyAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const target = new URL(request.url, globalThis.location.origin);
  if (!target.pathname.includes('/academy/')) return next(request);

  const config = inject(SiteConfigService);
  const session = inject(AcademySessionStore);
  const router = inject(Router);

  return config.load().pipe(
    switchMap((state) => {
      if (
        state.status === 'error' ||
        !state.config.apiBaseUrl ||
        !isAcademyRequest(request.url, state.config.apiBaseUrl)
      ) return next(request);

      const token = session.token;
      const authenticatedRequest = token
        ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : request;

      return next(authenticatedRequest).pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            session.clear();
            void router.navigateByUrl('/academia/acceso');
          } else if (
            error instanceof HttpErrorResponse &&
            error.status === 403 &&
            error.error?.error?.code === 'PASSWORD_CHANGE_REQUIRED'
          ) {
            void router.navigateByUrl('/academia/cambiar-contrasena');
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};
