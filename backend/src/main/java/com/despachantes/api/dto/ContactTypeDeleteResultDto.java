package com.despachantes.api.dto;

public record ContactTypeDeleteResultDto(
    boolean deleted,
    boolean physical,
    String message
) {}
