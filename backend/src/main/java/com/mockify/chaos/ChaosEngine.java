package com.mockify.chaos;

import com.mockify.config.ChaosException;
import org.springframework.stereotype.Component;

import java.util.Random;

/**
 * Chaos Engine -- injects latency and random errors into mock responses.
 * Equivalent to the Python chaos/engine.py apply_chaos() function.
 */
@Component
public class ChaosEngine {

    private final Random random = new Random();

    /**
     * Apply latency and probabilistic error injection based on a chaos profile.
     * @param profile the chaos profile (may be null for no chaos)
     * @throws ChaosException if error injection fires
     * @throws InterruptedException if latency sleep is interrupted
     */
    public void applyChaos(ChaosProfile profile) throws InterruptedException {
        if (profile == null) return;

        // 1. Latency injection
        if (profile.getLatencyMaxMs() > 0) {
            int min = profile.getLatencyMinMs();
            int max = profile.getLatencyMaxMs();
            int delayMs = min + random.nextInt(max - min + 1);
            if (delayMs > 0) {
                Thread.sleep(delayMs);
            }
        }

        // 2. Error injection
        if (profile.getErrorProbability() > 0) {
            if (random.nextDouble() < profile.getErrorProbability()) {
                throw new ChaosException(
                        profile.getErrorStatusCode(),
                        "ChaosMock: Intentionally injected error based on probability."
                );
            }
        }
    }
}
