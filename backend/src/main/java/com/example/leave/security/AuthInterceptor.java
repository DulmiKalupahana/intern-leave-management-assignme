package com.example.leave.security;

import com.example.leave.entity.Role;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Optional;

/**
 * Enforces authentication and administrator-only endpoints for every
 * {@code /api/**} handler. Public endpoints opt out with {@link PublicEndpoint}.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {
    public static final String SESSION_ATTRIBUTE = "auth.session";

    private final AuthService authService;
    private final boolean enabled;

    public AuthInterceptor(AuthService authService,
                           @Value("${app.auth.enabled:true}") boolean enabled) {
        this.authService = authService;
        this.enabled = enabled;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!enabled || HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        if (!(handler instanceof HandlerMethod handlerMethod) || isPublic(handlerMethod)) {
            return true;
        }

        Optional<AuthSession> session = authService.findSession(request.getHeader("Authorization"));
        if (session.isEmpty()) {
            return writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Unauthorized", "Please sign in to continue");
        }

        request.setAttribute(SESSION_ATTRIBUTE, session.get());

        if (isAdminOnly(handlerMethod) && session.get().role() != Role.ADMIN) {
            return writeError(response, HttpServletResponse.SC_FORBIDDEN,
                    "Forbidden", "Administrator access is required");
        }

        return true;
    }

    private boolean isPublic(HandlerMethod handlerMethod) {
        return handlerMethod.hasMethodAnnotation(PublicEndpoint.class)
                || handlerMethod.getBeanType().isAnnotationPresent(PublicEndpoint.class);
    }

    private boolean isAdminOnly(HandlerMethod handlerMethod) {
        return handlerMethod.hasMethodAnnotation(AdminOnly.class)
                || handlerMethod.getBeanType().isAnnotationPresent(AdminOnly.class);
    }

    private boolean writeError(HttpServletResponse response, int status, String error, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":" + status
                + ",\"error\":\"" + error + "\""
                + ",\"message\":\"" + message + "\"}");
        return false;
    }
}
