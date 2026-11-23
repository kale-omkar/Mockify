package com.mockify.project;

import com.mockify.endpoint.EndpointResponse;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class ProjectResponse {
    private Long id;
    private String name;
    private String apiKey;
    private List<EndpointResponse> endpoints;
}

