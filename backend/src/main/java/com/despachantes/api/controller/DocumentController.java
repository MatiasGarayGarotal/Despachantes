package com.despachantes.api.controller;

import com.despachantes.api.dto.DocumentDto;
import com.despachantes.api.dto.DocumentShareDto;
import com.despachantes.api.model.AppUser;
import com.despachantes.api.model.Document;
import com.despachantes.api.model.DocumentType;
import com.despachantes.api.model.Operation;
import com.despachantes.api.repository.AppUserRepository;
import com.despachantes.api.repository.DocumentRepository;
import com.despachantes.api.repository.DocumentTypeRepository;
import com.despachantes.api.repository.OperationRepository;
import com.despachantes.api.service.DocumentShareService;
import com.despachantes.api.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final StorageService storageService;
    private final OperationRepository operationRepository;
    private final DocumentRepository documentRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final AppUserRepository appUserRepository;
    private final DocumentShareService documentShareService;

    @PostMapping("/upload/{operationId}")
    public ResponseEntity<DocumentDto> uploadDocument(
            @PathVariable UUID operationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("typeCode") String typeCode,
            @RequestParam(value = "expiryDate", required = false) String expiryDate) {

        Operation operation = operationRepository.findById(operationId)
                .orElseThrow(() -> new RuntimeException("Operación no encontrada"));

        DocumentType docType = documentTypeRepository.findByCode(typeCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Tipo de documento no válido: " + typeCode));

        AppUser currentUser = getCurrentUser();
        String path = "operacion_" + operationId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        storageService.uploadFile(file, path);

        Document doc = Document.builder()
                .fileName(file.getOriginalFilename())
                .contentType(file.getContentType())
                .storagePath(path)
                .fileSizeBytes(file.getSize())
                .documentType(docType)
                .operation(operation)
                .uploadedBy(currentUser)
                .expirationDate(expiryDate != null && !expiryDate.isBlank() ? LocalDate.parse(expiryDate) : null)
                .build();

        return ResponseEntity.ok(mapToDto(documentRepository.save(doc)));
    }

    @PatchMapping("/{docId}/expiry")
    public ResponseEntity<DocumentDto> updateExpiry(
            @PathVariable UUID docId,
            @RequestBody Map<String, String> body) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        String expiryDateStr = body.get("expiryDate");
        doc.setExpirationDate(expiryDateStr != null && !expiryDateStr.isBlank() ? LocalDate.parse(expiryDateStr) : null);
        return ResponseEntity.ok(mapToDto(documentRepository.save(doc)));
    }

    @GetMapping("/operation/{operationId}")
    public ResponseEntity<List<DocumentDto>> getDocumentsByOperation(@PathVariable UUID operationId) {
        return ResponseEntity.ok(
            documentRepository.findByOperationId(operationId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/download/{docId}")
    public ResponseEntity<Map<String, String>> getDownloadUrl(@PathVariable UUID docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        String url = storageService.getPresignedUrl(doc.getStoragePath());
        return ResponseEntity.ok(Map.of("url", url));
    }

    @DeleteMapping("/{docId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID docId) {
        documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        documentRepository.deleteById(docId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{docId}/shares")
    public ResponseEntity<DocumentShareDto> createShare(
            @PathVariable UUID docId,
            @RequestHeader(value = "X-App-Base-Url", required = false) String baseUrl) {
        AppUser currentUser = getCurrentUser();
        DocumentShareDto share = documentShareService.createShare(docId, currentUser, baseUrl);
        return ResponseEntity.ok(share);
    }

    @PostMapping("/shares/{token}/send-email")
    public ResponseEntity<Void> sendShareEmail(
            @PathVariable String token,
            @RequestBody(required = false) Map<String, String> body) {
        String toEmail = body != null ? body.get("toEmail") : null;
        documentShareService.sendShareEmail(token, toEmail);
        return ResponseEntity.ok().build();
    }

    private DocumentDto mapToDto(Document doc) {
        return new DocumentDto(
            doc.getId(),
            doc.getFileName(),
            doc.getContentType(),
            doc.getFileSizeBytes(),
            doc.getDocumentType() != null ? doc.getDocumentType().getCode() : null,
            doc.getDocumentType() != null ? doc.getDocumentType().getName() : null,
            doc.isSharedWithClient(),
            doc.getUploadedBy() != null ? doc.getUploadedBy().getFullName() : null,
            doc.getCreatedAt(),
            doc.getExpirationDate(),
            doc.getDescription()
        );
    }

    private AppUser getCurrentUser() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return appUserRepository.findByZitadelUserId(jwt.getSubject())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en el sistema"));
    }
}
