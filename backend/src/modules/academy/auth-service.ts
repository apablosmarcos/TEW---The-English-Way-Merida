import { createHash, randomBytes } from "node:crypto";

import { AcademyAuthError } from "./academy-errors.ts";
import { AuthRepository } from "./auth-repository.ts";
import type { AcademyLogin, AcademySession } from "./academy-types.ts";
import { hashPassword, verifyPassword } from "./password.ts";

const sessionMs = 8 * 60 * 60 * 1000;
const dummyPasswordHash = hashPassword("academy-login-dummy-password");

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly clock: () => Date;

  constructor(repository: AuthRepository, clock = () => new Date()) {
    this.repository = repository;
    this.clock = clock;
  }

  async login(username: string, password: string): Promise<AcademyLogin> {
    const stored = this.repository.findLoginUser(normalizeUsername(username));
    const passwordHash = stored && !stored.disabledAt ? stored.passwordHash : await dummyPasswordHash;
    const passwordMatches = await verifyPassword(password, passwordHash);
    if (!stored || !!stored.disabledAt || !passwordMatches) throw failed();
    const now = this.clock();
    const token = randomBytes(32).toString("base64url");
    const expiresAt = expiry(now);
    this.repository.createSession(hashToken(token), stored.id, now.toISOString(), expiresAt);
    return { token, expiresAt, mustChangePassword: !!stored.mustChangePassword, user: publicUser(stored) };
  }

  getSession(token: string): AcademySession {
    const now = this.clock();
    return this.repository.resolveSession(hashToken(token), now.toISOString(), expiry(now)) ?? unauthenticated();
  }

  logout(token: string) {
    this.repository.deleteSession(hashToken(token));
  }

  async changeOwnPassword(token: string, currentPassword: string, newPassword: string) {
    const session = this.getSession(token);
    const stored = this.repository.findLoginUser(normalizeUsername(session.user.username));
    if (!stored || !await verifyPassword(currentPassword, stored.passwordHash)) throw failed();
    this.repository.changePasswordAndRevoke(stored.id, await hashPassword(newPassword), this.clock().toISOString());
  }
}

export function normalizeUsername(username: string) {
  return username.trim().normalize("NFC").toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiry(now: Date) {
  return new Date(now.getTime() + sessionMs).toISOString();
}

function publicUser(user: { id: string; displayName: string; username: string; role: "parent" | "admin" }) {
  return { id: user.id, displayName: user.displayName, username: user.username, role: user.role };
}

function failed(): never {
  throw new AcademyAuthError("INVALID_CREDENTIALS");
}

function unauthenticated(): never {
  throw new AcademyAuthError("AUTHENTICATION_REQUIRED");
}
