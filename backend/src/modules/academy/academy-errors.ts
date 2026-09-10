export class AcademyAuthError extends Error {
  readonly code: "AUTHENTICATION_FAILED" | "UNAUTHENTICATED";

  constructor(code: "AUTHENTICATION_FAILED" | "UNAUTHENTICATED") {
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
