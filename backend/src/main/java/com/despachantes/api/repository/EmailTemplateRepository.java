package com.despachantes.api.repository;

import com.despachantes.api.model.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {
    Optional<EmailTemplate> findByCode(String code);
    List<EmailTemplate> findAllByOrderByNameAsc();
}
