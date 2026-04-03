package com.despachantes.api.dto;

import java.util.UUID;

public record WorkflowStateDto(
    UUID id,
    String operationType,
    int stepOrder,
    String code,
    String name,
    boolean isActive
) {}
