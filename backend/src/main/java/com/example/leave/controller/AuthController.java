package com.example.leave.controller;

import com.example.leave.dto.LoginRequest;
import com.example.leave.dto.LoginResponse;
import com.example.leave.exception.InvalidCredentialsException;
import com.example.leave.security.AuthInterceptor;
import com.example.leave.security.AuthService;
import com.example.leave.security.AuthSession;
import com.example.leave.security.PublicEndpoint;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PublicEndpoint
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return new ResponseEntity<>(authService.login(request), HttpStatus.OK);
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me(HttpServletRequest request) {
        AuthSession session = (AuthSession) request.getAttribute(AuthInterceptor.SESSION_ATTRIBUTE);
        if (session == null) {
            throw new InvalidCredentialsException("Please sign in to continue");
        }
        return ResponseEntity.ok(LoginResponse.from(session));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String header) {
        authService.logout(header);
        return ResponseEntity.noContent().build();
    }
}
