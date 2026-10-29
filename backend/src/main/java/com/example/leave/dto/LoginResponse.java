package com.example.leave.dto;

import com.example.leave.entity.Role;
import com.example.leave.security.AuthSession;

public class LoginResponse {
    private String token;
    private Long employeeId;
    private String name;
    private String email;
    private String department;
    private Role role;

    public LoginResponse() {
    }

    public LoginResponse(String token, Long employeeId, String name, String email,
                         String department, Role role) {
        this.token = token;
        this.employeeId = employeeId;
        this.name = name;
        this.email = email;
        this.department = department;
        this.role = role;
    }

    public static LoginResponse from(AuthSession session) {
        return new LoginResponse(
                session.token(),
                session.employeeId(),
                session.name(),
                session.email(),
                session.department(),
                session.role()
        );
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
