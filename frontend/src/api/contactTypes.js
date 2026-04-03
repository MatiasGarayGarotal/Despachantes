import api from './api';

export const getContactTypes = () =>
    api.get('/contact-types').then(r => r.data);

export const getAllContactTypes = () =>
    api.get('/contact-types', { params: { includeInactive: true } }).then(r => r.data);

export const createContactType = (dto) =>
    api.post('/contact-types', dto).then(r => r.data);

export const updateContactType = (id, dto) =>
    api.put(`/contact-types/${id}`, dto).then(r => r.data);

export const deleteContactType = (id) =>
    api.delete(`/contact-types/${id}`).then(r => r.data);

export const reorderContactTypes = (orderedIds) =>
    api.put('/contact-types/reorder', orderedIds).then(r => r.data);
