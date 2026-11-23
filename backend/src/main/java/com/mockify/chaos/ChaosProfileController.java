package com.mockify.chaos;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chaos-profiles")
@RequiredArgsConstructor
public class ChaosProfileController {

    private final ChaosProfileService chaosProfileService;

    @PostMapping
    public ResponseEntity<ChaosProfileResponse> create(@Valid @RequestBody ChaosProfileRequest req) {
        return ResponseEntity.ok(chaosProfileService.create(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        chaosProfileService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Chaos Profile deleted successfully"));
    }
}

