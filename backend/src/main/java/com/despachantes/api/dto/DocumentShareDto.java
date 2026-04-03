package com.despachantes.api.dto;

import java.time.LocalDateTime;

public record DocumentShareDto(
    String token,
    String shareUrl,
    LocalDateTime expiresAt,
    String documentFileName,
    String documentTypeName,
    String operationNroCarpeta,
    String clientRazonSocial,
    String createdByName
) {}
