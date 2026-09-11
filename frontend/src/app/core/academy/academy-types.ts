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
