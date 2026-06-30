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
  status: LeadStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadInput = {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  interestType: string | null;
  source: string;
};
