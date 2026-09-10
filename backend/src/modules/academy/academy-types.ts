export type AcademyRole = "parent" | "admin";

export type AcademyUser = {
  id: string;
  displayName: string;
  username: string;
  role: AcademyRole;
};

export type AcademySession = {
  user: AcademyUser;
  expiresAt: string;
  mustChangePassword: boolean;
};

export type AcademyLogin = AcademySession & { token: string };

export type AcademyUserState = "active" | "disabled" | "deleted";
export type AcademyUserDetail = AcademyUser & { mustChangePassword: boolean; state: AcademyUserState; createdAt: string; updatedAt: string };
export type UserListOptions = { search?: string; role?: AcademyRole; state?: AcademyUserState; page?: number; pageSize?: number };
export type UserList = { items: AcademyUserDetail[]; page: number; pageSize: number; total: number };
