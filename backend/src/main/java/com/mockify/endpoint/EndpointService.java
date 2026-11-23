package com.mockify.endpoint;

import com.mockify.config.ResourceNotFoundException;
import com.mockify.project.Project;
import com.mockify.project.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EndpointService {

    private final EndpointRepository endpointRepository;
    private final ProjectRepository projectRepository;
    private final EndpointMapper endpointMapper;

    @Transactional
    public EndpointResponse create(EndpointRequest req) {
        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Endpoint endpoint = new Endpoint();
        endpoint.setProject(project);
        endpoint.setHttpMethod(req.getHttpMethod().toUpperCase());
        endpoint.setRoutePath(req.getRoutePath().replaceAll("^/+", ""));
        endpoint.setResponsePayload(req.getResponsePayload());
        endpoint.setDefaultStatusCode(req.getDefaultStatusCode());

        return endpointMapper.toResponse(endpointRepository.save(endpoint));
    }

    @Transactional(readOnly = true)
    public List<EndpointResponse> listAll(int skip, int limit) {
        return endpointRepository.findAll().stream()
                .skip(skip)
                .limit(limit)
                .map(endpointMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        Endpoint endpoint = endpointRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Endpoint not found"));
        endpointRepository.delete(endpoint);
    }
}

