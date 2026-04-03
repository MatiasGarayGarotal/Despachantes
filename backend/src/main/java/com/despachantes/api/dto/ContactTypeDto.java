package com.despachantes.api.dto;

import java.util.UUID;

public record ContactTypeDto(
    UUID id,
    String code,
    String name,
    String description,
    int sortOrder,
    boolean isActive
) {}
