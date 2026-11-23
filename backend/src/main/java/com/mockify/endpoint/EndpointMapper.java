package com.mockify.endpoint;

import com.mockify.chaos.ChaosMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EndpointMapper {

    private final ChaosMapper chaosMapper;

    public EndpointResponse toResponse(Endpoint endpoint) {
        EndpointResponse resp = new EndpointResponse();
        resp.setId(endpoint.getId());
        resp.setProjectId(endpoint.getProject().getId());
        resp.setHttpMethod(endpoint.getHttpMethod());
        resp.setRoutePath(endpoint.getRoutePath());
        resp.setResponsePayload(endpoint.getResponsePayload());
        resp.setDefaultStatusCode(endpoint.getDefaultStatusCode());
        if (endpoint.getChaosProfile() != null) {
            resp.setChaosProfile(chaosMapper.toResponse(endpoint.getChaosProfile()));
        }
        return resp;
    }
}

