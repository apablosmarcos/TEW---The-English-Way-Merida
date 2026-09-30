import { randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const saltBytes = 16;
const keyBytes = 64;
const temporaryPasswordAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export const minimumPasswordLength = 10;

export function generateTemporaryPassword() {
  return Array.from({ length: minimumPasswordLength }, () => temporaryPasswordAlphabet[randomInt(temporaryPasswordAlphabet.length)]).join("");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(saltBytes);
  const key = await derive(password, salt, keyBytes);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltHex, keyHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !isHex(saltHex, saltBytes) || !isHex(keyHex, keyBytes)) {
    return false;
  }
  const expected = Buffer.from(keyHex, "hex");
  const actual = await derive(password, Buffer.from(saltHex, "hex"), keyBytes);
  return timingSafeEqual(actual, expected);
}

function isHex(value: string | undefined, bytes: number) {
  return !!value && value.length === bytes * 2 && /^[0-9a-f]+$/i.test(value);
}
