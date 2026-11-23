package com.mockify.config;

public class ChaosException extends RuntimeException {
    private final int status;

    public ChaosException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}

