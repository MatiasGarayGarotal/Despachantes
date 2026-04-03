package com.despachantes.api.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    @Value("${STORAGE_ENDPOINT:http://localhost:9010}")
    private String url;

    @Value("${STORAGE_ACCESS_KEY}")
    private String accessKey;

    @Value("${STORAGE_SECRET_KEY}")
    private String secretKey;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
    }
}
