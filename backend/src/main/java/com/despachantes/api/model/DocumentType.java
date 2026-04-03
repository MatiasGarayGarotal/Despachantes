package com.despachantes.api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_types")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DocumentType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;  // FACTURA_COMERCIAL, BL, CRT, AWB, etc.

    @Column(nullable = false)
    private String name;

    private String description;

    // A qué tipo de operación aplica
    @Column(name = "applies_to", nullable = false)
    @Builder.Default
    private String appliesTo = "AMBAS";  // IMPORTACION | EXPORTACION | AMBAS

    // Para qué vía de transporte aplica
    @Column(name = "via_transporte", nullable = false)
    @Builder.Default
    private String viaTransporte = "TODAS";  // MARITIMA | TERRESTRE | AEREA | TODAS

    @Column(name = "is_always_required", nullable = false)
    @Builder.Default
    private boolean isAlwaysRequired = false;

    @Column(name = "has_expiration", nullable = false)
    @Builder.Default
    private boolean hasExpiration = false;

    @Column(name = "expiry_hint")
    private String expiryHint;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
