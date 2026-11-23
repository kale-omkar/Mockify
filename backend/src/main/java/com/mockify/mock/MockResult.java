package com.mockify.mock;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class MockResult {
    private final Map<String, Object> payload;
    private final int statusCode;
}

