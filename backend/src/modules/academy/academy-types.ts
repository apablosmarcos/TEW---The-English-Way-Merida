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
