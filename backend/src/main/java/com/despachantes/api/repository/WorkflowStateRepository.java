package com.despachantes.api.repository;

import com.despachantes.api.model.WorkflowState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowStateRepository extends JpaRepository<WorkflowState, UUID> {
    List<WorkflowState> findByOperationTypeOrderByStepOrderAsc(String operationType);
    Optional<WorkflowState> findByOperationTypeAndCode(String operationType, String code);
}
