package com.despachantes.api.model;

public enum DnaChannel {
    VERDE,    // Despacho automático, sin inspección
    NARANJA,  // Revisión documental por inspector
    ROJO      // Inspección física: se abre el contenedor
}
