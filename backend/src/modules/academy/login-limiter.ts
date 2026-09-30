const limit = 10;
const windowMs = 15 * 60 * 1000;

type Entry = { attempts: number; expiresAt: number };

export class LoginLimiter {
  private readonly entries = new Map<string, Entry>();

  get size() {
    return this.entries.size;
  }

  attempt(ip: string, now = Date.now()) {
    // ponytail: O(n) prune per login; use an expiry queue if traffic makes it material.
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    const entry = this.entries.get(ip) ?? { attempts: 0, expiresAt: now + windowMs };
    if (entry.attempts >= limit) return false;
    entry.attempts += 1;
    this.entries.set(ip, entry);
    return true;
  }
}
