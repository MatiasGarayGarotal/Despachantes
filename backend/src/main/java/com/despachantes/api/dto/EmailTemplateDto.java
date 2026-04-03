package com.despachantes.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record EmailTemplateDto(
    UUID id,
    String code,
    String name,
    String subject,
    String htmlBody,
    String variablesDoc,
    boolean active,
    LocalDateTime updatedAt,
    String updatedByName
) {}
