package com.despachantes.api.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Propiedades de Zitadel leídas desde application.yaml / variables de entorno.
 *
 * machineToken: Personal Access Token de un Machine User con permisos de
 *   Org User Manager en Zitadel. Se usa para llamar a la Management REST API.
 * orgId: ID de la organización en Zitadel donde se crean los usuarios.
 * projectId: ID del proyecto en Zitadel donde están definidos los roles (roleKeys).
 */
@Component
@ConfigurationProperties(prefix = "zitadel")
@Data
public class ZitadelProperties {

    /** URL base de Zitadel. Ej: http://localhost:8080 */
    private String issuerUri = "http://localhost:8080";

    /** Personal Access Token del Machine User de servicio. */
    private String machineToken = "";

    /** ID de la organización en Zitadel. */
    private String orgId = "";

    /** ID del proyecto en Zitadel (donde están los roleKeys de la app). */
    private String projectId = "";
}
