import type { CreateLeadInput } from './lead-types.ts';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class InvalidLeadPayloadError extends Error {}

export function parseCreateLeadInput(input: unknown): CreateLeadInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new InvalidLeadPayloadError('Invalid lead payload');
  }

  const data = input as Record<string, unknown>;

  return {
    studentName: readRequiredString(data.studentName, 2, 'studentName'),
    studentSurname: readRequiredString(data.studentSurname, 2, 'studentSurname'),
    birthDate: readRequiredString(data.birthDate, 4, 'birthDate'),
    address: readRequiredString(data.address, 5, 'address'),
    email: readEmail(data.email),
    phone: readOptionalString(data.phone),
    school: readRequiredString(data.school, 2, 'school'),
    currentCourse: readRequiredString(data.currentCourse, 2, 'currentCourse'),
    primaryContactName: readRequiredString(data.primaryContactName, 2, 'primaryContactName'),
    primaryContactSurname: readRequiredString(data.primaryContactSurname, 2, 'primaryContactSurname'),
    primaryContactRelationship: readRequiredString(data.primaryContactRelationship, 2, 'primaryContactRelationship'),
    secondaryContactName: readOptionalString(data.secondaryContactName),
    secondaryContactSurname: readOptionalString(data.secondaryContactSurname),
    secondaryContactRelationship: readOptionalString(data.secondaryContactRelationship),
    pickupContact: readOptionalString(data.pickupContact),
    paymentMethod: readRequiredString(data.paymentMethod, 2, 'paymentMethod'),
    paymentAccountHolder: readOptionalString(data.paymentAccountHolder),
    paymentIban: readOptionalString(data.paymentIban),
    observations: readOptionalString(data.observations),
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
