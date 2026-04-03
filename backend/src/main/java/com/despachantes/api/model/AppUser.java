package com.despachantes.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Identificador de Zitadel (claim "sub" del JWT). Se completa en el primer login.
    @Column(name = "zitadel_user_id", nullable = false, unique = true)
    private String zitadelUserId;

    @Column(nullable = false, unique = true)
    @Email(message = "Email inválido")
    @NotBlank(message = "El email es obligatorio")
    private String email;

    @Column(name = "full_name", nullable = false)
    @NotBlank(message = "El nombre completo es obligatorio")
    private String fullName;

    // El rol viene del JWT de Zitadel (admin | jefe | operador | cliente).
    // Se sincroniza en cada login. NO se usa para permisos en BD — el mapa
    // de permisos vive en el frontend (rolePermissions.js).
    @Column(nullable = false)
    @Builder.Default
    private String role = "operador";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    // Solo para usuarios externos (rol CLIENT). NULL para empleados internos.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

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
