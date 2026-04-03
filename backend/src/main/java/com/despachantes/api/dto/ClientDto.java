package com.despachantes.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record ClientDto(
    UUID id,
    @NotBlank String numeroDocumento,
    String tipoPersona,
    String tipoDocumento,
    @NotBlank String razonSocial,
    @Email String email,
    String telefono,
    String direccion,
    String localidad,
    String megaNumero,
    Boolean isActive
) {}
