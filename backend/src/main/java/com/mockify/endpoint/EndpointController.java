package com.mockify.endpoint;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/endpoints")
@RequiredArgsConstructor
public class EndpointController {

    private final EndpointService endpointService;

    @PostMapping
    public ResponseEntity<EndpointResponse> create(@Valid @RequestBody EndpointRequest req) {
        return ResponseEntity.ok(endpointService.create(req));
    }

    @GetMapping
    public ResponseEntity<List<EndpointResponse>> list(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(endpointService.listAll(skip, limit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        endpointService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Endpoint deleted successfully"));
    }
}

