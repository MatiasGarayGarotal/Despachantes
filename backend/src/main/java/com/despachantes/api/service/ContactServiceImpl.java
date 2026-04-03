package com.despachantes.api.service;

import com.despachantes.api.dto.ContactDto;
import com.despachantes.api.model.Client;
import com.despachantes.api.model.Contact;
import com.despachantes.api.model.ContactType;
import com.despachantes.api.repository.ClientRepository;
import com.despachantes.api.repository.ContactRepository;
import com.despachantes.api.repository.ContactTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;
    private final ClientRepository clientRepository;
    private final ContactTypeRepository contactTypeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ContactDto> getByClient(UUID clientId) {
        return contactRepository.findByClientIdAndDeletedAtIsNullOrderBySortOrderAsc(clientId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContactDto create(UUID clientId, ContactDto dto) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + clientId));

        ContactType contactType = null;
        if (dto.contactTypeId() != null) {
            contactType = contactTypeRepository.findById(dto.contactTypeId())
                    .orElseThrow(() -> new RuntimeException("Tipo de contacto no encontrado: " + dto.contactTypeId()));
        }

        Contact contact = Contact.builder()
                .client(client)
                .contactType(contactType)
                .nombre(dto.nombre())
                .cargo(dto.cargo())
                .telefono(dto.telefono())
                .email(dto.email())
                .receivesNotifications(dto.receivesNotifications())
                .notas(dto.notas())
                .sortOrder(dto.sortOrder())
                .build();

        return toDto(contactRepository.save(contact));
    }

    @Override
    @Transactional
    public ContactDto update(UUID contactId, ContactDto dto) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contacto no encontrado con id: " + contactId));

        if (dto.contactTypeId() != null) {
            ContactType contactType = contactTypeRepository.findById(dto.contactTypeId())
                    .orElseThrow(() -> new RuntimeException("Tipo de contacto no encontrado: " + dto.contactTypeId()));
            contact.setContactType(contactType);
        } else {
            contact.setContactType(null);
        }

        if (dto.nombre() != null) contact.setNombre(dto.nombre());
        contact.setCargo(dto.cargo());
        contact.setTelefono(dto.telefono());
        contact.setEmail(dto.email());
        contact.setReceivesNotifications(dto.receivesNotifications());
        contact.setNotas(dto.notas());
        contact.setSortOrder(dto.sortOrder());

        return toDto(contactRepository.save(contact));
    }

    @Override
    @Transactional
    public void delete(UUID contactId) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contacto no encontrado con id: " + contactId));
        contact.setDeletedAt(LocalDateTime.now());
        contactRepository.save(contact);
    }

    private ContactDto toDto(Contact c) {
        return new ContactDto(
                c.getId(),
                c.getClient() != null ? c.getClient().getId() : null,
                c.getContactType() != null ? c.getContactType().getId() : null,
                c.getContactType() != null ? c.getContactType().getName() : null,
                c.getNombre(),
                c.getCargo(),
                c.getTelefono(),
                c.getEmail(),
                c.isReceivesNotifications(),
                c.getNotas(),
                c.getSortOrder()
        );
    }
}
