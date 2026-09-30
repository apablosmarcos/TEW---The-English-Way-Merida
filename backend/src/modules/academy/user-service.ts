import { randomUUID } from "node:crypto";

import { AcademyUserError } from "./academy-errors.ts";
import { AuditRepository } from "./audit-repository.ts";
import { generateTemporaryPassword, hashPassword } from "./password.ts";
import { UserRepository } from "./user-repository.ts";
import type { AcademyRole, AcademyUserDetail, UserList, UserListOptions } from "./academy-types.ts";

export class UserService {
  private readonly users: UserRepository;
  private readonly audit: AuditRepository;
  private readonly clock: () => Date;

  constructor(users: UserRepository, audit: AuditRepository, clock = () => new Date()) {
    this.users = users;
    this.audit = audit;
    this.clock = clock;
  }

  async createParent(actorUserId: string | null, input: { displayName: string; username: string }) {
    const temporaryPassword = generateTemporaryPassword();
    return { ...await this.create(actorUserId, input, "parent", await hashPassword(temporaryPassword), true), temporaryPassword };
  }

  async createActiveAdministrator(input: { displayName: string; username: string; password: string }) {
    return this.create(null, input, "admin", await hashPassword(input.password), false);
  }

  get(id: string) { return detail(this.users.get(id) ?? missing()); }

  list(options: UserListOptions = {}): UserList {
    const page = positive(options.page, 1);
    const pageSize = Math.min(100, positive(options.pageSize, 25));
    const result = this.users.list(options, page, pageSize);
    return { ...result, items: result.items.map(detail), page, pageSize };
  }

  disable(actorUserId: string | null, id: string) { return this.mutate(actorUserId, id, "user.disabled", (now) => this.users.disable(id, now), true, true); }
  enable(actorUserId: string | null, id: string) { return this.mutate(actorUserId, id, "user.enabled", (now) => this.users.enable(id, now)); }
  delete(actorUserId: string | null, id: string) { return this.mutate(actorUserId, id, "user.deleted", (now) => this.users.delete(id, now), true, true); }

  async resetPassword(actorUserId: string | null, id: string) {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    return { ...this.mutate(actorUserId, id, "user.password_reset", (now) => this.users.resetPassword(id, passwordHash, now), false, true), temporaryPassword };
  }

  private create(actorUserId: string | null, input: { displayName: string; username: string }, role: AcademyRole, passwordHash: string, mustChangePassword: boolean) {
    const username = input.username.trim().normalize("NFC");
    const normalizedUsername = username.toLowerCase();
    const now = this.clock().toISOString();
    return this.users.transaction(() => {
      if (this.users.hasUsername(normalizedUsername)) throw new AcademyUserError("USERNAME_TAKEN");
      const user = this.users.create(randomUUID(), input.displayName.trim(), username, normalizedUsername, role, passwordHash, mustChangePassword, now);
      this.audit.append(actorUserId, "user.created", user.id, now);
      return detail(user);
    });
  }

  private mutate(actorUserId: string | null, id: string, action: string, update: (now: string) => void, protectAdmin = false, revoke = false) {
    return this.users.transaction(() => {
      const target = this.users.stored(id) ?? missing();
      if (target.deletedAt) throw new AcademyUserError("USER_DELETED");
      if (protectAdmin && target.role === "admin" && !target.disabledAt && this.users.activeAdminCount() === 1) throw new AcademyUserError("LAST_ACTIVE_ADMIN");
      const now = this.clock().toISOString();
      update(now);
      if (revoke) this.users.revokeSessions(id);
      this.audit.append(actorUserId, action, id, now);
      return this.get(id);
    });
  }
}

function detail(user: AcademyUserDetail) { return { ...user, mustChangePassword: !!user.mustChangePassword }; }
function missing(): never { throw new AcademyUserError("USER_NOT_FOUND"); }
function positive(value: number | undefined, fallback: number) { return Number.isFinite(value) ? Math.max(1, Math.floor(value!)) : fallback; }
