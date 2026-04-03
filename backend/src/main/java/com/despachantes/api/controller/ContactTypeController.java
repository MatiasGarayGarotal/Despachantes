package com.despachantes.api.controller;

import com.despachantes.api.dto.ContactTypeDeleteResultDto;
import com.despachantes.api.dto.ContactTypeDto;
import com.despachantes.api.service.ContactTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contact-types")
@RequiredArgsConstructor
public class ContactTypeController {

    private final ContactTypeService service;

    /**
     * GET /api/v1/contact-types
     * Sin parámetro → solo activos (para dropdown de contactos)
     * ?includeInactive=true → todos (para pantalla de Configuración)
     */
    @GetMapping
    public ResponseEntity<List<ContactTypeDto>> getAll(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        List<ContactTypeDto> result = includeInactive ? service.getAll() : service.getAllActive();
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<ContactTypeDto> create(@RequestBody ContactTypeDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactTypeDto> update(
            @PathVariable UUID id,
            @RequestBody ContactTypeDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ContactTypeDeleteResultDto> delete(@PathVariable UUID id) {
        return ResponseEntity.ok(service.delete(id));
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorder(@RequestBody List<UUID> orderedIds) {
        service.reorder(orderedIds);
        return ResponseEntity.noContent().build();
    }
}
