import api from './api';
import axios from 'axios';

export const getOperations = async () => {
    const response = await api.get('/operations');
    return response.data;
};

export const createOperation = async (operationData) => {
    const response = await api.post('/operations', operationData);
    return response.data;
};

export const getOperationById = async (id) => {
    const response = await api.get(`/operations/${id}`);
    return response.data;
};

export const updateOperation = async (id, data) => {
    const response = await api.put(`/operations/${id}`, data);
    return response.data;
};

export const getOperationsByClient = async (clientId) => {
    const response = await api.get(`/operations/client/${clientId}`);
    return response.data;
};

// Documentos
export const getDocumentsByOperation = async (operationId) => {
    const response = await api.get(`/documents/operation/${operationId}`);
    return response.data;
};

export const uploadDocument = async (operationId, file, typeCode, expiryDate) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('typeCode', typeCode);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    const response = await api.post(`/documents/upload/${operationId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateDocumentExpiry = async (docId, expiryDate) => {
    const response = await api.patch(`/documents/${docId}/expiry`, { expiryDate });
    return response.data;
};

export const deleteDocument = async (docId) => {
    await api.delete(`/documents/${docId}`);
};

export const downloadDocument = async (docId, fileName) => {
    // El endpoint devuelve una presigned URL de MinIO (no requiere auth para acceder)
    const response = await api.get(`/documents/download/${docId}`);
    const presignedUrl = response.data.url;
    const a = document.createElement('a');
    a.href = presignedUrl;
    a.download = fileName || 'documento';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
};

export const getDocumentPreviewUrl = async (docId) => {
    const response = await api.get(`/documents/download/${docId}`);
    return response.data.url;
};

export const sendShareEmail = async (token, toEmail) => {
    await api.post(`/documents/shares/${token}/send-email`, toEmail ? { toEmail } : {});
};

export const createDocumentShare = async (docId) => {
    const baseUrl = window.location.origin;
    const response = await api.post(`/documents/${docId}/shares`, {}, {
        headers: { 'X-App-Base-Url': baseUrl },
    });
    return response.data;
};

// Share público (sin autenticación)
const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1',
});

export const getShareInfo = async (token) => {
    const response = await publicApi.get(`/public/share/${token}`);
    return response.data;
};

export const getShareFileUrl = (token, disposition = 'inline') => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';
    return `${base}/public/share/${token}/file?disposition=${disposition}`;
};
