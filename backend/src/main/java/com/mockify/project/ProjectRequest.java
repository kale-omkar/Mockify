package com.mockify.project;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ProjectRequest {
    @NotBlank(message = "name is required")
    private String name;
}

