package com.mockify.endpoint;

import com.mockify.chaos.ChaosProfile;
import com.mockify.project.Project;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Entity
@Table(name = "endpoints")
@Getter @Setter @NoArgsConstructor
public class Endpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod;

    @Column(name = "route_path", nullable = false, length = 255)
    private String routePath;

    @Column(name = "response_payload", nullable = false, columnDefinition = "JSON")
    @Convert(converter = JsonMapConverter.class)
    private Map<String, Object> responsePayload;

    @Column(name = "default_status_code", nullable = false)
    private int defaultStatusCode = 200;

    @OneToOne(mappedBy = "endpoint", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private ChaosProfile chaosProfile;
}

