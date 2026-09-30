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
export const ACADEMY_ERROR_CODES = [
  'INVALID_CREDENTIALS',
  'AUTHENTICATION_REQUIRED',
  'PASSWORD_CHANGE_REQUIRED',
  'FORBIDDEN',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'LAST_ACTIVE_ADMIN',
  'USER_DELETED',
  'USER_NOT_FOUND',
  'USERNAME_TAKEN',
  'CATEGORY_IN_USE',
  'CATEGORY_NAME_TAKEN',
  'CATEGORY_NOT_FOUND',
  'POST_DELETED',
  'POST_NOT_FOUND',
  'ATTACHMENT_DELETED',
  'ATTACHMENT_LIMIT',
  'ATTACHMENT_NOT_FOUND',
  'UNSUPPORTED_FILE_TYPE',
  'UPLOAD_TOO_LARGE',
] as const;
export type AcademyErrorCode = (typeof ACADEMY_ERROR_CODES)[number];
export type AcademyError = { ok: false; error: { code: AcademyErrorCode; message: string } };
export type AcademyLoginInput = { username: string; password: string };
export type AcademyPasswordChangeInput = { currentPassword: string; newPassword: string };
export type AcademyCategory = { id: string; displayName: string };
export type AcademyPostVisibility = 'visible' | 'hidden' | 'deleted';
export type AcademyAdminAttachment = {
  id: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  visibleTitle: string | null;
  materialOrdinal: number;
  extension: 'pdf' | 'jpg' | 'png' | 'webp';
  deletedAt: string | null;
};
export type AcademyAdminPostSummary = {
  id: string;
  title: string;
  categoryId: string | null;
  category: AcademyCategory | null;
  visibility: AcademyPostVisibility;
  publishedAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
export type AcademyAdminPostDetail = AcademyAdminPostSummary & {
  markdownSource: string;
  attachments: AcademyAdminAttachment[];
};
export type AcademyAdminPostList = { items: AcademyAdminPostSummary[] };
export type AcademyAdminPostInput = { title: string; markdownSource: string; categoryId: string | null };
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
export type AcademyAdminUserInput = { displayName: string; username: string };
export type AcademyAdminUserPassword = { temporaryPassword: string };
export type AcademyAdminUserCreated = AcademyAdminUserPassword & { user: AcademyAdminUser };
export type AcademyAdminUserList = {
  items: AcademyAdminUser[];
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
};
