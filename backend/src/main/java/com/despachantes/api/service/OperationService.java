package com.despachantes.api.service;

import com.despachantes.api.dto.OperationDto;

import java.util.List;
import java.util.UUID;

public interface OperationService {
    OperationDto createOperation(OperationDto operationDto);
    List<OperationDto> getAllOperations();
    OperationDto getOperationById(UUID id);
    OperationDto getOperationByNroCarpeta(String nroCarpeta);
    OperationDto updateOperation(UUID id, OperationDto dto);
    List<OperationDto> getOperationsByClientId(UUID clientId);
}
