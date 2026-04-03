package com.despachantes.api.repository;

import com.despachantes.api.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByOperationId(UUID operationId);
}
