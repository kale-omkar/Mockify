package com.mockify.chaos;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ChaosProfileResponse {
    private Long id;
    private Long endpointId;
    private int latencyMinMs;
    private int latencyMaxMs;
    private double errorProbability;
    private int errorStatusCode;
}

