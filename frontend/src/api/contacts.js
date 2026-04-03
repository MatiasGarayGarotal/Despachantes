import api from './api';

export const getContactsByClient = (clientId) =>
    api.get(`/clients/${clientId}/contacts`).then(r => r.data);

export const createContact = (clientId, dto) =>
    api.post(`/clients/${clientId}/contacts`, dto).then(r => r.data);

export const updateContact = (clientId, contactId, dto) =>
    api.put(`/clients/${clientId}/contacts/${contactId}`, dto).then(r => r.data);

export const deleteContact = (clientId, contactId) =>
    api.delete(`/clients/${clientId}/contacts/${contactId}`);
