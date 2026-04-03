import api from './api';

export const getClients = async () => {
    const response = await api.get('/clients');
    return response.data;
};

export const getClientById = async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
};

export const createClient = async (clientData) => {
    // clientData shape: { numeroDocumento, tipoPersona, tipoDocumento, razonSocial, email, telefono, direccion, localidad, megaNumero }
    const response = await api.post('/clients', clientData);
    return response.data;
};

export const updateClient = async (id, clientData) => {
    // clientData shape: { numeroDocumento, tipoPersona, tipoDocumento, razonSocial, email, telefono, direccion, localidad, megaNumero, isActive }
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
};
