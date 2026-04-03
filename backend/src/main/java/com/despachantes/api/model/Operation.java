package com.despachantes.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "operations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Operation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Número interno del estudio (correlativo a definir con Gabriel).
    @Column(name = "nro_carpeta", unique = true, nullable = false)
    @NotBlank(message = "El número de carpeta es obligatorio")
    private String nroCarpeta;

    // Número DUA: asignado por Mega 6 en el paso "Numerado". Empieza en NULL.
    @Column(name = "nro_dua", unique = true)
    private String nroDua;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "El tipo de operación es obligatorio")
    private OperationType tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "via_transporte", nullable = false)
    @NotNull(message = "La vía de transporte es obligatoria")
    private TransportMode viaTransporte;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OperationStatus estado = OperationStatus.APERTURA;

    // Canal asignado por la DNA. NULL hasta que se asigne.
    @Enumerated(EnumType.STRING)
    @Column(name = "canal_dna")
    private DnaChannel canalDna;

    private String proveedor;

    @Column(name = "descripcion_mercaderia", columnDefinition = "TEXT")
    private String descripcionMercaderia;

    @Column(name = "valor_estimado", precision = 15, scale = 2)
    private BigDecimal valorEstimado;

    @Column(name = "fecha_apertura", nullable = false)
    @Builder.Default
    private LocalDate fechaApertura = LocalDate.now();

    @Column(name = "fecha_levante")
    private LocalDate fechaLevante;

    // Admisión Temporaria: mercadería que debe reexportarse antes de la fecha de vencimiento.
    // Si vence, hay multas graves ante la DNA.
    @Column(name = "es_admision_temporaria", nullable = false)
    @Builder.Default
    private boolean esAdmisionTemporaria = false;

    @Column(name = "fecha_vencimiento_at")
    private LocalDate fechaVencimientoAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @OneToMany(mappedBy = "operation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Document> documents;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
