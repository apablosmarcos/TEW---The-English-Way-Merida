import type { AdminLead } from '../../core/services/admin-api.service.ts';

export function removeLeadFromState(leads: AdminLead[], selectedLead: AdminLead | null, deletedLeadId: string) {
  const nextLeads = leads.filter((lead) => lead.id !== deletedLeadId);

  if (!selectedLead || selectedLead.id !== deletedLeadId) {
    return {
      leads: nextLeads,
      selectedLead,
    };
  }

  const deletedIndex = leads.findIndex((lead) => lead.id === deletedLeadId);
  const nextSelectedLead = nextLeads[deletedIndex] ?? nextLeads[deletedIndex - 1] ?? null;

  return {
    leads: nextLeads,
    selectedLead: nextSelectedLead,
  };
}
