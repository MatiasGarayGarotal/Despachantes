package com.despachantes.api.service;

import com.despachantes.api.model.AppUser;
import com.despachantes.api.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Auto-provisiona un usuario en la BD de la app cuando hace login por primera vez.
 *
 * El rol se lee SIEMPRE del JWT de Zitadel (no de la BD).
 * La BD almacena el rol para referencia, pero la autorización en UI
 * se calcula desde el JWT via el mapa estático rolePermissions.js.
 *
 * Roles válidos en Zitadel: admin | jefe | emp_exp | emp_imp | emp_adm | cliente
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProvisioningService {

    private static final List<String> KNOWN_ROLES = List.of("admin", "jefe", "emp_exp", "emp_imp", "emp_adm", "cliente");
    private static final String DEFAULT_ROLE = "emp_adm";

    private final AppUserRepository userRepository;

    @Transactional
    public AppUser getOrCreateUser(Jwt jwt) {
        String zitadelUserId = jwt.getSubject();
        String email = resolveEmail(jwt, zitadelUserId);
        String fullName = resolveFullName(jwt, email);
        String role = extractRoleFromJwt(jwt);

        return userRepository.findByZitadelUserId(zitadelUserId)
                .map(existing -> {
                    // Sincronizar rol del JWT en cada login
                    if (!role.equals(existing.getRole())) {
                        existing.setRole(role);
                        return userRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    log.info("Primer login. zitadelId={} email={} rol={}. Creando perfil en BD.", zitadelUserId, email, role);
                    AppUser newUser = AppUser.builder()
                            .zitadelUserId(zitadelUserId)
                            .email(email)
                            .fullName(fullName)
                            .role(role)
                            .isActive(true)
                            .build();
                    return userRepository.save(newUser);
                });
    }

    /**
     * Extrae TODOS los roles válidos del JWT de Zitadel.
     * Zitadel los pone como: { "jefe": { "orgId": "..." }, "emp_adm": { "orgId": "..." } }
     * Las claves del mapa son los roleKeys del proyecto (en minúscula).
     */
    public List<String> extractRolesFromJwt(Jwt jwt) {
        Map<String, Object> rolesMap = jwt.getClaim("urn:zitadel:iam:org:project:roles");
        if (rolesMap == null || rolesMap.isEmpty()) {
            log.warn("JWT sin roles de proyecto. Asignando '{}' por defecto.", DEFAULT_ROLE);
            return List.of(DEFAULT_ROLE);
        }
        List<String> found = rolesMap.keySet().stream()
                .map(String::toLowerCase)
                .filter(KNOWN_ROLES::contains)
                .toList();
        if (found.isEmpty()) {
            log.warn("Ningún rol conocido en JWT {}. Asignando '{}' por defecto.", rolesMap.keySet(), DEFAULT_ROLE);
            return List.of(DEFAULT_ROLE);
        }
        return found;
    }

    /**
     * Retorna el rol primario (primero de la lista) para compatibilidad con campos que almacenan un solo rol.
     */
    public String extractRoleFromJwt(Jwt jwt) {
        return extractRolesFromJwt(jwt).get(0);
    }

    private String resolveEmail(Jwt jwt, String zitadelUserId) {
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) return email;
        return zitadelUserId + "@zitadel.local";
    }

    private String resolveFullName(Jwt jwt, String emailFallback) {
        String name = jwt.getClaimAsString("name");
        if (name != null && !name.isBlank()) return name;
        String given = jwt.getClaimAsString("given_name");
        String family = jwt.getClaimAsString("family_name");
        if (given != null && !given.isBlank()) return family != null ? given + " " + family : given;
        String preferred = jwt.getClaimAsString("preferred_username");
        if (preferred != null && !preferred.isBlank()) return preferred;
        return emailFallback;
    }
}
