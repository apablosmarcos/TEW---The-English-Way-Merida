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

export type AcademyCategory = { id: string; displayName: string; createdAt: string; updatedAt: string };
export type PublicationVisibility = "visible" | "hidden" | "deleted";
export type AcademyPost = { id: string; title: string; markdownSource: string; categoryId: string | null; category: Pick<AcademyCategory, "id" | "displayName"> | null; visibility: PublicationVisibility; publishedAt: string; updatedAt: string; deletedAt: string | null };
export type ParentPost = Omit<AcademyPost, "markdownSource" | "categoryId" | "visibility" | "deletedAt"> & { renderedMarkdown: string };
export type CategoryInput = { displayName: string };
export type PostInput = { title: string; markdownSource: string; categoryId?: string | null };
export type PostEditInput = Partial<PostInput>;
export type PublicationListOptions = { search?: string; categoryId?: string; page?: number; pageSize?: number };
export type PublicationList = { items: ParentPost[]; page: number; pageSize: number; total: number };
export type AcademyAttachment = { id: string; postId: string; extension: "pdf" | "jpg" | "png" | "webp"; mimeType: string; byteSize: number; visibleTitle: string | null; materialOrdinal: number; createdAt: string; updatedAt: string };
