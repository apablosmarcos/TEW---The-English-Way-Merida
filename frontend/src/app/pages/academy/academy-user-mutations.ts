export type TemporarySecret = {
  id: string;
  username: string;
  password: string;
};

export class TemporarySecretQueue {
  private secrets: TemporarySecret[] = [];

  get items(): readonly TemporarySecret[] {
    return this.secrets;
  }

  add(secret: TemporarySecret) {
    this.secrets = [...this.secrets, secret];
  }

  acknowledge(secret: TemporarySecret) {
    this.secrets = this.secrets.filter((candidate) => candidate !== secret);
  }

  clear() {
    this.secrets = [];
  }
}

export function confirmMutation(
  confirm: (message: string) => boolean,
  message: string,
  action: () => void,
) {
  if (!confirm(message)) return false;
  action();
  return true;
}

export async function runExclusiveMutation(
  pending: Set<string>,
  accountId: string,
  action: () => Promise<void>,
) {
  if (pending.has(accountId)) return false;
  pending.add(accountId);
  try {
    await action();
    return true;
  } finally {
    pending.delete(accountId);
  }
}
