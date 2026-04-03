package com.despachantes.api.service;

import com.despachantes.api.dto.OperationDto;
import com.despachantes.api.model.*;
import com.despachantes.api.repository.AppUserRepository;
import com.despachantes.api.repository.ClientRepository;
import com.despachantes.api.repository.OperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperationServiceImpl implements OperationService {

    private final OperationRepository operationRepository;
    private final ClientRepository clientRepository;
    private final AppUserRepository appUserRepository;

    @Override
    @Transactional
    public OperationDto createOperation(OperationDto dto) {
        if (operationRepository.existsByNroCarpeta(dto.nroCarpeta())) {
            throw new RuntimeException("El número de carpeta ya existe: " + dto.nroCarpeta());
        }

        Client client = clientRepository.findById(dto.clientId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + dto.clientId()));

        AppUser currentUser = getCurrentUser();

        Operation operation = Operation.builder()
                .nroCarpeta(dto.nroCarpeta())
                .tipo(dto.tipo())
                .viaTransporte(dto.viaTransporte())
                .proveedor(dto.proveedor())
                .valorEstimado(dto.valorEstimado())
                .descripcionMercaderia(dto.descripcionMercaderia())
                .estado(dto.estado() != null ? dto.estado() : OperationStatus.APERTURA)
                .fechaApertura(dto.fechaApertura() != null ? dto.fechaApertura() : LocalDate.now())
                .client(client)
                .createdBy(currentUser)
                .build();

        return mapToDto(operationRepository.save(operation));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OperationDto> getAllOperations() {
        return operationRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OperationDto getOperationById(UUID id) {
        return operationRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Operación no encontrada: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public OperationDto getOperationByNroCarpeta(String nroCarpeta) {
        return operationRepository.findByNroCarpeta(nroCarpeta)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Operación no encontrada con carpeta: " + nroCarpeta));
    }

    @Override
    @Transactional
    public OperationDto updateOperation(UUID id, OperationDto dto) {
        Operation op = operationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Operación no encontrada: " + id));

        if (dto.tipo() != null)                    op.setTipo(dto.tipo());
        if (dto.viaTransporte() != null)           op.setViaTransporte(dto.viaTransporte());
        if (dto.nroDua() != null)                  op.setNroDua(dto.nroDua());
        if (dto.proveedor() != null)               op.setProveedor(dto.proveedor());
        if (dto.descripcionMercaderia() != null)   op.setDescripcionMercaderia(dto.descripcionMercaderia());
        if (dto.valorEstimado() != null)           op.setValorEstimado(dto.valorEstimado());
        if (dto.estado() != null)                  op.setEstado(dto.estado());
        if (dto.fechaLevante() != null)            op.setFechaLevante(dto.fechaLevante());

        return mapToDto(operationRepository.save(op));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OperationDto> getOperationsByClientId(UUID clientId) {
        return operationRepository.findByClientIdOrderByFechaAperturaDesc(clientId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private AppUser getCurrentUser() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return appUserRepository.findByZitadelUserId(jwt.getSubject())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en el sistema"));
    }

    private OperationDto mapToDto(Operation op) {
        boolean tieneFactura = op.getDocuments() != null && op.getDocuments().stream()
                .anyMatch(d -> d.getDocumentType() != null
                        && "FACTURA_COMERCIAL".equalsIgnoreCase(d.getDocumentType().getCode()));
        boolean tieneTransporte = op.getDocuments() != null && op.getDocuments().stream()
                .anyMatch(d -> d.getDocumentType() != null
                        && (d.getDocumentType().getCode().startsWith("BL")
                        || "CRT".equals(d.getDocumentType().getCode())
                        || "AWB".equals(d.getDocumentType().getCode())));

        return new OperationDto(
                op.getId(),
                op.getTipo(),
                op.getViaTransporte(),
                op.getNroCarpeta(),
                op.getNroDua(),
                op.getProveedor(),
                op.getValorEstimado(),
                op.getDescripcionMercaderia(),
                op.getEstado(),
                op.getFechaApertura(),
                op.getFechaLevante(),
                op.getClient().getId(),
                op.getClient().getRazonSocial(),
                tieneFactura,
                tieneTransporte,
                tieneFactura && tieneTransporte
        );
    }
}
