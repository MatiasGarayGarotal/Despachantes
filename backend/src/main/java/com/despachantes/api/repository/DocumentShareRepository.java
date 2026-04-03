package com.despachantes.api.repository;

import com.despachantes.api.model.DocumentShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DocumentShareRepository extends JpaRepository<DocumentShare, UUID> {
    Optional<DocumentShare> findByToken(String token);
}
