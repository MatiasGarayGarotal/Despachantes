import api from './api';

export const getDocumentTypes  = ()        => api.get('/document-types').then(r => r.data);
export const createDocumentType = (dto)    => api.post('/document-types', dto).then(r => r.data);
export const updateDocumentType = (id, dto) => api.put(`/document-types/${id}`, dto).then(r => r.data);
export const deleteDocumentType = (id)     => api.delete(`/document-types/${id}`);
