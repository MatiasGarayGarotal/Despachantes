package com.despachantes.api.service;

import com.despachantes.api.dto.WorkflowStateDto;
import com.despachantes.api.model.WorkflowState;
import com.despachantes.api.repository.WorkflowStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowStateServiceImpl implements WorkflowStateService {

    private final WorkflowStateRepository repo;

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowStateDto> getByOperationType(String operationType) {
        return repo.findByOperationTypeOrderByStepOrderAsc(operationType)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkflowStateDto update(UUID id, WorkflowStateDto dto) {
        WorkflowState entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Estado de workflow no encontrado: " + id));
        if (dto.name() != null) entity.setName(dto.name());
        entity.setActive(dto.isActive());
        return toDto(repo.save(entity));
    }

    @Override
    @Transactional
    public WorkflowStateDto create(WorkflowStateDto dto) {
        boolean exists = repo.findByOperationTypeOrderByStepOrderAsc(dto.operationType())
                .stream()
                .anyMatch(s -> s.getStepOrder() == dto.stepOrder());
        if (exists) {
            throw new IllegalArgumentException(
                "Ya existe un estado con stepOrder=" + dto.stepOrder()
                + " para operationType=" + dto.operationType());
        }
        WorkflowState entity = WorkflowState.builder()
                .operationType(dto.operationType())
                .stepOrder(dto.stepOrder())
                .code(dto.code())
                .name(dto.name())
                .isActive(dto.isActive())
                .build();
        return toDto(repo.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        repo.deleteById(id);
    }

    private WorkflowStateDto toDto(WorkflowState e) {
        return new WorkflowStateDto(
                e.getId(),
                e.getOperationType(),
                e.getStepOrder(),
                e.getCode(),
                e.getName(),
                e.isActive()
        );
    }
}
