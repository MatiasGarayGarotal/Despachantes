package com.despachantes.api.controller;

import com.despachantes.api.dto.ContactDto;
import com.despachantes.api.service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clients/{clientId}/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService service;

    @GetMapping
    public ResponseEntity<List<ContactDto>> getByClient(@PathVariable UUID clientId) {
        return ResponseEntity.ok(service.getByClient(clientId));
    }

    @PostMapping
    public ResponseEntity<ContactDto> create(
            @PathVariable UUID clientId,
            @RequestBody ContactDto dto) {
        return new ResponseEntity<>(service.create(clientId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/{contactId}")
    public ResponseEntity<ContactDto> update(
            @PathVariable UUID clientId,
            @PathVariable UUID contactId,
            @RequestBody ContactDto dto) {
        return ResponseEntity.ok(service.update(contactId, dto));
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID clientId,
            @PathVariable UUID contactId) {
        service.delete(contactId);
        return ResponseEntity.noContent().build();
    }
}
