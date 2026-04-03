package com.despachantes.api.service;

import com.despachantes.api.dto.ContactDto;

import java.util.List;
import java.util.UUID;

public interface ContactService {
    List<ContactDto> getByClient(UUID clientId);
    ContactDto create(UUID clientId, ContactDto dto);
    ContactDto update(UUID contactId, ContactDto dto);
    void delete(UUID contactId);
}
