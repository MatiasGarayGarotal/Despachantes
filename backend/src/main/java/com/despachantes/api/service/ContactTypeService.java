package com.despachantes.api.service;

import com.despachantes.api.dto.ContactTypeDto;
import com.despachantes.api.dto.ContactTypeDeleteResultDto;

import java.util.List;
import java.util.UUID;

public interface ContactTypeService {
    /** Retorna tipos activos (para dropdowns de contactos) */
    List<ContactTypeDto> getAllActive();

    /** Retorna todos los tipos incluidos inactivos (para pantalla de configuración) */
    List<ContactTypeDto> getAll();

    ContactTypeDto create(ContactTypeDto dto);
    ContactTypeDto update(UUID id, ContactTypeDto dto);
    ContactTypeDeleteResultDto delete(UUID id);
    void reorder(List<UUID> orderedIds);
}
