package com.despachantes.api.controller;

import com.despachantes.api.dto.DocumentShareDto;
import com.despachantes.api.model.Document;
import com.despachantes.api.service.DocumentShareService;
import com.despachantes.api.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;

/**
 * Endpoints públicos — no requieren autenticación.
 * Permiten acceder a documentos compartidos mediante token.
 */
@RestController
@RequestMapping("/api/v1/public/share")
@RequiredArgsConstructor
public class PublicShareController {

    private final DocumentShareService documentShareService;
    private final StorageService storageService;

    /**
     * Devuelve los metadatos del documento compartido.
     * El frontend usa esto para renderizar la landing page.
     */
    @GetMapping("/{token}")
    public ResponseEntity<DocumentShareDto> getShareInfo(@PathVariable String token) {
        return ResponseEntity.ok(documentShareService.getShareInfo(token));
    }

    /**
     * Hace streaming del archivo desde MinIO al browser.
     * Usado por los botones "Ver" y "Descargar" de la landing page.
     */
    @GetMapping("/{token}/file")
    public ResponseEntity<byte[]> downloadFile(
            @PathVariable String token,
            @RequestParam(value = "disposition", defaultValue = "inline") String disposition) {

        Document doc = documentShareService.getDocumentForDownload(token);

        try (InputStream stream = storageService.downloadStream(doc.getStoragePath())) {
            byte[] bytes = stream.readAllBytes();
            String contentDisposition = disposition.equals("attachment")
                    ? "attachment; filename=\"" + doc.getFileName() + "\""
                    : "inline; filename=\"" + doc.getFileName() + "\"";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                    .contentType(MediaType.parseMediaType(doc.getContentType()))
                    .body(bytes);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener el archivo: " + e.getMessage());
        }
    }
}
