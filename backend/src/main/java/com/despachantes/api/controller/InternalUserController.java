package com.despachantes.api.controller;

import com.despachantes.api.dto.InternalUserDto;
import com.despachantes.api.service.ZitadelManagementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import jakarta.validation.constraints.NotEmpty;

/**
 * Gestión de usuarios internos (operadores) de la agencia.
 *
 * Todos los endpoints delegan al ZitadelManagementService, que interactúa
 * con la Zitadel Management REST API usando el token del Machine User.
 * NO se crean registros de usuarios con contraseñas en PostgreSQL.
 *
 * Acceso restringido a roles ADMIN y JEFE.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'JEFE')")
public class InternalUserController {

    private final ZitadelManagementService zitadelService;

    /**
     * Lista todos los usuarios internos de la organización con su rol.
     */
    @GetMapping
    public ResponseEntity<List<InternalUserDto>> listUsers() {
        try {
            return ResponseEntity.ok(zitadelService.listUsers());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    /**
     * Crea un nuevo usuario interno en Zitadel y le asigna el rol indicado.
     * Zitadel envía automáticamente un email de inicialización al usuario.
     */
    @PostMapping
    public ResponseEntity<InternalUserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            InternalUserDto created = zitadelService.createUser(
                    request.firstName(),
                    request.lastName(),
                    request.email(),
                    request.role()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    /**
     * Retorna los roles que pueden asignarse a usuarios internos.
     * Lista estática — no consulta BD ni Zitadel.
     */
    @GetMapping("/roles")
    public ResponseEntity<List<ZitadelManagementService.RoleOption>> getRoles() {
        return ResponseEntity.ok(ZitadelManagementService.ASSIGNABLE_ROLES);
    }

    /**
     * Desactiva un usuario en Zitadel (no puede iniciar sesión).
     * Los datos y grants se conservan. El estado pasa a "Inactivo".
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deactivateUser(@PathVariable String userId) {
        try {
            zitadelService.deactivateUser(userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    /**
     * Reactiva un usuario previamente desactivado.
     */
    @PostMapping("/{userId}/reactivate")
    public ResponseEntity<Void> reactivateUser(@PathVariable String userId) {
        try {
            zitadelService.reactivateUser(userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    /**
     * Reemplaza la lista completa de roles del usuario en el proyecto Zitadel.
     * Enviar la lista final deseada (no un delta); el service hace PUT sobre el grant existente.
     */
    @PatchMapping("/{userId}/roles")
    public ResponseEntity<Void> updateUserRoles(
            @PathVariable String userId,
            @Valid @RequestBody UpdateRolesRequest request) {
        try {
            zitadelService.updateUserRoles(userId, request.roles());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            // Errores de configuración o de estado irrecuperable (ej. projectId mal configurado)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Error desconocido al contactar Zitadel.";
            // Errores de Zitadel que debería ver el usuario (ej. rol inexistente)
            if (msg.contains("400") || msg.contains("404")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Zitadel rechazó la operación. Verificá que el rol exista en el proyecto Zitadel. Detalle: " + msg);
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, msg);
        }
    }

    // ── Request bodies ─────────────────────────────────────────────────────────

    public record CreateUserRequest(
            @NotBlank(message = "El nombre es obligatorio") String firstName,
            @NotBlank(message = "El apellido es obligatorio") String lastName,
            @NotBlank @Email(message = "El email no es válido") String email,
            @NotBlank(message = "El rol es obligatorio") String role
    ) {}

    public record UpdateRolesRequest(
            @NotEmpty(message = "Debe asignarse al menos un rol") List<String> roles
    ) {}
}
