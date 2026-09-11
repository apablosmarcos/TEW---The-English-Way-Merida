import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import { SiteConfigService } from '../services/site-config.service';
import { AcademySessionStore } from './academy-session.store';
import type { AcademyUser } from './academy-types';

export function academyDestination(user: AcademyUser) {
  if (user.mustChangePassword) return '/academia/cambiar-contrasena';
  return user.role === 'admin' ? '/academia/admin/publicaciones' : '/academia';
}

function restoredAcademySession() {
  const config = inject(SiteConfigService);
  const session = inject(AcademySessionStore);

  return config.load().pipe(
    switchMap((state) => {
      if (state.status === 'error' || !state.config.apiBaseUrl) {
        session.clear();
        return of(null);
      }
      return session.restore(state.config.apiBaseUrl);
    }),
  );
}

export const academyAnonymousGuard: CanActivateFn = () => {
  const router = inject(Router);
  return restoredAcademySession().pipe(map((session) => (session ? router.parseUrl(academyDestination(session.user)) : true)));
};

export const academyAuthenticatedGuard: CanActivateFn = () => {
  const router = inject(Router);
  return restoredAcademySession().pipe(
    map((session) => (session ? (session.user.mustChangePassword ? router.parseUrl(academyDestination(session.user)) : true) : router.parseUrl('/academia/acceso'))),
  );
};

export const academyForcedChangeGuard: CanActivateFn = () => {
  const router = inject(Router);
  return restoredAcademySession().pipe(
    map((session) => (!session ? router.parseUrl('/academia/acceso') : session.user.mustChangePassword || router.parseUrl(academyDestination(session.user)))),
  );
};

export const academyParentGuard: CanActivateFn = () => {
  const router = inject(Router);
  return restoredAcademySession().pipe(
    map((session) => {
      if (!session) return router.parseUrl('/academia/acceso');
      const { user } = session;
      if (user.mustChangePassword) return router.parseUrl(academyDestination(user));
      return user.role === 'parent' || router.parseUrl(academyDestination(user));
    }),
  );
};

export const academyAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return restoredAcademySession().pipe(
    map((session) => {
      if (!session) return router.parseUrl('/academia/acceso');
      const { user } = session;
      if (user.mustChangePassword) return router.parseUrl(academyDestination(user));
      return user.role === 'admin' || router.parseUrl(academyDestination(user));
    }),
  );
};
