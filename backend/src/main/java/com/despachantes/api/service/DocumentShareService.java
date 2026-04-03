package com.despachantes.api.service;

import com.despachantes.api.dto.DocumentShareDto;
import com.despachantes.api.model.AppUser;
import com.despachantes.api.model.Document;
import com.despachantes.api.model.DocumentShare;
import com.despachantes.api.repository.DocumentRepository;
import com.despachantes.api.repository.DocumentShareRepository;
import com.despachantes.api.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentShareService {

    private final DocumentShareRepository documentShareRepository;
    private final DocumentRepository documentRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final NotificationService notificationService;

    private static final int DEFAULT_EXPIRY_DAYS = 7;

    @Transactional
    public DocumentShareDto createShare(UUID documentId, AppUser createdBy, String requestBaseUrl) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado: " + documentId));

        int expiryDays = systemConfigRepository.findByKey("share_link_expiry_days")
                .map(c -> {
                    try { return Integer.parseInt(c.getValue()); }
                    catch (NumberFormatException e) { return DEFAULT_EXPIRY_DAYS; }
                })
                .orElse(DEFAULT_EXPIRY_DAYS);

        String token = UUID.randomUUID().toString().replace("-", "") +
                       UUID.randomUUID().toString().replace("-", "");
        token = token.substring(0, 64);

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(expiryDays);

        DocumentShare share = DocumentShare.builder()
                .token(token)
                .document(doc)
                .expiresAt(expiresAt)
                .createdBy(createdBy)
                .build();

        documentShareRepository.save(share);
        log.info("Share creado para documento {} por usuario {}, vence {}", documentId, createdBy.getId(), expiresAt);

        String configuredBase = systemConfigRepository.findByKey("share_link_base_url")
                .map(c -> c.getValue().trim())
                .orElse("");
        String base = (configuredBase.isEmpty() && requestBaseUrl != null) ? requestBaseUrl : configuredBase;

        String shareUrl = base + "/share/" + token;

        return new DocumentShareDto(
            token,
            shareUrl,
            expiresAt,
            doc.getFileName(),
            doc.getDocumentType() != null ? doc.getDocumentType().getName() : null,
            doc.getOperation().getNroCarpeta(),
            doc.getOperation().getClient().getRazonSocial(),
            createdBy.getFullName()
        );
    }

    @Transactional(readOnly = true)
    public DocumentShareDto getShareInfo(String token) {
        DocumentShare share = documentShareRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Link no encontrado"));

        if (!share.isActive()) {
            throw new RuntimeException("Este link ha expirado o fue revocado");
        }

        Document doc = share.getDocument();
        String configuredBase = systemConfigRepository.findByKey("share_link_base_url")
                .map(c -> c.getValue().trim())
                .orElse("");
        String shareUrl = (configuredBase.isEmpty() ? "" : configuredBase) + "/share/" + token;

        return new DocumentShareDto(
            token,
            shareUrl,
            share.getExpiresAt(),
            doc.getFileName(),
            doc.getDocumentType() != null ? doc.getDocumentType().getName() : null,
            doc.getOperation().getNroCarpeta(),
            doc.getOperation().getClient().getRazonSocial(),
            share.getCreatedBy().getFullName()
        );
    }

    /**
     * Envía el email de notificación para un share ya existente.
     * @param token    Token del share
     * @param toEmail  Destinatario (si es null usa el email del cliente de la operación)
     */
    public void sendShareEmail(String token, String toEmail) {
        DocumentShare share = documentShareRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Link no encontrado: " + token));

        if (!share.isActive()) {
            throw new RuntimeException("Este link ha expirado o fue revocado");
        }

        Document doc = share.getDocument();

        String configuredBase = systemConfigRepository.findByKey("share_link_base_url")
                .map(c -> c.getValue().trim())
                .orElse("");
        String shareUrl = (configuredBase.isEmpty() ? "" : configuredBase) + "/share/" + token;

        String recipient = (toEmail != null && !toEmail.isBlank())
                ? toEmail
                : doc.getOperation().getClient().getEmail();

        String expiresAtFormatted = share.getExpiresAt()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        notificationService.sendTemplated("SHARE_DOCUMENT", Map.of(
            "recipientName", doc.getOperation().getClient().getRazonSocial(),
            "documentName",  doc.getFileName(),
            "documentType",  doc.getDocumentType() != null ? doc.getDocumentType().getName() : "Documento",
            "carpetaNro",    doc.getOperation().getNroCarpeta(),
            "clientName",    doc.getOperation().getClient().getRazonSocial(),
            "shareUrl",      shareUrl,
            "expiresAt",     expiresAtFormatted,
            "sharedBy",      share.getCreatedBy().getFullName()
        ), recipient);
    }

    public Document getDocumentForDownload(String token) {
        DocumentShare share = documentShareRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Link no encontrado"));

        if (!share.isActive()) {
            throw new RuntimeException("Este link ha expirado o fue revocado");
        }

        return share.getDocument();
    }
}
