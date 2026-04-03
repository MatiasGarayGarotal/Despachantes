package com.despachantes.api.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentDto(
    UUID id,
    String fileName,
    String contentType,
    Long fileSizeBytes,
    String documentTypeCode,
    String documentTypeName,
    boolean isSharedWithClient,
    String uploadedByName,
    LocalDateTime createdAt,
    LocalDate expirationDate,
    String description
) {}
