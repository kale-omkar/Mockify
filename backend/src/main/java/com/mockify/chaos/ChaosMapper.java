package com.mockify.chaos;

import org.springframework.stereotype.Component;

@Component
public class ChaosMapper {

    public ChaosProfileResponse toResponse(ChaosProfile profile) {
        ChaosProfileResponse resp = new ChaosProfileResponse();
        resp.setId(profile.getId());
        resp.setEndpointId(profile.getEndpoint().getId());
        resp.setLatencyMinMs(profile.getLatencyMinMs());
        resp.setLatencyMaxMs(profile.getLatencyMaxMs());
        resp.setErrorProbability(profile.getErrorProbability());
        resp.setErrorStatusCode(profile.getErrorStatusCode());
        return resp;
    }
}

