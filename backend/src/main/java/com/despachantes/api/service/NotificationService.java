package com.despachantes.api.service;

import com.despachantes.api.model.EmailTemplate;
import com.despachantes.api.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailTemplateRepository emailTemplateRepository;

    @Value("${resend.api.key:re_placeholder}")
    private String resendApiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String fromEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Envía un email usando una plantilla almacenada en la DB.
     * Las variables se reemplazan buscando {{nombreVariable}} en subject y htmlBody.
     *
     * @param templateCode  Código de la plantilla (ej: SHARE_DOCUMENT)
     * @param variables     Mapa de nombre→valor para reemplazar
     * @param toEmail       Email del destinatario
     */
    public void sendTemplated(String templateCode, Map<String, String> variables, String toEmail) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Email del destinatario vacío, saltando notificación para template: {}", templateCode);
            return;
        }

        EmailTemplate template = emailTemplateRepository.findByCode(templateCode).orElse(null);
        if (template == null) {
            log.error("Plantilla de email no encontrada: {}", templateCode);
            return;
        }
        if (!template.isActive()) {
            log.info("Plantilla {} inactiva, saltando envío a: {}", templateCode, toEmail);
            return;
        }

        String subject = applyVariables(template.getSubject(), variables);
        String html    = applyVariables(template.getHtmlBody(), variables);

        sendEmail(toEmail, subject, html);
    }

    /**
     * Envía un email raw (sin template de DB).
     */
    public void sendEmail(String to, String subject, String htmlContent) {
        if ("re_placeholder".equals(resendApiKey)) {
            log.warn("RESEND_API_KEY no configurada. Saltando envío de email a: {}", to);
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("from", fromEmail);
        body.put("to", to);
        body.put("subject", subject);
        body.put("html", htmlContent);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.resend.com/emails", request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email enviado a: {}", to);
            } else {
                log.error("Error Resend ({}): {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Fallo en el servicio de notificaciones: {}", e.getMessage());
        }
    }

    private String applyVariables(String text, Map<String, String> variables) {
        if (text == null) return "";
        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
        }
        return result;
    }
}
