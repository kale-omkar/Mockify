package com.mockify.chaos;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ChaosProfileRequest {

    @NotNull
    private Long endpointId;

    private int latencyMinMs = 0;
    private int latencyMaxMs = 0;
    private double errorProbability = 0.0;
    private int errorStatusCode = 500;
}

