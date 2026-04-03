import api from './api';

export const getWorkflowStates = (operationType) =>
    api.get('/workflow-states', { params: { operationType } }).then(r => r.data);

export const updateWorkflowState = (id, dto) =>
    api.put(`/workflow-states/${id}`, dto).then(r => r.data);

export const createWorkflowState = (dto) =>
    api.post('/workflow-states', dto).then(r => r.data);
