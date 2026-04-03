package com.despachantes.api.service;

import com.despachantes.api.dto.WorkflowStateDto;

import java.util.List;
import java.util.UUID;

public interface WorkflowStateService {
    List<WorkflowStateDto> getByOperationType(String operationType);
    WorkflowStateDto update(UUID id, WorkflowStateDto dto);
    WorkflowStateDto create(WorkflowStateDto dto);
    void delete(UUID id);
}
