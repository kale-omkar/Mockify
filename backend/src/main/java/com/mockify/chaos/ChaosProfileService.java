package com.mockify.chaos;

import com.mockify.config.ResourceNotFoundException;
import com.mockify.endpoint.Endpoint;
import com.mockify.endpoint.EndpointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChaosProfileService {

    private final ChaosProfileRepository chaosProfileRepository;
    private final EndpointRepository endpointRepository;
    private final ChaosMapper chaosMapper;

    @Transactional
    public ChaosProfileResponse create(ChaosProfileRequest req) {
        Endpoint endpoint = endpointRepository.findById(req.getEndpointId())
                .orElseThrow(() -> new ResourceNotFoundException("Endpoint not found"));

        ChaosProfile profile = new ChaosProfile();
        profile.setEndpoint(endpoint);
        profile.setLatencyMinMs(req.getLatencyMinMs());
        profile.setLatencyMaxMs(req.getLatencyMaxMs());
        profile.setErrorProbability(req.getErrorProbability());
        profile.setErrorStatusCode(req.getErrorStatusCode());

        return chaosMapper.toResponse(chaosProfileRepository.save(profile));
    }

    @Transactional
    public void delete(Long id) {
        ChaosProfile profile = chaosProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chaos Profile not found"));
        chaosProfileRepository.delete(profile);
    }
}

