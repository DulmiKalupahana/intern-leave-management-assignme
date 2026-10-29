package com.example.leave.security;

import com.example.leave.entity.Role;

import java.time.Instant;

/**
 * An authenticated login session. Tokens live in memory only: restarting the
 * backend signs everybody out, which is acceptable for a single-instance app.
 */
public record AuthSession(
        String token,
        Long employeeId,
        String name,
        String email,
        String department,
        Role role,
        Instant expiresAt
) {
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
