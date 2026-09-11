export type AcademyHttpErrorCode = "INVALID_CREDENTIALS" | "AUTHENTICATION_REQUIRED" | "PASSWORD_CHANGE_REQUIRED" | "FORBIDDEN" | "VALIDATION_ERROR" | "RATE_LIMITED" | "INTERNAL_ERROR";

const messages: Record<AcademyHttpErrorCode, string> = {
  INVALID_CREDENTIALS: "Invalid username or password.",
  AUTHENTICATION_REQUIRED: "Authentication is required.",
  PASSWORD_CHANGE_REQUIRED: "You must change your password.",
  FORBIDDEN: "You do not have permission to perform this action.",
  VALIDATION_ERROR: "The request is invalid.",
  RATE_LIMITED: "Too many login attempts. Please try again later.",
  INTERNAL_ERROR: "An unexpected error occurred.",
};

export function academyErrorBody(code: AcademyHttpErrorCode) {
  return { ok: false as const, error: { code, message: messages[code] } };
}

export class AcademyAuthError extends Error {
  readonly code: "INVALID_CREDENTIALS" | "AUTHENTICATION_REQUIRED";

  constructor(code: AcademyAuthError["code"]) {
    super(code);
    this.code = code;
  }
}

export class AcademyUserError extends Error {
  readonly code: "LAST_ACTIVE_ADMIN" | "USER_DELETED" | "USER_NOT_FOUND" | "USERNAME_TAKEN";

  constructor(code: "LAST_ACTIVE_ADMIN" | "USER_DELETED" | "USER_NOT_FOUND" | "USERNAME_TAKEN") {
    super(code);
    this.code = code;
  }
}

export class AcademyPublicationError extends Error {
  readonly code: "CATEGORY_IN_USE" | "CATEGORY_NAME_TAKEN" | "CATEGORY_NOT_FOUND" | "POST_DELETED" | "POST_NOT_FOUND";
  constructor(code: AcademyPublicationError["code"]) { super(code); this.code = code; }
}

export class AttachmentError extends Error {
  readonly code: "ATTACHMENT_DELETED" | "ATTACHMENT_LIMIT" | "ATTACHMENT_NOT_FOUND" | "POST_DELETED" | "POST_NOT_FOUND" | "UNSUPPORTED_FILE_TYPE" | "UPLOAD_TOO_LARGE" | "VALIDATION_ERROR";
  constructor(code: AttachmentError["code"]) { super(code); this.code = code; }
}
