package com.despachantes.api.controller;

import com.despachantes.api.dto.EmailTemplateDto;
import com.despachantes.api.model.EmailTemplate;
import com.despachantes.api.repository.AppUserRepository;
import com.despachantes.api.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/email-templates")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateRepository emailTemplateRepository;
    private final AppUserRepository appUserRepository;

    @GetMapping
    public List<EmailTemplateDto> getAll() {
        return emailTemplateRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmailTemplateDto> getById(@PathVariable UUID id) {
        return emailTemplateRepository.findById(id)
                .map(t -> ResponseEntity.ok(toDto(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmailTemplateDto> update(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {

        return emailTemplateRepository.findById(id).map(template -> {
            if (body.containsKey("name"))     template.setName((String) body.get("name"));
            if (body.containsKey("subject"))  template.setSubject((String) body.get("subject"));
            if (body.containsKey("htmlBody")) template.setHtmlBody((String) body.get("htmlBody"));
            if (body.containsKey("active"))   template.setActive((Boolean) body.get("active"));

            // Registrar quién editó
            String zitadelId = jwt.getSubject();
            appUserRepository.findByZitadelUserId(zitadelId)
                    .ifPresent(template::setUpdatedBy);

            return ResponseEntity.ok(toDto(emailTemplateRepository.save(template)));
        }).orElse(ResponseEntity.notFound().build());
    }

    private EmailTemplateDto toDto(EmailTemplate t) {
        return new EmailTemplateDto(
            t.getId(),
            t.getCode(),
            t.getName(),
            t.getSubject(),
            t.getHtmlBody(),
            t.getVariablesDoc(),
            t.isActive(),
            t.getUpdatedAt(),
            t.getUpdatedBy() != null ? t.getUpdatedBy().getFullName() : null
        );
    }
}
