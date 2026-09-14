export type AcademyRole = 'parent' | 'admin';

export type AcademyUser = {
  displayName: string;
  username: string;
  role: AcademyRole;
  mustChangePassword: boolean;
};

export type AcademySession = {
  expiresAt: string;
  user: AcademyUser;
};

export type AcademyLogin = AcademySession & { token: string };
export type AcademySuccess<T> = { ok: true; data: T };
export type AcademyErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'AUTHENTICATION_REQUIRED'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';
export type AcademyError = { ok: false; error: { code: AcademyErrorCode; message: string } };
export type AcademyLoginInput = { username: string; password: string };
export type AcademyPasswordChangeInput = { currentPassword: string; newPassword: string };
export type AcademyCategory = { id: string; displayName: string };
export type AcademyParentPost = { id: string; title: string; category: AcademyCategory | null; publishedAt: string; updatedAt: string };
export type AcademyParentAttachment = {
  id: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  visibleTitle: string | null;
  materialOrdinal: number;
};
export type AcademyParentPostDetail = AcademyParentPost & {
  renderedMarkdown: string;
  attachments: AcademyParentAttachment[];
};
export type AcademyParentPostQuery = { search: string; categoryId: string | null; page: number };
export type AcademyParentPostList = {
  categories: AcademyCategory[];
  items: AcademyParentPost[];
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
};
export type AcademyAdminUser = AcademyUser & {
  id: string;
  state: 'active' | 'disabled' | 'deleted';
  createdAt: string;
  updatedAt: string;
};
export type AcademyAdminUserQuery = { search: string; role: AcademyRole | null; state: AcademyAdminUser['state'] | null; page: number };
export type AcademyAdminUserList = {
  items: AcademyAdminUser[];
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
};
