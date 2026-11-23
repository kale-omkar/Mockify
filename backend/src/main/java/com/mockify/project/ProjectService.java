package com.mockify.project;

import com.mockify.config.ResourceNotFoundException;
import com.mockify.endpoint.EndpointMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;

    @Transactional
    public ProjectResponse create(ProjectRequest req) {
        Project project = new Project();
        project.setName(req.getName());
        project.setApiKey(UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        return projectMapper.toResponse(projectRepository.save(project));
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listAll(int skip, int limit) {
        return projectRepository.findAll().stream()
                .skip(skip)
                .limit(limit)
                .map(projectMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return projectMapper.toResponse(project);
    }

    @Transactional
    public void delete(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        projectRepository.delete(project);
    }
}

