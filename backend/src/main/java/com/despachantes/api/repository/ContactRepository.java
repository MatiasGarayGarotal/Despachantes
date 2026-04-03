package com.despachantes.api.repository;

import com.despachantes.api.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {
    List<Contact> findByClientIdAndDeletedAtIsNullOrderBySortOrderAsc(UUID clientId);
    boolean existsByContactTypeIdAndDeletedAtIsNull(UUID contactTypeId);
}
