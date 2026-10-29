package com.example.leave.security;

import com.example.leave.dto.LoginRequest;
import com.example.leave.dto.LoginResponse;
import com.example.leave.entity.Account;
import com.example.leave.entity.Employee;
import com.example.leave.entity.Role;
import com.example.leave.exception.ForbiddenAccessException;
import com.example.leave.exception.InvalidCredentialsException;
import com.example.leave.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {
    private static final Duration SESSION_TTL = Duration.ofHours(12);
    private static final int TOKEN_BYTES = 32;
    private static final String BEARER_PREFIX = "Bearer ";

    private final AccountRepository accountRepository;
    private final Map<String, AuthSession> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public AuthService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public LoginResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (request.getPassword() == null
                || !PasswordHasher.matches(request.getPassword(), account.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (request.getRole() != null && request.getRole() != account.getRole()) {
            throw new ForbiddenAccessException(request.getRole() == Role.ADMIN
                    ? "This account does not have administrator access"
                    : "This is an administrator account. Use Admin Login instead.");
        }

        Employee employee = account.getEmployee();
        purgeExpiredSessions();

        String token = newToken();
        AuthSession session = new AuthSession(
                token,
                employee.getId(),
                employee.getName(),
                email,
                employee.getDepartment(),
                account.getRole(),
                Instant.now().plus(SESSION_TTL)
        );
        sessions.put(token, session);

        return LoginResponse.from(session);
    }

    public Optional<AuthSession> findSession(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        if (token == null) {
            return Optional.empty();
        }

        AuthSession session = sessions.get(token);
        if (session == null) {
            return Optional.empty();
        }

        if (session.isExpired()) {
            sessions.remove(token);
            return Optional.empty();
        }

        return Optional.of(session);
    }

    public void logout(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        if (token != null) {
            sessions.remove(token);
        }
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }

        String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }

    private String newToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void purgeExpiredSessions() {
        sessions.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
