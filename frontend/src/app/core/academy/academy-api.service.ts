import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';

import { buildAcademyEndpoint } from './academy-endpoint';
import type { AcademyAdminAttachment, AcademyAdminPost, AcademyAdminPostInput, AcademyAdminPostList, AcademyAdminUserCreated, AcademyAdminUserInput, AcademyAdminUserList, AcademyAdminUserPassword, AcademyAdminUserQuery, AcademyCategory, AcademyLogin, AcademyLoginInput, AcademyParentPostDetail, AcademyParentPostList, AcademyParentPostQuery, AcademyPasswordChangeInput, AcademyPostVisibility, AcademySession, AcademySuccess } from './academy-types';

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

  listAdminPosts(apiBaseUrl: string, token: string, status: AcademyPostVisibility | null) {
    return this.http.get<AcademySuccess<AcademyAdminPostList>>(buildAcademyEndpoint(apiBaseUrl, 'admin/posts'), {
      headers: { Authorization: `Bearer ${token}` },
      params: new HttpParams({ fromObject: status ? { status } : {} }),
    });
  }

  getAdminPost(apiBaseUrl: string, token: string, id: string) {
    return this.http.get<AcademySuccess<AcademyAdminPost>>(buildAcademyEndpoint(apiBaseUrl, `admin/posts/${id}`), { headers: { Authorization: `Bearer ${token}` } });
  }

  createAdminPost(apiBaseUrl: string, token: string, input: AcademyAdminPostInput) {
    return this.http.post<AcademySuccess<AcademyAdminPost>>(buildAcademyEndpoint(apiBaseUrl, 'admin/posts'), input, { headers: { Authorization: `Bearer ${token}` } });
  }

  updateAdminPost(apiBaseUrl: string, token: string, id: string, input: AcademyAdminPostInput) {
    return this.http.patch<AcademySuccess<AcademyAdminPost>>(buildAcademyEndpoint(apiBaseUrl, `admin/posts/${id}`), input, { headers: { Authorization: `Bearer ${token}` } });
  }

  setAdminPostVisibility(apiBaseUrl: string, token: string, id: string, action: 'show' | 'hide') {
    return this.http.post<AcademySuccess<AcademyAdminPost>>(buildAcademyEndpoint(apiBaseUrl, `admin/posts/${id}/${action}`), null, { headers: { Authorization: `Bearer ${token}` } });
  }

  deleteAdminPost(apiBaseUrl: string, token: string, id: string) {
    return this.http.delete<void>(buildAcademyEndpoint(apiBaseUrl, `admin/posts/${id}`), { headers: { Authorization: `Bearer ${token}` } });
  }

  uploadAdminAttachment(apiBaseUrl: string, token: string, postId: string, form: FormData) {
    return this.http.post<AcademySuccess<AcademyAdminAttachment>>(buildAcademyEndpoint(apiBaseUrl, `admin/posts/${postId}/attachments`), form, { headers: { Authorization: `Bearer ${token}` } });
  }

  renameAdminAttachment(apiBaseUrl: string, token: string, id: string, title: string) {
    return this.http.patch<AcademySuccess<AcademyAdminAttachment>>(buildAcademyEndpoint(apiBaseUrl, `admin/attachments/${id}`), { title }, { headers: { Authorization: `Bearer ${token}` } });
  }

  deleteAdminAttachment(apiBaseUrl: string, token: string, id: string) {
    return this.http.delete<void>(buildAcademyEndpoint(apiBaseUrl, `admin/attachments/${id}`), { headers: { Authorization: `Bearer ${token}` } });
  }

  listCategories(apiBaseUrl: string, token: string) {
    return this.http.get<AcademySuccess<{ items: AcademyCategory[] }>>(buildAcademyEndpoint(apiBaseUrl, 'admin/categories'), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  createCategory(apiBaseUrl: string, token: string, displayName: string) {
    return this.http.post<AcademySuccess<AcademyCategory>>(buildAcademyEndpoint(apiBaseUrl, 'admin/categories'), { displayName }, { headers: { Authorization: `Bearer ${token}` } });
  }

  renameCategory(apiBaseUrl: string, token: string, id: string, displayName: string) {
    return this.http.patch<AcademySuccess<AcademyCategory>>(buildAcademyEndpoint(apiBaseUrl, `admin/categories/${id}`), { displayName }, { headers: { Authorization: `Bearer ${token}` } });
  }

  deleteCategory(apiBaseUrl: string, token: string, id: string) {
    return this.http.delete<void>(buildAcademyEndpoint(apiBaseUrl, `admin/categories/${id}`), { headers: { Authorization: `Bearer ${token}` } });
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
