package com.mockify.chaos;

import com.mockify.endpoint.Endpoint;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "chaos_profiles")
@Getter @Setter @NoArgsConstructor
public class ChaosProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endpoint_id", nullable = false, unique = true)
    private Endpoint endpoint;

    @Column(name = "latency_min_ms", nullable = false)
    private int latencyMinMs = 0;

    @Column(name = "latency_max_ms", nullable = false)
    private int latencyMaxMs = 0;

    @Column(name = "error_probability", nullable = false)
    private double errorProbability = 0.0;

    @Column(name = "error_status_code", nullable = false)
    private int errorStatusCode = 500;
}

