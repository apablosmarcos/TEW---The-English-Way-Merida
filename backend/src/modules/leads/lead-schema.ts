import type { CreateLeadInput } from './lead-types.ts';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class InvalidLeadPayloadError extends Error {}

export function parseCreateLeadInput(input: unknown): CreateLeadInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new InvalidLeadPayloadError('Invalid lead payload');
  }

  const data = input as Record<string, unknown>;
  const name = readRequiredString(data.name, 2, 'name');
  const email = readEmail(data.email);
  const message = readRequiredString(data.message, 5, 'message');

  return {
    name,
    email,
    phone: readOptionalString(data.phone),
    message,
    interestType: readOptionalString(data.interestType),
    source: readSource(data.source),
  };
}

function readRequiredString(value: unknown, minLength: number, field: string) {
  if (typeof value !== 'string') {
    throw new InvalidLeadPayloadError(`Invalid ${field}`);
  }

  const normalized = value.trim();

  if (normalized.length < minLength) {
    throw new InvalidLeadPayloadError(`Invalid ${field}`);
  }

  return normalized;
}

function readOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new InvalidLeadPayloadError('Invalid optional field');
  }

  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}

function readEmail(value: unknown) {
  const email = readRequiredString(value, 3, 'email');

  if (!emailPattern.test(email)) {
    throw new InvalidLeadPayloadError('Invalid email');
  }

  return email;
}

function readSource(value: unknown) {
  if (value === undefined || value === null) {
    return 'public-site';
  }

  if (typeof value !== 'string') {
    throw new InvalidLeadPayloadError('Invalid source');
  }

  const normalized = value.trim();
  return normalized === '' ? 'public-site' : normalized;
}
