package com.despachantes.api.repository;

import com.despachantes.api.model.Operation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperationRepository extends JpaRepository<Operation, UUID> {
    Optional<Operation> findByNroCarpeta(String nroCarpeta);
    boolean existsByNroCarpeta(String nroCarpeta);
    List<Operation> findByClientIdOrderByFechaAperturaDesc(UUID clientId);
}
