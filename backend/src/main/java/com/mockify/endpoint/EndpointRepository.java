package com.mockify.endpoint;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EndpointRepository extends JpaRepository<Endpoint, Long> {

    @Query("SELECT e FROM Endpoint e JOIN e.project p " +
           "WHERE p.apiKey = :apiKey AND e.httpMethod = :method AND e.routePath = :path")
    Optional<Endpoint> findByApiKeyAndMethodAndPath(
            @Param("apiKey") String apiKey,
            @Param("method") String method,
            @Param("path") String path);
}

