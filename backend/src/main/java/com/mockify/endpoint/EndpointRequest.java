package com.mockify.endpoint;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter @Setter
public class EndpointRequest {

    @NotNull
    private Long projectId;

    @NotBlank
    private String httpMethod;

    @NotBlank
    private String routePath;

    @NotNull
    private Map<String, Object> responsePayload;

    private int defaultStatusCode = 200;
}

