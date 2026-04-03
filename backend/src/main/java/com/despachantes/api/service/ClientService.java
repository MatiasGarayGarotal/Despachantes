package com.despachantes.api.service;

import com.despachantes.api.dto.ClientDto;

import java.util.List;
import java.util.UUID;

public interface ClientService {
    ClientDto createClient(ClientDto clientDto);
    ClientDto updateClient(UUID id, ClientDto clientDto);
    List<ClientDto> getAllClients();
    ClientDto getClientById(UUID id);
    ClientDto getClientByNumeroDocumento(String numeroDocumento);
}
