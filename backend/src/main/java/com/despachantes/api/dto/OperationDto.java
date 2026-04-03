package com.despachantes.api.dto;

import com.despachantes.api.model.OperationStatus;
import com.despachantes.api.model.OperationType;
import com.despachantes.api.model.TransportMode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record OperationDto(
    UUID id,
    OperationType tipo,
    TransportMode viaTransporte,
    String nroCarpeta,
    String nroDua,
    String proveedor,
    BigDecimal valorEstimado,
    String descripcionMercaderia,
    OperationStatus estado,
    LocalDate fechaApertura,
    LocalDate fechaLevante,
    UUID clientId,
    String razonSocial,
    Boolean tieneFactura,
    Boolean tieneTransporte,
    Boolean listoParaRevision
) {}
