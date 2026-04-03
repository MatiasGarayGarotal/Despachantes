package com.despachantes.api.dto;

import java.util.List;

/**
 * Representa un usuario interno de la agencia en la UI.
 *
 * Los datos vienen de Zitadel Management API, no de la BD de la app.
 * Un usuario puede tener múltiples roles asignados en el mismo proyecto Zitadel.
 *
 * @param id          ID del usuario en Zitadel.
 * @param firstName   Nombre.
 * @param lastName    Apellido.
 * @param displayName Nombre completo.
 * @param email       Email principal.
 * @param userName    Username en Zitadel (generalmente el email).
 * @param roles       Lista de roleKeys del proyecto asignados (emp_adm, jefe, etc.). Vacía si no tiene grant.
 * @param state       Estado del usuario en español (Activo, Inactivo, Bloqueado, etc.).
 */
public record InternalUserDto(
        String id,
        String firstName,
        String lastName,
        String displayName,
        String email,
        String userName,
        List<String> roles,
        String state
) {}
