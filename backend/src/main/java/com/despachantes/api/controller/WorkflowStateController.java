package com.despachantes.api.controller;

import com.despachantes.api.dto.WorkflowStateDto;
import com.despachantes.api.service.WorkflowStateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow-states")
@RequiredArgsConstructor
public class WorkflowStateController {

    private final WorkflowStateService service;

    @GetMapping
    public ResponseEntity<List<WorkflowStateDto>> getByOperationType(
            @RequestParam String operationType) {
        return ResponseEntity.ok(service.getByOperationType(operationType));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('JEFE', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowStateDto> create(@RequestBody WorkflowStateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('JEFE', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowStateDto> update(
            @PathVariable UUID id,
            @RequestBody WorkflowStateDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('JEFE', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
