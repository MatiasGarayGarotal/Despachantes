import api from './api';

export const getEmailTemplates = async () => {
    const response = await api.get('/email-templates');
    return response.data;
};

export const getEmailTemplate = async (id) => {
    const response = await api.get(`/email-templates/${id}`);
    return response.data;
};

export const updateEmailTemplate = async (id, data) => {
    const response = await api.put(`/email-templates/${id}`, data);
    return response.data;
};
