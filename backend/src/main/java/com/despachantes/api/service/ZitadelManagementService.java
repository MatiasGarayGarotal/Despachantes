package com.despachantes.api.service;

import com.despachantes.api.config.ZitadelProperties;
import com.despachantes.api.dto.InternalUserDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Integración con la Zitadel Management REST API v1.
 *
 * Autenticación: Personal Access Token (PAT) de un Machine User con rol
 * "Org User Manager" en la organización de Zitadel.
 *
 * Responsabilidades de Zitadel (NO de la app):
 *   - Almacenar usuarios y contraseñas (nunca se guardan en PostgreSQL)
 *   - Definir los roleKeys del proyecto (deben crearse manualmente en Zitadel)
 *   - Enviar el email de activación al nuevo usuario
 *   - Gestionar sesiones, MFA y bloqueos
 *
 * Flujo de creación de usuario:
 *   1. POST /management/v1/users/human → Zitadel crea el usuario
 *   2. POST /management/v1/users/{id}/grants → Zitadel asigna el rol
 *
 * Paths correctos de la Management API v1:
 *   - Crear usuario:      POST /management/v1/users/human
 *   - Asignar grant:      POST /management/v1/users/{id}/grants
 *   - Buscar usuarios:    POST /management/v1/users/_search
 *   - Buscar grants:      POST /management/v1/users/grants/_search
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ZitadelManagementService {

    private final ZitadelProperties props;

    // ── Roles asignables ──────────────────────────────────────────────────────
    // Estos roleKeys deben existir creados en el proyecto Zitadel.
    public static final List<RoleOption> ASSIGNABLE_ROLES = List.of(
            new RoleOption("jefe",    "Jefe"),
            new RoleOption("emp_exp", "Empleado Exportaciones"),
            new RoleOption("emp_imp", "Empleado Importaciones"),
            new RoleOption("emp_adm", "Empleado Administrativo")
    );

    public record RoleOption(String key, String label) {}

    // ── Records para deserializar respuestas de Zitadel ──────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ZitadelProfile(
            @JsonProperty("firstName")   String firstName,
            @JsonProperty("lastName")    String lastName,
            @JsonProperty("displayName") String displayName
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ZitadelEmail(
            @JsonProperty("email")           String email,
            @JsonProperty("isEmailVerified") Boolean isEmailVerified
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ZitadelHuman(
            @JsonProperty("profile") ZitadelProfile profile,
            @JsonProperty("email")   ZitadelEmail email
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ZitadelUser(
            @JsonProperty("id")       String id,
            @JsonProperty("userName") String userName,
            @JsonProperty("state")    String state,
            @JsonProperty("human")    ZitadelHuman human
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UsersSearchResponse(
            @JsonProperty("result") List<ZitadelUser> result
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ZitadelGrant(
            @JsonProperty("id")        String id,          // ID del grant en Zitadel (necesario para PUT)
            @JsonProperty("userId")    String userId,
            @JsonProperty("projectId") String projectId,   // necesario para filtrar por proyecto en Java
            @JsonProperty("roleKeys")  List<String> roleKeys
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GrantsSearchResponse(
            @JsonProperty("result") List<ZitadelGrant> result
    ) {}

    /** Límite de resultados en búsquedas — evita el bug de paginación por defecto de Zitadel. */
    private static final int SEARCH_LIMIT = 1000;

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record CreateUserResponse(
            @JsonProperty("userId") String userId
    ) {}

    // ── Helpers ───────────────────────────────────────────────────────────────

    private RestClient buildClient() {
        return RestClient.builder()
                .baseUrl(props.getIssuerUri())
                .defaultHeader("Authorization", "Bearer " + props.getMachineToken())
                .defaultHeader("x-zitadel-orgid", props.getOrgId())
                .build();
    }

    private void checkConfigured() {
        if (props.getMachineToken() == null || props.getMachineToken().isBlank()) {
            throw new IllegalStateException(
                    "ZITADEL_MACHINE_TOKEN no está configurado. " +
                    "Creá un Machine User en Zitadel, generá un PAT y agregalo al .env.");
        }
        if (props.getOrgId() == null || props.getOrgId().isBlank()) {
            throw new IllegalStateException("ZITADEL_ORG_ID no está configurado.");
        }
    }

    /** Lee el body del error de Zitadel como texto para mostrarlo en los logs. */
    private String readErrorBody(org.springframework.http.client.ClientHttpResponse resp) {
        try {
            return new String(resp.getBody().readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "(no se pudo leer el body del error)";
        }
    }

    // ── Métodos públicos ──────────────────────────────────────────────────────

    /**
     * Lista todos los usuarios humanos de la organización con su rol de proyecto.
     * Los datos vienen de Zitadel, no de la base de datos de la aplicación.
     */
    public List<InternalUserDto> listUsers() {
        checkConfigured();
        RestClient client = buildClient();

        // 1. Buscar todos los usuarios humanos de la organización (con limit para evitar truncado por paginación)
        Map<String, Object> usersSearchBody = new HashMap<>();
        usersSearchBody.put("limit", SEARCH_LIMIT);
        usersSearchBody.put("queries", List.of(Map.of("typeQuery", Map.of("type", "TYPE_HUMAN"))));

        UsersSearchResponse usersResp = client.post()
                .uri("/management/v1/users/_search")
                .contentType(MediaType.APPLICATION_JSON)
                .body(usersSearchBody)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    String body = readErrorBody(resp);
                    log.error("Error buscando usuarios en Zitadel [{}]: {}", resp.getStatusCode(), body);
                    throw new RuntimeException("Zitadel rechazó la búsqueda de usuarios (" + resp.getStatusCode() + "): " + body);
                })
                .body(UsersSearchResponse.class);

        List<ZitadelUser> users = (usersResp != null && usersResp.result() != null)
                ? usersResp.result()
                : List.of();

        if (users.isEmpty()) return List.of();

        // 2. Buscar grants del proyecto para obtener todos los roles asignados (multi-rol)
        //    limit=SEARCH_LIMIT evita el bug de paginación: sin él, Zitadel retorna solo los primeros N
        //    y los demás usuarios aparecen sin rol tras un refresh.
        Map<String, List<String>> rolesByUserId = new HashMap<>();
        if (props.getProjectId() != null && !props.getProjectId().isBlank()) {
            try {
                Map<String, Object> grantsSearchBody = new HashMap<>();
                grantsSearchBody.put("limit", SEARCH_LIMIT);
                grantsSearchBody.put("queries", List.of(
                        Map.of("projectIdQuery", Map.of("projectId", props.getProjectId()))
                ));

                GrantsSearchResponse grantsResp = client.post()
                        .uri("/management/v1/users/grants/_search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(grantsSearchBody)
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, (req, resp) -> {
                            String body = readErrorBody(resp);
                            log.warn("No se pudieron obtener grants de Zitadel [{}]: {}", resp.getStatusCode(), body);
                            throw new RuntimeException("grants-fetch-failed");
                        })
                        .body(GrantsSearchResponse.class);

                if (grantsResp != null && grantsResp.result() != null) {
                    // Agrupa todos los roleKeys de cada usuario (un usuario puede tener varios roles)
                    for (ZitadelGrant g : grantsResp.result()) {
                        if (g.roleKeys() != null && !g.roleKeys().isEmpty()) {
                            rolesByUserId.merge(g.userId(), new java.util.ArrayList<>(g.roleKeys()),
                                    (existing, newRoles) -> {
                                        existing.addAll(newRoles);
                                        return existing;
                                    });
                        }
                    }
                }
            } catch (Exception e) {
                if (!e.getMessage().contains("grants-fetch-failed")) {
                    log.warn("No se pudieron cargar los roles de los usuarios: {}", e.getMessage());
                }
            }
        }

        // 3. Construir DTOs uniendo usuarios con su lista de roles
        final Map<String, List<String>> rolesMap = rolesByUserId;
        return users.stream()
                .map(u -> toDto(u, rolesMap.getOrDefault(u.id(), List.of())))
                .toList();
    }

    /**
     * Crea un nuevo usuario en Zitadel y le asigna el rol indicado.
     *
     * Zitadel es el responsable de:
     *   - Almacenar el usuario (nunca se guarda contraseña en esta app)
     *   - Enviar el email de inicialización (el usuario elige su contraseña en Zitadel)
     *   - Gestionar el estado del usuario (inicial → activo tras activar la cuenta)
     */
    public InternalUserDto createUser(String firstName, String lastName, String email, String role) {
        checkConfigured();
        RestClient client = buildClient();

        String displayName = firstName.trim() + " " + lastName.trim();

        // 1. Crear el Human User en Zitadel
        //    "sendCode: {}" indica a Zitadel que envíe el email de inicialización
        Map<String, Object> createBody = new HashMap<>();
        createBody.put("userName", email.toLowerCase().trim());

        Map<String, Object> profile = new HashMap<>();
        profile.put("firstName",         firstName.trim());
        profile.put("lastName",          lastName.trim());
        profile.put("displayName",       displayName);
        profile.put("preferredLanguage", "es");
        createBody.put("profile", profile);

        Map<String, Object> emailObj = new HashMap<>();
        emailObj.put("email",    email.toLowerCase().trim());
        emailObj.put("sendCode", new HashMap<>());  // Zitadel envía email de activación
        createBody.put("email", emailObj);

        CreateUserResponse created = client.post()
                .uri("/management/v1/users/human")
                .contentType(MediaType.APPLICATION_JSON)
                .body(createBody)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    String body = readErrorBody(resp);
                    log.error("Zitadel rechazó crear usuario [{}]: {}", resp.getStatusCode(), body);
                    throw new RuntimeException("No se pudo crear el usuario en Zitadel (" + resp.getStatusCode() + "): " + body);
                })
                .body(CreateUserResponse.class);

        if (created == null || created.userId() == null) {
            throw new RuntimeException("Zitadel no devolvió un userId al crear el usuario.");
        }

        String userId = created.userId();
        log.info("Usuario creado en Zitadel — userId={} email={} role={}", userId, email, role);

        // 2. Asignar el grant (rol del proyecto) al usuario
        //    REQUISITO: el roleKey debe existir en el proyecto Zitadel.
        //    Si no existe, Zitadel devuelve 400. Crearlo en: Proyecto → Roles.
        if (props.getProjectId() != null && !props.getProjectId().isBlank()) {
            Map<String, Object> grantBody = new HashMap<>();
            grantBody.put("projectId", props.getProjectId());
            grantBody.put("roleKeys",  List.of(role));

            client.post()
                    .uri("/management/v1/users/{userId}/grants", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(grantBody)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, resp) -> {
                        String body = readErrorBody(resp);
                        log.error("Zitadel rechazó asignar rol '{}' al usuario {} [{}]: {}", role, userId, resp.getStatusCode(), body);
                        throw new RuntimeException(
                                "Usuario creado pero no se pudo asignar el rol '" + role + "'. " +
                                "Verificá que ese rol exista en el proyecto Zitadel. " +
                                "Detalle: " + body
                        );
                    })
                    .toBodilessEntity();

            log.info("Rol '{}' asignado al usuario {} en Zitadel", role, userId);
        } else {
            log.warn("ZITADEL_PROJECT_ID no configurado — el usuario fue creado sin rol asignado.");
        }

        // 3. Devolver el DTO del usuario recién creado
        ZitadelUser syntheticUser = new ZitadelUser(
                userId,
                email.toLowerCase().trim(),
                "USER_STATE_INITIAL",
                new ZitadelHuman(
                        new ZitadelProfile(firstName.trim(), lastName.trim(), displayName),
                        new ZitadelEmail(email.toLowerCase().trim(), false)
                )
        );
        return toDto(syntheticUser, List.of(role));
    }

    /**
     * Desactiva un usuario en Zitadel. El usuario no podrá iniciar sesión
     * pero sus datos y grants se conservan íntegramente.
     */
    public void deactivateUser(String userId) {
        checkConfigured();
        buildClient().post()
                .uri("/management/v1/users/{userId}/deactivate", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    String body = readErrorBody(resp);
                    log.error("Zitadel rechazó desactivar usuario {} [{}]: {}", userId, resp.getStatusCode(), body);
                    throw new RuntimeException("No se pudo desactivar el usuario en Zitadel (" + resp.getStatusCode() + "): " + body);
                })
                .toBodilessEntity();
        log.info("Usuario {} desactivado en Zitadel", userId);
    }

    /**
     * Reactiva un usuario previamente desactivado en Zitadel.
     */
    public void reactivateUser(String userId) {
        checkConfigured();
        buildClient().post()
                .uri("/management/v1/users/{userId}/reactivate", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    String body = readErrorBody(resp);
                    log.error("Zitadel rechazó reactivar usuario {} [{}]: {}", userId, resp.getStatusCode(), body);
                    throw new RuntimeException("No se pudo reactivar el usuario en Zitadel (" + resp.getStatusCode() + "): " + body);
                })
                .toBodilessEntity();
        log.info("Usuario {} reactivado en Zitadel", userId);
    }

    /**
     * Reemplaza la lista completa de roles de un usuario en el proyecto.
     * Si ya tiene grant: PUT con la nueva lista.
     * Si no tiene grant y la lista no está vacía: crea uno nuevo.
     */
    public void updateUserRoles(String userId, List<String> newRoles) {
        checkConfigured();
        RestClient client = buildClient();

        if (props.getProjectId() == null || props.getProjectId().isBlank()) {
            throw new IllegalStateException("ZITADEL_PROJECT_ID no está configurado.");
        }
        if (newRoles == null || newRoles.isEmpty()) {
            throw new IllegalArgumentException("El usuario debe tener al menos un rol asignado.");
        }

        String grantId = findGrantId(client, userId);

        if (grantId != null) {
            Map<String, Object> body = new HashMap<>();
            body.put("roleKeys", newRoles);

            client.put()
                    .uri("/management/v1/users/{userId}/grants/{grantId}", userId, grantId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, resp) -> {
                        String rb = readErrorBody(resp);
                        log.error("Zitadel rechazó actualizar roles del usuario {} [{}]: {}", userId, resp.getStatusCode(), rb);
                        throw new RuntimeException("No se pudieron actualizar los roles en Zitadel (" + resp.getStatusCode() + "): " + rb);
                    })
                    .toBodilessEntity();
            log.info("Roles del usuario {} actualizados a {} (grantId={})", userId, newRoles, grantId);
        } else {
            Map<String, Object> grantBody = new HashMap<>();
            grantBody.put("projectId", props.getProjectId());
            grantBody.put("roleKeys",  newRoles);

            try {
                client.post()
                        .uri("/management/v1/users/{userId}/grants", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(grantBody)
                        .retrieve()
                        // 409 = el grant ya existe aunque findGrantId no lo encontró.
                        // Lanzamos un marcador para recuperar abajo con un PUT.
                        .onStatus(s -> s.value() == 409, (req, resp) -> {
                            String rb = readErrorBody(resp);
                            log.warn("Grant ya existe para usuario {} — intentando actualizar via PUT. Detalle: {}", userId, rb);
                            throw new RuntimeException("GRANT_ALREADY_EXISTS");
                        })
                        .onStatus(HttpStatusCode::isError, (req, resp) -> {
                            String rb = readErrorBody(resp);
                            log.error("Zitadel rechazó crear grant [{}] para usuario {} [{}]: {}", newRoles, userId, resp.getStatusCode(), rb);
                            throw new RuntimeException("No se pudo asignar el rol en Zitadel (" + resp.getStatusCode() + "): " + rb);
                        })
                        .toBodilessEntity();
                log.info("Nuevo grant {} asignado al usuario {}", newRoles, userId);

            } catch (RuntimeException e) {
                if (!"GRANT_ALREADY_EXISTS".equals(e.getMessage())) throw e;

                // El grant existe pero findGrantId no lo encontró en la primera llamada.
                // Re-intentamos la búsqueda ahora que sabemos con certeza que existe.
                String recoveredGrantId = findGrantId(client, userId);
                if (recoveredGrantId == null) {
                    throw new IllegalStateException(
                            "El grant ya existe en Zitadel (409) pero no se pudo recuperar su ID. " +
                            "Verificá que ZITADEL_PROJECT_ID sea correcto y que el Machine User " +
                            "tenga permiso 'Org User Manager'.");
                }

                Map<String, Object> putBody = new HashMap<>();
                putBody.put("roleKeys", newRoles);
                client.put()
                        .uri("/management/v1/users/{userId}/grants/{grantId}", userId, recoveredGrantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(putBody)
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, (req, resp) -> {
                            String rb = readErrorBody(resp);
                            log.error("Zitadel rechazó actualizar roles del usuario {} [{}]: {}", userId, resp.getStatusCode(), rb);
                            throw new RuntimeException("No se pudieron actualizar los roles en Zitadel (" + resp.getStatusCode() + "): " + rb);
                        })
                        .toBodilessEntity();
                log.info("Roles del usuario {} actualizados a {} via PUT (recuperación 409, grantId={})",
                        userId, newRoles, recoveredGrantId);
            }
        }
    }

    /**
     * Busca el ID del grant del usuario en el proyecto configurado.
     *
     * Estrategia: busca por userIdQuery (nunca retorna 404) y filtra por projectId en Java.
     * Evitamos usar solo projectIdQuery porque Zitadel puede devolver 404 NOT_FOUND cuando
     * el proyecto no tiene grants aún, en lugar del esperado 200 con lista vacía.
     *
     * Retorna null si el usuario no tiene grant en este proyecto.
     */
    private String findGrantId(RestClient client, String userId) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("limit", SEARCH_LIMIT);
            // Filtramos por userId — Zitadel siempre responde 200 con este filtro.
            // Luego filtramos por projectId en Java para no depender de que Zitadel
            // resuelva correctamente el projectIdQuery.
            body.put("queries", List.of(
                    Map.of("userIdQuery", Map.of("userId", userId))
            ));

            GrantsSearchResponse resp = client.post()
                    .uri("/management/v1/users/grants/_search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, r) -> {
                        String errBody = readErrorBody(r);
                        log.warn("Error buscando grantId para usuario {} [{}]: {}", userId, r.getStatusCode(), errBody);
                        throw new RuntimeException("grant-search-failed");
                    })
                    .body(GrantsSearchResponse.class);

            if (resp != null && resp.result() != null) {
                return resp.result().stream()
                        .filter(g -> props.getProjectId().equals(g.projectId()) && g.id() != null)
                        .map(ZitadelGrant::id)
                        .findFirst()
                        .orElse(null);
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener grantId para usuario {}: {}", userId, e.getMessage());
        }
        return null;
    }

    // ── Conversión ────────────────────────────────────────────────────────────

    private InternalUserDto toDto(ZitadelUser u, List<String> roles) {
        String firstName   = "";
        String lastName    = "";
        String displayName = nvl(u.userName(), "–");
        String email       = nvl(u.userName(), "–");

        if (u.human() != null) {
            if (u.human().profile() != null) {
                firstName   = nvl(u.human().profile().firstName());
                lastName    = nvl(u.human().profile().lastName());
                displayName = nvl(u.human().profile().displayName(), u.userName());
            }
            if (u.human().email() != null) {
                email = nvl(u.human().email().email(), u.userName());
            }
        }

        return new InternalUserDto(
                u.id(), firstName, lastName, displayName,
                email, nvl(u.userName(), "–"),
                roles != null ? roles : List.of(),
                mapState(u.state())
        );
    }

    private String mapState(String zitadelState) {
        if (zitadelState == null) return "Desconocido";
        return switch (zitadelState) {
            case "USER_STATE_ACTIVE"              -> "Activo";
            case "USER_STATE_INITIAL"             -> "Pendiente de activación";
            case "USER_STATE_INACTIVE"            -> "Inactivo";
            case "USER_STATE_LOCKED"              -> "Bloqueado";
            case "USER_STATE_DELETED"             -> "Eliminado";
            case "USER_STATE_SUSPEND"             -> "Suspendido";
            default                               -> zitadelState;
        };
    }

    private String nvl(String s) { return s != null ? s : ""; }
    private String nvl(String s, String fallback) { return (s != null && !s.isBlank()) ? s : fallback; }
}
