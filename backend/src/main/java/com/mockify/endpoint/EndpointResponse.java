package com.mockify.endpoint;

import com.mockify.chaos.ChaosProfileResponse;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter @Setter
public class EndpointResponse {
    private Long id;
    private Long projectId;
    private String httpMethod;
    private String routePath;
    private Map<String, Object> responsePayload;
    private int defaultStatusCode;
    private ChaosProfileResponse chaosProfile;
}

