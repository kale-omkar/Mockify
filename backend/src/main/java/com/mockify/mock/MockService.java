package com.mockify.mock;

import com.mockify.chaos.ChaosEngine;
import com.mockify.config.ResourceNotFoundException;
import com.mockify.endpoint.Endpoint;
import com.mockify.endpoint.EndpointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Mock Service -- looks up the endpoint by api_key + method + path,
 * applies the chaos profile, and returns the mock payload.
 */
@Service
@RequiredArgsConstructor
public class MockService {

    private final EndpointRepository endpointRepository;
    private final ChaosEngine chaosEngine;

    @Transactional(readOnly = true)
    public MockResult handle(String apiKey, String method, String path) throws InterruptedException {
        Endpoint endpoint = endpointRepository
                .findByApiKeyAndMethodAndPath(apiKey, method.toUpperCase(), path)
                .orElseThrow(() -> new ResourceNotFoundException("Mock endpoint not found."));

        // Apply chaos (latency + error injection)
        chaosEngine.applyChaos(endpoint.getChaosProfile());

        return new MockResult(endpoint.getResponsePayload(), endpoint.getDefaultStatusCode());
    }
}
