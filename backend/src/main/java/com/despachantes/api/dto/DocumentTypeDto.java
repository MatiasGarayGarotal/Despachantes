package com.despachantes.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentTypeDto(
        UUID id,
        String code,
        String name,
        String description,
        String appliesTo,
        String viaTransporte,
        Boolean isAlwaysRequired,
        boolean hasExpiration,
        String expiryHint,
        LocalDateTime createdAt
) {}
