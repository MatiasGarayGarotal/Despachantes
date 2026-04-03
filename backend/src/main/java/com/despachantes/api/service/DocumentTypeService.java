package com.despachantes.api.service;

import com.despachantes.api.dto.DocumentTypeDto;

import java.util.List;
import java.util.UUID;

public interface DocumentTypeService {
    List<DocumentTypeDto> getAll();
    DocumentTypeDto getById(UUID id);
    DocumentTypeDto create(DocumentTypeDto dto);
    DocumentTypeDto update(UUID id, DocumentTypeDto dto);
    void delete(UUID id);
}
