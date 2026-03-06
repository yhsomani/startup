package com.talentsphere.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private ErrorDetail error;
    private Metadata metadata;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        private String code;
        private String message;
        private Map<String, String> details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metadata {
        private LocalDateTime timestamp;
        private String requestId;
        private Integer page;
        private Integer limit;
        private Long total;
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .metadata(Metadata.builder()
                        .timestamp(LocalDateTime.now())
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> success(T data, Metadata metadata) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .metadata(metadata)
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorDetail.builder()
                        .code(code)
                        .message(message)
                        .build())
                .metadata(Metadata.builder()
                        .timestamp(LocalDateTime.now())
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message, Map<String, String> details) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorDetail.builder()
                        .code(code)
                        .message(message)
                        .details(details)
                        .build())
                .metadata(Metadata.builder()
                        .timestamp(LocalDateTime.now())
                        .build())
                .build();
    }
}
