package com.example.leave.controller;

import com.example.leave.entity.Account;
import com.example.leave.entity.Employee;
import com.example.leave.entity.LeaveRequest;
import com.example.leave.entity.LeaveStatus;
import com.example.leave.entity.LeaveType;
import com.example.leave.entity.Role;
import com.example.leave.repository.AccountRepository;
import com.example.leave.repository.EmployeeRepository;
import com.example.leave.repository.LeaveRequestRepository;
import com.example.leave.security.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end authentication and role checks with enforcement switched on.
 */
@SpringBootTest(properties = {"app.auth.enabled=true"})
@ActiveProfiles("test")
@Transactional
class AuthFlowTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private Employee employee;
    private Employee admin;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        leaveRequestRepository.deleteAll();
        accountRepository.deleteAll();
        employeeRepository.deleteAll();

        employee = createEmployee("Alice Employee", "alice@example.com");
        createAccount(employee, "employee-pass", Role.EMPLOYEE);

        admin = createEmployee("Adam Admin", "admin@example.com");
        createAccount(admin, "admin-pass", Role.ADMIN);
    }

    @Test
    void login_validEmployee_returnsTokenAndEmployeeRole() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("alice@example.com", "employee-pass", "EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role", is("EMPLOYEE")))
                .andExpect(jsonPath("$.employeeId", is(employee.getId().intValue())))
                .andExpect(jsonPath("$.name", is("Alice Employee")));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("alice@example.com", "wrong-pass", "EMPLOYEE")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    void login_employeeAccountOnAdminButton_returns403() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("alice@example.com", "employee-pass", "ADMIN")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/leaves"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void employeeToken_cannotListEmployees_returns403() throws Exception {
        String token = login("alice@example.com", "employee-pass", "EMPLOYEE");

        mockMvc.perform(get("/api/employees").header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeToken_onlySeesOwnLeaveRequests() throws Exception {
        createLeave(employee, LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 3), LeaveStatus.PENDING);
        createLeave(admin, LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 10), LeaveStatus.PENDING);

        String token = login("alice@example.com", "employee-pass", "EMPLOYEE");

        mockMvc.perform(get("/api/leaves").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].employeeName", is("Alice Employee")));
    }

    @Test
    void employeeToken_cannotApproveLeave_returns403() throws Exception {
        LeaveRequest leave = createLeave(employee, LocalDate.of(2026, 11, 2),
                LocalDate.of(2026, 11, 3), LeaveStatus.PENDING);
        String token = login("alice@example.com", "employee-pass", "EMPLOYEE");

        mockMvc.perform(patch("/api/leaves/{id}/approve", leave.getId())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminToken_canApproveAnyLeave() throws Exception {
        LeaveRequest leave = createLeave(employee, LocalDate.of(2026, 11, 2),
                LocalDate.of(2026, 11, 3), LeaveStatus.PENDING);
        String token = login("admin@example.com", "admin-pass", "ADMIN");

        mockMvc.perform(patch("/api/leaves/{id}/approve", leave.getId())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));
    }

    @Test
    void admin_canCreateEmployee_andNewEmployeeCanLogin() throws Exception {
        String adminToken = login("admin@example.com", "admin-pass", "ADMIN");

        mockMvc.perform(post("/api/employees")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Bob New",
                                "email", "bob@example.com",
                                "department", "Finance",
                                "password", "bob-pass-123"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is("bob@example.com")));

        String employeeToken = login("bob@example.com", "bob-pass-123", "EMPLOYEE");

        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("EMPLOYEE")))
                .andExpect(jsonPath("$.name", is("Bob New")));
    }

    @Test
    void employee_canSubmitOwnLeave_andStatusStartsPending() throws Exception {
        String token = login("alice@example.com", "employee-pass", "EMPLOYEE");

        mockMvc.perform(post("/api/leaves")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", admin.getId(),
                                "leaveType", "ANNUAL",
                                "startDate", "2026-12-01",
                                "endDate", "2026-12-02",
                                "reason", "Family trip"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId", is(employee.getId().intValue())))
                .andExpect(jsonPath("$.status", is("PENDING")));
    }

    @Test
    void logout_invalidatesToken() throws Exception {
        String token = login("alice@example.com", "employee-pass", "EMPLOYEE");

        mockMvc.perform(post("/api/auth/logout").header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/leaves").header("Authorization", bearer(token)))
                .andExpect(status().isUnauthorized());
    }

    private String login(String email, String password, String role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(email, password, role)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("token").asText();
    }

    private String loginBody(String email, String password, String role) {
        return objectMapper.writeValueAsString(Map.of(
                "email", email,
                "password", password,
                "role", role));
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private Employee createEmployee(String name, String email) {
        Employee created = new Employee();
        created.setName(name);
        created.setEmail(email);
        created.setDepartment("Operations");
        return employeeRepository.save(created);
    }

    private void createAccount(Employee owner, String password, Role role) {
        Account account = new Account();
        account.setEmployee(owner);
        account.setEmail(owner.getEmail());
        account.setPasswordHash(PasswordHasher.hash(password));
        account.setRole(role);
        accountRepository.save(account);
    }

    private LeaveRequest createLeave(Employee owner, LocalDate start, LocalDate end, LeaveStatus status) {
        LeaveRequest leave = new LeaveRequest();
        leave.setEmployee(owner);
        leave.setLeaveType(LeaveType.ANNUAL);
        leave.setStartDate(start);
        leave.setEndDate(end);
        leave.setReason("Test leave");
        leave.setStatus(status);
        return leaveRequestRepository.save(leave);
    }
}
