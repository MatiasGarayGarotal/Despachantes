package com.despachantes.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "numero_documento", unique = true, nullable = false)
    @NotBlank(message = "El número de documento es obligatorio")
    private String numeroDocumento;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_persona")
    @Builder.Default
    private PersonType tipoPersona = PersonType.EMPRESA;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento")
    @Builder.Default
    private DocumentIdentifierType tipoDocumento = DocumentIdentifierType.RUT;

    @Column(name = "razon_social", nullable = false)
    @NotBlank(message = "La razón social es obligatoria")
    private String razonSocial;

    private String email;
    private String telefono;
    private String direccion;
    private String localidad;

    @Column(name = "mega_numero")
    private String megaNumero;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Operation> operations;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Contact> contacts;

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
