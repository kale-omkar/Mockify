package com.mockify.chaos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChaosProfileRepository extends JpaRepository<ChaosProfile, Long> {
}

