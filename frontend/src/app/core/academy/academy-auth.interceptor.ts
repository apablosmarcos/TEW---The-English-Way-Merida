import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AcademySessionStore } from './academy-session.store';

export function isAcademyRequest(url: string, origin = globalThis.location.origin) {
  const target = new URL(url, origin);
  return target.origin === origin && target.pathname.startsWith('/api/academy/');
}

export const academyAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AcademySessionStore);
  const router = inject(Router);

  if (!isAcademyRequest(request.url)) return next(request);

  const token = session.token;
  const authenticatedRequest = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

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
};
