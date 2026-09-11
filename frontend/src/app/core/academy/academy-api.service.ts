import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildAcademyEndpoint } from './academy-endpoint';
import type { AcademyLogin, AcademyLoginInput, AcademyPasswordChangeInput, AcademySession, AcademySuccess } from './academy-types';

export class AcademyApiService {
  private readonly http: HttpClient;

  constructor(http: HttpClient = inject(HttpClient)) {
    this.http = http;
  }

  login(apiBaseUrl: string, username: string, password: string) {
    const body: AcademyLoginInput = { username, password };
    return this.http.post<AcademySuccess<AcademyLogin>>(buildAcademyEndpoint(apiBaseUrl, 'login'), body);
  }

  session(apiBaseUrl: string, token: string) {
    return this.http.get<AcademySuccess<AcademySession>>(buildAcademyEndpoint(apiBaseUrl, 'session'), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  logout(apiBaseUrl: string, token: string) {
    return this.http.post<void>(buildAcademyEndpoint(apiBaseUrl, 'logout'), null, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  changePassword(apiBaseUrl: string, token: string, currentPassword: string, newPassword: string) {
    const body: AcademyPasswordChangeInput = { currentPassword, newPassword };
    return this.http.post<void>(buildAcademyEndpoint(apiBaseUrl, 'me/password'), body, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

Injectable({ providedIn: 'root' })(AcademyApiService);
