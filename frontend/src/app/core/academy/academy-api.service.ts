import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildAcademyEndpoint } from './academy-endpoint';
import type { AcademyLogin, AcademyLoginInput, AcademyParentPostDetail, AcademyParentPostList, AcademyParentPostQuery, AcademyPasswordChangeInput, AcademySession, AcademySuccess } from './academy-types';

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

  listParentPosts(apiBaseUrl: string, token: string, query: AcademyParentPostQuery) {
    return this.http.get<AcademySuccess<AcademyParentPostList>>(buildAcademyEndpoint(apiBaseUrl, 'posts'), {
      headers: { Authorization: `Bearer ${token}` },
      params: parentPostParams(query),
    });
  }

  getParentPost(apiBaseUrl: string, token: string, id: string) {
    return this.http.get<AcademySuccess<AcademyParentPostDetail>>(buildAcademyEndpoint(apiBaseUrl, `posts/${id}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  previewAttachment(apiBaseUrl: string, token: string, id: string) {
    return this.http.get(buildAcademyEndpoint(apiBaseUrl, `attachments/${id}/preview`), {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
  }

  downloadAttachment(apiBaseUrl: string, token: string, id: string) {
    return this.http.get(buildAcademyEndpoint(apiBaseUrl, `attachments/${id}/download`), {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
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

function parentPostParams(query: AcademyParentPostQuery) {
  const params = {
    ...(query.search ? { search: query.search } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.page > 1 ? { page: String(query.page) } : {}),
  };
  return new HttpParams({ fromObject: params });
}

Injectable({ providedIn: 'root' })(AcademyApiService);
