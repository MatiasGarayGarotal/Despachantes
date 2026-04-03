package com.despachantes.api.repository;

import com.despachantes.api.model.ContactType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactTypeRepository extends JpaRepository<ContactType, UUID> {
    List<ContactType> findByIsActiveTrueOrderBySortOrderAsc();
    List<ContactType> findAllByOrderBySortOrderAsc();
    boolean existsByCode(String code);
    Optional<ContactType> findBySortOrder(int sortOrder);
}
