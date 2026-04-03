package com.despachantes.api.model;

/**
 * Estados del workflow de una operación (carpeta digital).
 * El flujo típico es lineal pero puede retroceder en casos excepcionales.
 * Confirmar estados exactos con Gabriel López Vener.
 */
public enum OperationStatus {
    APERTURA,
    DOCUMENTACION_EN_PROCESO,
    DOCUMENTACION_COMPLETA,
    NUMERADO,            // DUA asignado en Mega 6
    INGRESO_PUERTO,      // Mercadería ingresó al recinto portuario (EXPORTACION)
    CANAL_ASIGNADO,      // DNA asignó canal (VERDE/NARANJA/ROJO)
    EN_DEPOSITO,         // Mercadería en zona portuaria/depósito
    LEVANTE,             // Aduana liberó la mercadería
    RETIRADO,            // Cliente retiró la mercadería
    FACTURADO,           // Despachante emitió liquidación de gastos
    CERRADO              // Cliente pagó, operación completa
}
