package com.despachantes.api.service;

import com.despachantes.api.dto.ClientDto;
import com.despachantes.api.model.Client;
import com.despachantes.api.model.DocumentIdentifierType;
import com.despachantes.api.model.PersonType;
import com.despachantes.api.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;

    @Override
    @Transactional
    public ClientDto createClient(ClientDto dto) {
        if (clientRepository.existsByNumeroDocumento(dto.numeroDocumento())) {
            throw new RuntimeException("El número de documento ya existe: " + dto.numeroDocumento());
        }

        validateDocumentNumber(dto.tipoDocumento(), dto.numeroDocumento());

        Client client = Client.builder()
                .numeroDocumento(dto.numeroDocumento())
                .tipoPersona(dto.tipoPersona() != null ? PersonType.valueOf(dto.tipoPersona()) : PersonType.EMPRESA)
                .tipoDocumento(dto.tipoDocumento() != null ? DocumentIdentifierType.valueOf(dto.tipoDocumento()) : DocumentIdentifierType.RUT)
                .razonSocial(dto.razonSocial())
                .email(dto.email())
                .telefono(dto.telefono())
                .direccion(dto.direccion())
                .localidad(dto.localidad())
                .megaNumero(dto.megaNumero())
                .build();

        return mapToDto(clientRepository.save(client));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientDto> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClientDto getClientById(UUID id) {
        return clientRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public ClientDto getClientByNumeroDocumento(String numeroDocumento) {
        return clientRepository.findByNumeroDocumento(numeroDocumento)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con número de documento: " + numeroDocumento));
    }

    @Override
    @Transactional
    public ClientDto updateClient(UUID id, ClientDto dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + id));

        if (dto.numeroDocumento() != null
                && !dto.numeroDocumento().equals(client.getNumeroDocumento())) {
            if (clientRepository.existsByNumeroDocumento(dto.numeroDocumento())) {
                throw new RuntimeException("El número de documento ya existe: " + dto.numeroDocumento());
            }
            validateDocumentNumber(dto.tipoDocumento(), dto.numeroDocumento());
            client.setNumeroDocumento(dto.numeroDocumento());
        }

        if (dto.tipoPersona() != null) {
            client.setTipoPersona(PersonType.valueOf(dto.tipoPersona()));
        }
        if (dto.tipoDocumento() != null) {
            client.setTipoDocumento(DocumentIdentifierType.valueOf(dto.tipoDocumento()));
        }

        client.setRazonSocial(dto.razonSocial());
        client.setEmail(dto.email());
        client.setTelefono(dto.telefono());
        client.setDireccion(dto.direccion());
        client.setLocalidad(dto.localidad());
        client.setMegaNumero(dto.megaNumero());

        if (dto.isActive() != null) {
            client.setActive(dto.isActive());
        }

        return mapToDto(clientRepository.save(client));
    }

    private void validateDocumentNumber(String tipoDocumento, String numero) {
        if (numero == null) return;
        String digits = numero.replaceAll("[^0-9]", "");
        if ("CI".equals(tipoDocumento)) {
            validateCi(digits);
        } else {
            validateRut(digits);
        }
    }

    private void validateCi(String digits) {
        if (digits.length() < 7 || digits.length() > 8)
            throw new IllegalArgumentException("CI inválida: debe tener 7 u 8 dígitos");
        String padded = String.format("%08d", Long.parseLong(digits));
        int[] weights = {2, 9, 8, 7, 6, 3, 4};
        int sum = 0;
        for (int i = 0; i < 7; i++) {
            sum += Character.getNumericValue(padded.charAt(i)) * weights[i];
        }
        int check = (10 - (sum % 10)) % 10;
        if (check != Character.getNumericValue(padded.charAt(7)))
            throw new IllegalArgumentException("CI inválida: dígito verificador incorrecto");
    }

    private void validateRut(String digits) {
        if (digits.length() != 12)
            throw new IllegalArgumentException("RUT inválido: debe tener 12 dígitos");
        int[] weights = {4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int sum = 0;
        for (int i = 0; i < 11; i++) {
            sum += Character.getNumericValue(digits.charAt(i)) * weights[i];
        }
        int remainder = sum % 11;
        if (remainder == 1)
            throw new IllegalArgumentException("RUT inválido: dígito verificador incorrecto");
        int check = (remainder == 0) ? 0 : (11 - remainder);
        if (check != Character.getNumericValue(digits.charAt(11)))
            throw new IllegalArgumentException("RUT inválido: dígito verificador incorrecto");
    }

    private ClientDto mapToDto(Client client) {
        return new ClientDto(
                client.getId(),
                client.getNumeroDocumento(),
                client.getTipoPersona() != null ? client.getTipoPersona().name() : null,
                client.getTipoDocumento() != null ? client.getTipoDocumento().name() : null,
                client.getRazonSocial(),
                client.getEmail(),
                client.getTelefono(),
                client.getDireccion(),
                client.getLocalidad(),
                client.getMegaNumero(),
                client.isActive()
        );
    }
}
