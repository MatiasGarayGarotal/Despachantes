package com.despachantes.api.controller;

import com.despachantes.api.model.AppUser;
import com.despachantes.api.service.UserProvisioningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Expone el perfil del usuario autenticado.
 *
 * Los permisos de UI NO se consultan a BD: el frontend deriva
 * los permisos a partir del rol usando el mapa estático rolePermissions.js.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserProvisioningService provisioningService;

    /**
     * Endpoint principal que llama el frontend al hacer login.
     *
     * Retorna el perfil del usuario y su rol (leído del JWT de Zitadel).
     * El frontend calcula los permisos de UI a partir del rol,
     * sin consultar ninguna tabla de BD.
     *
     * La URL se mantiene igual (/me/permissions) para no romper clientes existentes.
     */
    @GetMapping("/me/permissions")
    public ResponseEntity<MeResponse> getMyInfo(@AuthenticationPrincipal Jwt jwt) {
        AppUser user = provisioningService.getOrCreateUser(jwt);

        if (!user.isActive()) {
            return ResponseEntity.status(403).build();
        }

        // Los roles se leen del JWT en tiempo real (no de la BD) — soporta multi-rol
        List<String> roles = provisioningService.extractRolesFromJwt(jwt);

        return ResponseEntity.ok(new MeResponse(
                user.getId().toString(),
                user.getEmail(),
                user.getFullName(),
                roles
        ));
    }

    public record MeResponse(
            String id,
            String email,
            String fullName,
            List<String> roles
    ) {}
}
