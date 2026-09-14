import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildAcademyEndpoint } from './academy-endpoint';
import type { AcademyAdminUserCreated, AcademyAdminUserInput, AcademyAdminUserList, AcademyAdminUserPassword, AcademyAdminUserQuery, AcademyLogin, AcademyLoginInput, AcademyParentPostDetail, AcademyParentPostList, AcademyParentPostQuery, AcademyPasswordChangeInput, AcademySession, AcademySuccess } from './academy-types';

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

  listAdminUsers(apiBaseUrl: string, token: string, query: AcademyAdminUserQuery) {
    return this.http.get<AcademySuccess<AcademyAdminUserList>>(buildAcademyEndpoint(apiBaseUrl, 'admin/users'), {
      headers: { Authorization: `Bearer ${token}` },
      params: adminUserParams(query),
    });
  }

  createAdminUser(apiBaseUrl: string, token: string, input: AcademyAdminUserInput) {
    return this.http.post<AcademySuccess<AcademyAdminUserCreated>>(buildAcademyEndpoint(apiBaseUrl, 'admin/users'), input, { headers: { Authorization: `Bearer ${token}` } });
  }

  disableAdminUser(apiBaseUrl: string, token: string, id: string) {
    return this.http.patch<void>(buildAcademyEndpoint(apiBaseUrl, `admin/users/${id}`), { disabled: true }, { headers: { Authorization: `Bearer ${token}` } });
  }

  enableAdminUser(apiBaseUrl: string, token: string, id: string) {
    return this.http.post<void>(buildAcademyEndpoint(apiBaseUrl, `admin/users/${id}/enable`), null, { headers: { Authorization: `Bearer ${token}` } });
  }

  deleteAdminUser(apiBaseUrl: string, token: string, id: string) {
    return this.http.delete<void>(buildAcademyEndpoint(apiBaseUrl, `admin/users/${id}`), { headers: { Authorization: `Bearer ${token}` } });
  }

  resetAdminUserPassword(apiBaseUrl: string, token: string, id: string) {
    return this.http.post<AcademySuccess<AcademyAdminUserPassword>>(buildAcademyEndpoint(apiBaseUrl, `admin/users/${id}/reset-password`), null, { headers: { Authorization: `Bearer ${token}` } });
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

function adminUserParams(query: AcademyAdminUserQuery) {
  const params = {
    ...(query.search ? { search: query.search } : {}),
    ...(query.role ? { role: query.role } : {}),
    ...(query.state ? { state: query.state } : {}),
    ...(query.page > 1 ? { page: String(query.page) } : {}),
  };
  return new HttpParams({ fromObject: params });
}

Injectable({ providedIn: 'root' })(AcademyApiService);
