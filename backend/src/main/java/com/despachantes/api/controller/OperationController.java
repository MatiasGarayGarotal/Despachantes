package com.despachantes.api.controller;

import com.despachantes.api.dto.OperationDto;
import com.despachantes.api.service.OperationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/operations")
@RequiredArgsConstructor
public class OperationController {

    private final OperationService operationService;

    @PostMapping
    public ResponseEntity<OperationDto> createOperation(@Valid @RequestBody OperationDto operationDto) {
        return new ResponseEntity<>(operationService.createOperation(operationDto), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<OperationDto>> getAllOperations() {
        return ResponseEntity.ok(operationService.getAllOperations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OperationDto> getOperationById(@PathVariable UUID id) {
        return ResponseEntity.ok(operationService.getOperationById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationDto> updateOperation(@PathVariable UUID id, @RequestBody OperationDto dto) {
        return ResponseEntity.ok(operationService.updateOperation(id, dto));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<OperationDto>> getByClient(@PathVariable UUID clientId) {
        return ResponseEntity.ok(operationService.getOperationsByClientId(clientId));
    }
}
