package com.despachantes.api.dto;

import java.util.UUID;

public record ContactDto(
    UUID id,
    UUID clientId,
    UUID contactTypeId,
    String contactTypeName,
    String nombre,
    String cargo,
    String telefono,
    String email,
    boolean receivesNotifications,
    String notas,
    int sortOrder
) {}
