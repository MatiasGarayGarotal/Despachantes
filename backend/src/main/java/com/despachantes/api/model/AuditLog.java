package com.despachantes.api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Log de auditoría inalterable (RN-07).
 *
 * Reglas de diseño:
 * - SIN FK a otras tablas: sobrevive a la eliminación de entidades referenciadas.
 * - SIN updated_at: estos registros NUNCA se modifican.
 * - Ningún rol del sistema puede borrar ni editar registros de este log.
 */
@Entity
@Table(name = "audit_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String action;      // Ej: OPERATION_CREATED, DOCUMENT_UPLOADED, STATUS_CHANGED

    @Column(name = "entity_type")
    private String entityType;  // Ej: Operation, Client, Document

    @Column(name = "entity_id")
    private String entityId;    // UUID de la entidad afectada (como String para sobrevivir borrados)

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "user_id")
    private UUID userId;        // Sin FK intencional

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
