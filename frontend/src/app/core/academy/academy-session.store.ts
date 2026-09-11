import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';

import { AcademyApiService } from './academy-api.service';
import type { AcademyLogin, AcademySession } from './academy-types';

const TOKEN_KEY = 'tew.academy.token';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export class AcademySessionStore {
  readonly user = signal<AcademySession['user'] | null>(null);
  readonly expiresAt = signal<string | null>(null);

  private readonly api: AcademyApiService;
  private readonly storage: StorageLike;

  constructor(api: AcademyApiService = inject(AcademyApiService), storage: StorageLike = globalThis.sessionStorage) {
    this.api = api;
    this.storage = storage;
  }

  get token() {
    try {
      return this.storage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  login(apiBaseUrl: string, username: string, password: string) {
    return this.api.login(apiBaseUrl, username, password).pipe(
      tap(({ data }) => this.setSession(data.token, data)),
      map(({ data }) => data),
    );
  }

  restore(apiBaseUrl: string) {
    const token = this.token;
    if (!token) {
      this.clear();
      return of(null);
    }
    return this.api.session(apiBaseUrl, token).pipe(
      tap(({ data }) => this.setSession(token, data)),
      map(({ data }) => data),
      catchError(() => {
        this.clear();
        return of(null);
      }),
    );
  }

  logout(apiBaseUrl: string) {
    const token = this.token;
    this.clear();
    return token ? this.api.logout(apiBaseUrl, token).pipe(catchError(() => of(void 0))) : of(void 0);
  }

  clear() {
    this.user.set(null);
    this.expiresAt.set(null);
    try {
      this.storage.removeItem(TOKEN_KEY);
    } catch {
      // Session storage may be unavailable; in-memory state is already cleared.
    }
  }

  private setSession(token: string, session: AcademySession | AcademyLogin) {
    this.user.set(session.user);
    this.expiresAt.set(session.expiresAt);
    try {
      this.storage.setItem(TOKEN_KEY, token);
    } catch {
      // Session storage may be unavailable; keep the authenticated state in memory.
    }
  }
}

Injectable({ providedIn: 'root' })(AcademySessionStore);
