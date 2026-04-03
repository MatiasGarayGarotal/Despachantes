package com.despachantes.api.service;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket:despachantes-docs}")
    private String bucket;

    public String uploadFile(MultipartFile file, String path) {
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(path)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
            return path;
        } catch (Exception e) {
            log.error("Error subiendo archivo a MinIO. Bucket: {}, Path: {}, Error: {}", bucket, path, e.getMessage(), e);
            throw new RuntimeException("Error al procesar el archivo en el storage: " + e.getMessage());
        }
    }

    public String getPresignedUrl(String path) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(path)
                            .expiry(2, TimeUnit.HOURS)
                            .build()
            );
        } catch (Exception e) {
            log.error("Error generando URL de MinIO: {}", e.getMessage());
            return null;
        }
    }

    public java.io.InputStream downloadStream(String path) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucket)
                            .object(path)
                            .build()
            );
        } catch (Exception e) {
            log.error("Error descargando archivo de MinIO: {}", e.getMessage());
            throw new RuntimeException("Archivo no disponible en storage: " + e.getMessage());
        }
    }
}
