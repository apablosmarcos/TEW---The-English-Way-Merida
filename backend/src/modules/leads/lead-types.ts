export const leadStatuses = [
  'new',
  'contacted',
  'pending_info',
  'interview',
  'enrolled',
  'discarded',
] as const;

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'pending_info'
  | 'interview'
  | 'enrolled'
  | 'discarded';

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  interestType: string | null;
  source: string;
  studentName: string;
  studentSurname: string;
  birthDate: string;
  address: string;
  school: string;
  currentCourse: string;
  primaryContactName: string;
  primaryContactSurname: string;
  primaryContactRelationship: string;
  secondaryContactName: string | null;
  secondaryContactSurname: string | null;
  secondaryContactRelationship: string | null;
  pickupContact: string | null;
  paymentMethod: string;
  paymentAccountHolder: string | null;
  paymentIban: string | null;
  observations: string | null;
  status: LeadStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadInput = {
  studentName: string;
  studentSurname: string;
  birthDate: string;
  address: string;
  email: string;
  phone: string | null;
  school: string;
  currentCourse: string;
  primaryContactName: string;
  primaryContactSurname: string;
  primaryContactRelationship: string;
  secondaryContactName: string | null;
  secondaryContactSurname: string | null;
  secondaryContactRelationship: string | null;
  pickupContact: string | null;
  paymentMethod: string;
  paymentAccountHolder: string | null;
  paymentIban: string | null;
  observations: string | null;
  source: string;
};

export type UpdateLeadInput = {
  status?: LeadStatus;
  notes?: string;
};
