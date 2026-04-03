package com.despachantes.api.service;

import com.despachantes.api.dto.DocumentTypeDto;
import com.despachantes.api.model.DocumentType;
import com.despachantes.api.repository.DocumentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentTypeServiceImpl implements DocumentTypeService {

    private final DocumentTypeRepository repo;

    @Override
    @Transactional(readOnly = true)
    public List<DocumentTypeDto> getAll() {
        return repo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentTypeDto getById(UUID id) {
        return repo.findById(id).map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Tipo de documento no encontrado: " + id));
    }

    @Override
    @Transactional
    public DocumentTypeDto create(DocumentTypeDto dto) {
        DocumentType entity = DocumentType.builder()
                .code(dto.code())
                .name(dto.name())
                .description(dto.description())
                .appliesTo(dto.appliesTo() != null ? dto.appliesTo() : "AMBAS")
                .viaTransporte(dto.viaTransporte() != null ? dto.viaTransporte() : "TODAS")
                .isAlwaysRequired(dto.isAlwaysRequired() != null && dto.isAlwaysRequired())
                .hasExpiration(dto.hasExpiration())
                .expiryHint(dto.expiryHint())
                .build();
        return toDto(repo.save(entity));
    }

    @Override
    @Transactional
    public DocumentTypeDto update(UUID id, DocumentTypeDto dto) {
        DocumentType entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de documento no encontrado: " + id));
        if (dto.name() != null) entity.setName(dto.name());
        if (dto.description() != null) entity.setDescription(dto.description());
        if (dto.appliesTo() != null) entity.setAppliesTo(dto.appliesTo());
        if (dto.viaTransporte() != null) entity.setViaTransporte(dto.viaTransporte());
        if (dto.isAlwaysRequired() != null) entity.setAlwaysRequired(dto.isAlwaysRequired());
        entity.setHasExpiration(dto.hasExpiration());
        entity.setExpiryHint(dto.expiryHint());
        return toDto(repo.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        repo.deleteById(id);
    }

    private DocumentTypeDto toDto(DocumentType e) {
        return new DocumentTypeDto(
                e.getId(), e.getCode(), e.getName(), e.getDescription(),
                e.getAppliesTo(), e.getViaTransporte(), e.isAlwaysRequired(),
                e.isHasExpiration(), e.getExpiryHint(), e.getCreatedAt()
        );
    }
}
