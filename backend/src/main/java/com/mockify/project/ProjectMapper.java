package com.mockify.project;

import com.mockify.endpoint.EndpointMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProjectMapper {

    private final EndpointMapper endpointMapper;

    public ProjectResponse toResponse(Project project) {
        ProjectResponse resp = new ProjectResponse();
        resp.setId(project.getId());
        resp.setName(project.getName());
        resp.setApiKey(project.getApiKey());
        resp.setEndpoints(project.getEndpoints().stream()
                .map(endpointMapper::toResponse)
                .collect(Collectors.toList()));
        return resp;
    }
}

