package com.despachantes.api.service;

import com.despachantes.api.dto.ContactTypeDeleteResultDto;
import com.despachantes.api.dto.ContactTypeDto;
import com.despachantes.api.model.ContactType;
import com.despachantes.api.repository.ContactRepository;
import com.despachantes.api.repository.ContactTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactTypeServiceImpl implements ContactTypeService {

    private final ContactTypeRepository repo;
    private final ContactRepository contactRepo;

    @Override
    @Transactional(readOnly = true)
    public List<ContactTypeDto> getAllActive() {
        return repo.findByIsActiveTrueOrderBySortOrderAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContactTypeDto> getAll() {
        return repo.findAllByOrderBySortOrderAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContactTypeDto create(ContactTypeDto dto) {
        String code = generateCode(dto.name());
        // Si el código ya existe, agrega un sufijo numérico
        if (repo.existsByCode(code)) {
            int suffix = 2;
            while (repo.existsByCode(code + "_" + suffix)) suffix++;
            code = code + "_" + suffix;
        }
        ContactType entity = ContactType.builder()
                .code(code)
                .name(dto.name())
                .description(dto.description())
                .sortOrder(dto.sortOrder())
                .isActive(true)
                .build();
        return toDto(repo.save(entity));
    }

    @Override
    @Transactional
    public ContactTypeDto update(UUID id, ContactTypeDto dto) {
        ContactType entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de contacto no encontrado: " + id));

        boolean isUsed = contactRepo.existsByContactTypeIdAndDeletedAtIsNull(id);

        if (isUsed && dto.name() != null && !dto.name().equals(entity.getName())) {
            throw new IllegalStateException(
                "No se puede modificar el nombre: este tipo ya fue asignado a uno o más contactos. " +
                "Solo se permite cambiar la descripción, el orden o el estado activo/inactivo."
            );
        }

        if (!isUsed && dto.name() != null) entity.setName(dto.name());
        if (dto.description() != null) entity.setDescription(dto.description());

        // Si el sortOrder cambió y hay conflicto, hacer swap con el tipo que tenía ese orden
        if (dto.sortOrder() != entity.getSortOrder()) {
            repo.findBySortOrder(dto.sortOrder()).ifPresent(conflict -> {
                if (!conflict.getId().equals(id)) {
                    conflict.setSortOrder(entity.getSortOrder());
                    repo.save(conflict);
                }
            });
        }

        entity.setSortOrder(dto.sortOrder());
        entity.setActive(dto.isActive());
        return toDto(repo.save(entity));
    }

    @Override
    @Transactional
    public void reorder(List<UUID> orderedIds) {
        List<ContactType> all = repo.findAllById(orderedIds);
        // Build index map for O(1) lookup
        Map<UUID, ContactType> byId = all.stream()
                .collect(Collectors.toMap(ContactType::getId, ct -> ct));
        for (int i = 0; i < orderedIds.size(); i++) {
            ContactType ct = byId.get(orderedIds.get(i));
            if (ct != null) ct.setSortOrder(i + 1);
        }
        repo.saveAll(all);
    }

    @Override
    @Transactional
    public ContactTypeDeleteResultDto delete(UUID id) {
        ContactType entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de contacto no encontrado: " + id));

        boolean isUsed = contactRepo.existsByContactTypeIdAndDeletedAtIsNull(id);

        if (isUsed) {
            entity.setActive(false);
            repo.save(entity);
            return new ContactTypeDeleteResultDto(
                true, false,
                "El tipo \"" + entity.getName() + "\" tiene contactos asociados: se desactivó en lugar de eliminarse."
            );
        } else {
            repo.delete(entity);
            return new ContactTypeDeleteResultDto(
                true, true,
                "El tipo \"" + entity.getName() + "\" fue eliminado definitivamente."
            );
        }
    }

    private String generateCode(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toUpperCase()
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "")
                .replaceAll("_+", "_");
    }

    private ContactTypeDto toDto(ContactType e) {
        return new ContactTypeDto(
                e.getId(),
                e.getCode(),
                e.getName(),
                e.getDescription(),
                e.getSortOrder(),
                e.isActive()
        );
    }
}
