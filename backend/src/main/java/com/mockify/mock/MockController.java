package com.mockify.mock;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Dynamic Mock Engine -- catches all requests under /mock/{apiKey}/{**path}
 * for GET, POST, PUT, DELETE.
 */
@RestController
@RequestMapping("/mock")
@RequiredArgsConstructor
public class MockController {

    private final MockService mockService;

    @RequestMapping(
        value    = "/{apiKey}/**",
        method   = { RequestMethod.GET, RequestMethod.POST,
                     RequestMethod.PUT, RequestMethod.DELETE }
    )
    public ResponseEntity<Map<String, Object>> handleMock(
            @PathVariable String apiKey,
            HttpServletRequest request) throws InterruptedException {

        // Strip /mock/{apiKey}/ prefix to get the route path
        String fullPath  = request.getRequestURI();
        String prefix    = "/mock/" + apiKey + "/";
        String routePath = fullPath.startsWith(prefix)
                ? fullPath.substring(prefix.length())
                : fullPath.replace("/mock/" + apiKey, "").replaceAll("^/+", "");

        MockResult result = mockService.handle(apiKey, request.getMethod(), routePath);
        return ResponseEntity.status(result.getStatusCode()).body(result.getPayload());
    }
}
